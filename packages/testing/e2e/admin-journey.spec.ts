// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test,expect,type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { JourneyFixture,type JourneyAccount } from './journey-fixture.js';
import { CreatedUserCleanup } from './created-user-cleanup.js';
import { ResponseContracts } from '../../contracts/decoders.js';
class Gate {
  readonly promise:Promise<void>;private resolve:()=>void=()=>{};
  constructor(){this.promise=new Promise(resolve=>{this.resolve=resolve;});}
  open():void{this.resolve();}
}
class AdminJourneySuite {
  private readonly fixture=new JourneyFixture();
  private readonly cleanup=new CreatedUserCleanup();
  private async login(page:Page,account:JourneyAccount,locale:'ar'|'en'='ar',theme:'light'|'dark'='dark'):Promise<void>{
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(JourneyFixture.origin);
    await expect(page.locator('#login-submit')).toBeEnabled();
    if(locale==='en')await page.locator('#auth-language').click();
    if(theme==='light')await page.locator('#auth-theme').click();
    await page.locator('#email').fill(account.email);await page.locator('#password').fill(account.password);
    const loginResponse=page.waitForResponse(response=>response.url()===`${JourneyFixture.origin}/api/login`&&response.request().method()==='POST');
    await page.locator('#login-submit').click();const response=await loginResponse;
    expect(response.status(),'Login HTTP status').toBe(200);
    expect(errors,'Browser module errors').toEqual([]);
    await expect(page.locator('#workspace'),await page.locator('#login-error').innerText()).toBeVisible();
    await expect(page.locator('#password')).toHaveValue('');
  }
  register():void{
    test.afterEach(async()=>{await this.cleanup.clean();});
    for(const locale of ['ar','en'] as const)for(const theme of ['light','dark'] as const){
      test(`Reference journey ${locale}/${theme}: login, resume draft, edit user, audit and scoped CSV`,async({page})=>{
        const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
        await this.login(page,this.fixture.account('admin'),locale,theme);
        await expect(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
        await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
        await page.locator('#nav-drafts').click();await expect(page.locator('#draft-name')).toBeEnabled();
        const name=`قمة ${randomUUID().slice(0,8)}`;
        await page.locator('#draft-name').fill(name);await page.locator('#draft-organization').fill('مؤسسة اختبار مستقلة');
        await expect(page.locator('#draft-status')).toHaveText(locale==='ar'?'تم الحفظ في الخادم':'Saved on server');
        await page.reload();await expect(page.locator('#draft-name')).toHaveValue(name);
        // The prototype intentionally starts Arabic/dark on reload; set current UI explicitly.
        if(locale==='en')await page.locator('#language-button').click();
        if(theme==='light')await page.locator('#theme-button').click();
        await page.locator('#nav-users').click();await page.locator('#add-user').click();
        const email=`${randomUUID()}@example.test`;
        await page.locator('#user-name').fill(name);await page.locator('#user-email').fill(email);
        const creation=page.waitForResponse(response=>response.url()===`${JourneyFixture.origin}/api/users`&&response.request().method()==='POST');
        await page.locator('#save-user').click();
        this.cleanup.track(await (await creation).json(),email);await expect(page.locator('#user-dialog')).not.toBeVisible();
        await page.locator('#search').fill(name);
        const row=page.locator('#users-body tr').filter({hasText:name});await expect(row).toHaveCount(1);
        await row.locator('button').click();const edited=`${name} <script>test</script>`;
        await page.locator('#user-name').fill(edited);await page.locator('#save-user').click();
        await expect(page.locator('#user-dialog')).not.toBeVisible();await expect(page.locator('#users-body')).toContainText(edited);
        await expect(page.locator('#users-body script')).toHaveCount(0);
        const downloadPromise=page.waitForEvent('download');await page.locator('#export-button').click();const download=await downloadPromise;
        const path=await download.path();expect(path).not.toBeNull();if(!path)throw new Error('CSV download path missing');
        const csv=await readFile(path,'utf8');expect(csv).toContain(edited);expect(csv).not.toContain('password_hash');
        expect(csv).toContain(locale==='ar'?'الاسم':'Name');
        const failedExport=await page.request.get(`${JourneyFixture.origin}/api/users/export?sort=unsupported`);
        expect(failedExport.status()).toBe(422);
        expect(failedExport.headers()['content-type']).toMatch(/^application\/json\b/);
        expect(failedExport.headers()['content-disposition']).toBeUndefined();
        expect(await failedExport.json()).toEqual({error:'invalid_sort',requestId:failedExport.headers()['x-request-id']});
        await page.locator('#nav-audit').click();await expect(page.locator('#audit-body')).toContainText('users:update');
        await page.locator('#signout-button').click();await expect(page.locator('#login-screen')).toBeVisible();
        expect((await page.request.get(`${JourneyFixture.origin}/api/me`)).status()).toBe(401);
        expect(errors).toEqual([]);
      });
    }
    test('Viewer cannot bypass hidden controls using direct API requests',async({page})=>{
      await this.login(page,this.fixture.account('viewer'));
      await expect(page.locator('#add-user')).not.toBeVisible();await expect(page.locator('#nav-audit')).not.toBeVisible();
      expect((await page.request.get(`${JourneyFixture.origin}/api/audit`)).status()).toBe(403);
      expect((await page.request.get(`${JourneyFixture.origin}/api/users/export`)).status()).toBe(403);
      expect((await page.request.post(`${JourneyFixture.origin}/api/users`,{headers:{origin:JourneyFixture.origin},data:{name:'Escalation',email:'test@example.test',role:'admin',status:'active',version:0}})).status()).toBe(403);
    });
    test('Editor cannot change an administrator through a direct record request',async({page})=>{
      await this.login(page,this.fixture.account('editor'));const admin=this.fixture.account('admin');
      const result=await page.request.put(`${JourneyFixture.origin}/api/users/${admin.id}`,{headers:{origin:JourneyFixture.origin},data:{name:'Forbidden',email:admin.email,role:'admin',status:'active',version:0}});
      expect(result.status()).toBe(403);
    });
    test('Draft network failure keeps edits and explicit retry persists them',async({page})=>{
      await this.login(page,this.fixture.account('admin'));await page.locator('#nav-drafts').click();await expect(page.locator('#draft-name')).toBeEnabled();
      let fail=true;await page.route('**/api/draft',async route=>{if(route.request().method()==='PUT'&&fail){fail=false;await route.abort('internetdisconnected');}else await route.continue();});
      const value=`Offline ${randomUUID().slice(0,8)}`;await page.locator('#draft-name').fill(value);
      await expect(page.locator('#draft-status')).toContainText('تعذر الاتصال');await expect(page.locator('#draft-name')).toHaveValue(value);
      await page.locator('#draft-retry').click();await expect(page.locator('#draft-status')).toHaveText('تم الحفظ في الخادم');
      await page.reload();await expect(page.locator('#draft-name')).toHaveValue(value);
    });
    test('Delayed account A draft response cannot populate account B workspace',async({page})=>{
      await this.login(page,this.fixture.account('admin'));const captured=new Gate();const release=new Gate();const finished=new Gate();let once=true;
      await page.locator('#search').fill('Private account A search');
      await page.route('**/api/draft',async route=>{
        if(route.request().method()==='GET'&&once){once=false;const response=await route.fetch();captured.open();await release.promise;
          try{await route.fulfill({response});}finally{finished.open();}
        }else await route.continue();
      });
      await page.locator('#nav-drafts').click();await captured.promise;
      await page.locator('#signout-button').click();await expect(page.locator('#login-screen')).toBeVisible();
      const viewer=this.fixture.account('viewer');await page.locator('#email').fill(viewer.email);await page.locator('#password').fill(viewer.password);
      await page.locator('#login-submit').click();await expect(page.locator('#draft-name')).toBeEnabled();
      release.open();await finished.promise;await expect(page.locator('#draft-name')).toHaveValue('');
      await expect(page.locator('#search')).toHaveValue('');
      const result=await page.request.get(`${JourneyFixture.origin}/api/draft`);const value:unknown=await result.json();
      expect(new ResponseContracts().draft(value).name).toBe('');
    });
  }
}
new AdminJourneySuite().register();
