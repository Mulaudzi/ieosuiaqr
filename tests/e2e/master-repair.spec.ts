import { expect, test } from '@playwright/test';

const token=process.env.QR_TEST_TOKEN || '';
const itemId=process.env.QR_TEST_ITEM_ID || '';
const qrId=process.env.QR_TEST_QR_ID || '';
const api='http://127.0.0.1:8081/api';
const auth={ Authorization:`Bearer ${token}` };

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
});

test('selecting Event never crashes and invalid API dates are controlled',async({page,request})=>{
  test.skip(!token,'Local owner token unavailable');await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/dashboard/create');await page.getByRole('button',{name:/Event Calendar event/}).click();await page.getByRole('button',{name:/Next/}).click();
  await expect(page.getByText('Event Title')).toBeVisible();expect(errors).toEqual([]);
  const invalid=await request.post(`${api}/qr`,{headers:auth,data:{name:'Invalid event',type:'event',content:{title:'Invalid',startDate:'2027-02-29',startTime:'10:00',endDate:'2027-02-29',endTime:'11:00'}}});
  expect(invalid.status()).toBe(422);
});

test('all QR types still create, save, scan and resolve through the canonical API',async({request})=>{
  test.skip(!token,'Local owner token unavailable');
  const cases:Record<string,Record<string,unknown>>={url:{content:'https://example.com'},text:{content:'hello'},email:{content:'test@example.com'},phone:{content:'+27123456789'},sms:{phoneNumber:'+27123456789',message:'hello'},whatsapp:{phoneNumber:'+27123456789',message:'hello'},wifi:{ssid:'Test',password:'secret',encryption:'WPA'},vcard:{fullName:'Test User',phone:'+27123456789'},event:{title:'Boundary event',description:'test',startDate:'2028-02-29',startTime:'23:59',endDate:'2028-03-01',endTime:'00:01',location:'HQ'},location:{latitude:'-26.2041',longitude:'28.0473',address:'',inputMode:'coordinates'},social:{links:JSON.stringify([{platform:'website',url:'https://example.com'}])},app:{appStoreUrl:'https://apps.apple.com/app/id123',playStoreUrl:'https://play.google.com/store/apps/details?id=test',linkType:'both'}};
  const ids:string[]=[];
  try{for(const [type,content] of Object.entries(cases)){const created=await request.post(`${api}/qr`,{headers:auth,data:{name:`Regression ${type}`,type,content}});expect(created.status(),`${type} create`).toBe(201);const body=await created.json();const id=String(body.data.id);ids.push(id);const saved=await request.get(`${api}/qr/${id}`,{headers:auth});expect(saved.status(),`${type} save/read`).toBe(200);const scan=await request.get(`${api}/scan/log?id=${id}&response=json`);expect(scan.status(),`${type} scan`).toBe(200);expect((await scan.json()).data.type).toBe(type);}}
  finally{for(const id of ids)await request.delete(`${api}/qr/${id}`,{headers:auth});}
});

test('atomic QR plus inventory creation is retry-safe and resolves to the new item',async({request})=>{
  test.skip(!token,'Local owner token unavailable');const key=crypto.randomUUID();let item='';let qr='';
  try{const first=await request.post(`${api}/inventory/with-qr`,{headers:auth,data:{name:'Atomic inventory test',category:'Supplies',inventory_type:'quantity',quantity:8,minimum_stock_level:3,location:'Warehouse',idempotency_key:key}});expect(first.status()).toBe(201);const body=await first.json();item=String(body.data.item.id);qr=String(body.data.qr_id);
    const retry=await request.post(`${api}/inventory/with-qr`,{headers:auth,data:{name:'Atomic inventory test',category:'Supplies',inventory_type:'quantity',quantity:8,minimum_stock_level:3,location:'Warehouse',idempotency_key:key}});expect(retry.status()).toBe(200);expect((await retry.json()).data.duplicate).toBe(true);
    const scan=await request.get(`${api}/scan/log?id=${qr}&response=json`);expect((await scan.json()).data.redirect_url).toContain(`/scan/${qr}`);
  }finally{if(item)await request.delete(`${api}/inventory/${item}`,{headers:auth});if(qr)await request.delete(`${api}/qr/${qr}`,{headers:auth});}
});
