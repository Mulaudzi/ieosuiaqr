import { expect, test } from '@playwright/test';

const api='http://localhost:8081/api';

test('legacy local admin authentication is retired',async({request})=>{
  for(const endpoint of ['/admin/auth/batch','/admin/auth/step1','/admin/auth/step2','/admin/auth/step3']){
    const response=await request.post(`${api}${endpoint}`,{data:{email:'legacy@example.test',password1:'x',password2:'x',password3:'x'}});
    expect(response.status(),endpoint).toBe(410);
    expect((await response.json()).message).toMatch(/central|retired|no longer/i);
  }
});

test('admin API fails closed without a Central Auth admin session',async({request})=>{
  for(const endpoint of ['/admin/verify','/admin/users','/admin/emails','/admin/settings','/admin/stats','/admin/audit']){
    const response=await request.get(`${api}${endpoint}`);expect(response.status(),endpoint).toBe(401);
  }
});

test('admin browser entry hands off to Central Auth',async({page})=>{
  await page.goto('/admin/login',{waitUntil:'domcontentloaded'});await page.waitForURL(url=>url.hostname==='auth.ieosuia.com');expect(new URL(page.url()).hostname).toBe('auth.ieosuia.com');
});
