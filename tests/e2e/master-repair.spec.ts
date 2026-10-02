import { expect, test } from '@playwright/test';

const token=process.env.QR_TEST_TOKEN || '';
const itemId=process.env.QR_TEST_ITEM_ID || '';
const qrId=process.env.QR_TEST_QR_ID || '';
const api='http://127.0.0.1:8081/api';
const auth={ Authorization:`Bearer ${token}` };
if(process.env.QR_REQUIRE_FIXTURES==='1'&&(!token||!itemId||!qrId))throw new Error('Required deep-acceptance fixtures are missing');

test('anonymous inventory QR resolves to safe public detail without login',async({page})=>{
  test.skip(!qrId,'No linked local inventory QR');
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`/go/${qrId}`);await expect(page).toHaveURL(new RegExp(`/scan/${qrId}`));
  await expect(page.getByText('Sign in to manage this inventory')).toBeVisible();
  await expect(page).not.toHaveURL(/login/);expect(errors).toEqual([]);
});

for(const width of [360,390,430,768]) test(`inventory scan has no horizontal overflow at ${width}px`,async({page})=>{
  test.skip(!qrId,'No linked local inventory QR');await page.setViewportSize({width,height:844});await page.goto(`/scan/${qrId}`);
  await expect(page.locator('main')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('authenticated owner can open protected inventory actions and history',async({page})=>{
  test.skip(!token||!itemId,'Local owner token unavailable');await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  await page.goto(`/dashboard/inventory/${itemId}`);await expect(page).toHaveURL(new RegExp(`/dashboard/inventory/${itemId}`));
  await expect(page.getByText('Actions',{exact:true})).toBeVisible();await expect(page.getByText('Movement history',{exact:true})).toBeVisible();
  await page.getByPlaceholder('Reason contains').fill('Initial');await page.getByLabel('History from date').fill('2000-01-01');await page.getByRole('button',{name:'Apply filters'}).click();
  const detail=page.locator('.inventory-history-print details').first();await expect(detail).toHaveCount(1);await detail.evaluate(element=>{(element as HTMLDetailsElement).open=true;});await expect(detail.getByText('Workflow:',{exact:false})).toBeVisible();
  await page.emulateMedia({media:'print'});await expect(page.locator('.inventory-history-print')).toBeVisible();await expect(page.locator('.inventory-history-print')).toContainText('Filters: reason=Initial');await expect(detail.getByText('Workflow:',{exact:false})).toBeVisible();await expect(page.locator('aside')).toBeHidden();await page.emulateMedia({media:'screen'});
});

test('delayed movement history does not block authorized inventory actions',async({page},testInfo)=>{
  test.skip(!token||!itemId,'Local owner token unavailable');await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  let releaseHistory!:()=>void;const historyBarrier=new Promise<void>(resolve=>{releaseHistory=resolve;});let historyReleased=false;
  await page.route(/\/api\/inventory\/[^/]+\/movements(?:\?|$)/,async route=>{await historyBarrier;historyReleased=true;await route.continue();});
  const historyResponse=page.waitForResponse(response=>/\/api\/inventory\/[^/]+\/movements(?:\?|$)/.test(response.url())&&response.status()===200);
  const started=Date.now();let actionsElapsed=0;try{await page.goto(`/dashboard/inventory/${itemId}`);await expect(page.getByRole('button',{name:'Add stock',exact:true})).toBeVisible({timeout:20_000});await expect(page.getByRole('button',{name:'Add stock',exact:true})).toBeEnabled();actionsElapsed=Date.now()-started;expect(historyReleased).toBe(false);expect(actionsElapsed).toBeLessThan(20_000);}finally{releaseHistory();}
  await historyResponse;const historyElapsed=Date.now()-started;
  await testInfo.attach('inventory-readiness-timing.json',{body:Buffer.from(JSON.stringify({actions_elapsed_ms:actionsElapsed,history_elapsed_ms:historyElapsed,history_was_blocked_until_action_ready:true})),contentType:'application/json'});
  expect(actionsElapsed).toBeLessThan(historyElapsed);await expect(page.locator('.inventory-history-print details').first()).toBeVisible();
});

test('inventory history export and movement analytics are authorized and usable',async({request})=>{
  test.skip(!token||!itemId,'Local owner token unavailable');
  const filtered=await request.get(`${api}/inventory/${itemId}/movements?reason=Initial&page=1&per_page=1`,{headers:auth});expect(filtered.status()).toBe(200);const filteredBody=await filtered.json();expect(Array.isArray(filteredBody.data.items)).toBe(true);expect(filteredBody.data.items.length).toBeLessThanOrEqual(1);expect(filteredBody.data.pagination).toMatchObject({page:1,per_page:1});expect(filteredBody.data.pagination.total_pages).toBe(Math.ceil(filteredBody.data.pagination.total));
  const beyond=await request.get(`${api}/inventory/${itemId}/movements?reason=Initial&page=${filteredBody.data.pagination.total_pages+1}&per_page=1`,{headers:auth});expect(beyond.status()).toBe(200);expect((await beyond.json()).data.items).toEqual([]);
  const exported=await request.get(`${api}/inventory/${itemId}/movements/export?reason=Initial`,{headers:auth});expect(exported.status()).toBe(200);expect(exported.headers()['content-type']).toContain('text/csv');expect((await exported.body()).length).toBeGreaterThan(40);
  const analytics=await request.get(`${api}/inventory/analytics?period=30d`,{headers:auth});expect(analytics.status()).toBe(200);const body=await analytics.json();expect(Array.isArray(body.data.movements_by_action)).toBe(true);expect(Array.isArray(body.data.movements_by_location)).toBe(true);expect(body.data.period.days).toBe(30);
});

test('selecting Event never crashes and invalid API dates are controlled',async({page,request})=>{
  test.skip(!token,'Local owner token unavailable');await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/dashboard/create');await page.getByRole('button',{name:/Event Calendar event/}).click();await page.getByRole('button',{name:/Next/}).click();
  await expect(page.getByText('Event Title')).toBeVisible();expect(errors).toEqual([]);
  const invalid=await request.post(`${api}/qr`,{headers:auth,data:{name:'Invalid event',type:'event',content:{title:'Invalid',startDate:'2027-02-29',startTime:'10:00',endDate:'2027-02-29',endTime:'11:00'}}});
  expect(invalid.status()).toBe(422);
});

test('all QR types create, read, edit, render, download, scan, resolve and report analytics',async({request,page})=>{
  test.setTimeout(120_000);
  test.skip(!token,'Local owner token unavailable');await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  const cases:Record<string,Record<string,unknown>>={url:{content:'https://example.com'},text:{content:'hello'},email:{content:'test@example.com'},phone:{content:'+27123456789'},sms:{phoneNumber:'+27123456789',message:'hello'},whatsapp:{phoneNumber:'+27123456789',message:'hello'},wifi:{ssid:'Test',password:'secret',encryption:'WPA'},vcard:{fullName:'Test User',phone:'+27123456789'},event:{title:'Boundary event',description:'test',startDate:'2028-02-29',startTime:'23:59',endDate:'2028-03-01',endTime:'00:01',location:'HQ'},location:{latitude:'-26.2041',longitude:'28.0473',address:'',inputMode:'coordinates'},social:{links:JSON.stringify([{platform:'website',url:'https://example.com'}])},app:{appStoreUrl:'https://apps.apple.com/app/id123',playStoreUrl:'https://play.google.com/store/apps/details?id=test',linkType:'both'}};
  const ids:string[]=[];
  try{for(const [type,content] of Object.entries(cases)){const created=await request.post(`${api}/qr`,{headers:auth,data:{name:`Regression ${type}`,type,content}});expect(created.status(),`${type} create`).toBe(201);const body=await created.json();const id=String(body.data.id);ids.push(id);
    const saved=await request.get(`${api}/qr/${id}`,{headers:auth});expect(saved.status(),`${type} save/read`).toBe(200);expect((await saved.json()).data.type).toBe(type);
    const updated=await request.put(`${api}/qr/${id}`,{headers:auth,data:{name:`Regression ${type} edited`,content,custom_options:{fgColor:'#123456',bgColor:'#ffffff'}}});expect(updated.status(),`${type} edit`).toBe(200);
    await page.goto(`/dashboard/edit/${id}`,{waitUntil:'domcontentloaded'});const preview=page.getByText('Preview',{exact:true}).locator('xpath=../..');await expect(preview.locator('svg').first(),`${type} render`).toBeVisible();
    await page.getByRole('button',{name:'Download',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('menuitem',{name:/SVG Vector/}).click();const download=await downloadPromise;expect(download.suggestedFilename(),`${type} download name`).toMatch(/\.svg$/i);expect((await download.createReadStream())?.readable,`${type} download bytes`).toBe(true);
    const scan=await request.get(`${api}/scan/log?id=${id}&response=json`);expect(scan.status(),`${type} scan`).toBe(200);const scanBody=await scan.json();expect(scanBody.data.type).toBe(type);expect(scanBody.data.redirect_url||scanBody.data.content,`${type} destination`).toBeTruthy();
    const scans=await request.get(`${api}/qr/${id}/scans`,{headers:auth});expect(scans.status(),`${type} analytics`).toBe(200);const stats=await request.get(`${api}/qr/${id}/stats`,{headers:auth});expect(stats.status(),`${type} stats`).toBe(200);
  }}
  finally{for(const id of ids)await request.delete(`${api}/qr/${id}`,{headers:auth});}
});

test('atomic QR plus inventory creation is retry-safe and resolves to the new item',async({request})=>{
  test.skip(!token,'Local owner token unavailable');const key=crypto.randomUUID();let item='';let qr='';
  try{const first=await request.post(`${api}/inventory/with-qr`,{headers:auth,data:{name:'Atomic inventory test',category:'Supplies',inventory_type:'quantity',quantity:8,minimum_stock_level:3,location:'Warehouse',idempotency_key:key}});expect(first.status()).toBe(201);const body=await first.json();item=String(body.data.item.id);qr=String(body.data.qr_id);
    const retry=await request.post(`${api}/inventory/with-qr`,{headers:auth,data:{name:'Atomic inventory test',category:'Supplies',inventory_type:'quantity',quantity:8,minimum_stock_level:3,location:'Warehouse',idempotency_key:key}});expect(retry.status()).toBe(200);expect((await retry.json()).data.duplicate).toBe(true);
    const scan=await request.get(`${api}/scan/log?id=${qr}&response=json`);expect((await scan.json()).data.redirect_url).toContain(`/scan/${qr}`);
    const invalidDate=await request.post(`${api}/inventory/${item}/stock-counts`,{headers:auth,data:{counted_quantity:8,location:'Warehouse',reason:'count_error',count_date:'2027-02-29 10:00:00',idempotency_key:crypto.randomUUID()}});expect(invalidDate.status()).toBe(422);
    const malformedDate=await request.post(`${api}/inventory/${item}/stock-counts`,{headers:auth,data:{counted_quantity:8,location:'Warehouse',reason:'count_error',count_date:'2027-02-28 10:00:00 trailing',idempotency_key:crypto.randomUUID()}});expect(malformedDate.status()).toBe(422);
    const longNotes=await request.post(`${api}/inventory/${item}/stock-counts`,{headers:auth,data:{counted_quantity:8,location:'Warehouse',reason:'count_error',notes:'x'.repeat(5001),idempotency_key:crypto.randomUUID()}});expect(longNotes.status()).toBe(422);
  }finally{if(item)await request.delete(`${api}/inventory/${item}`,{headers:auth});if(qr)await request.delete(`${api}/qr/${qr}`,{headers:auth});}
});
