const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const ORIGIN='https://5390857.com',ROOT=process.cwd(),report={tests:[],screens:[]};let browser;
async function test(name,f){try{await f();report.tests.push({name,passed:true})}catch(e){report.tests.push({name,passed:false,error:String(e.stack)})}fs.writeFileSync('choice-audit.json',JSON.stringify(report,null,2));console.log(report.tests.at(-1));}
async function setup(width,blocked=false){const c=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block'});c.setDefaultTimeout(12000);await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==ORIGIN)return r.fulfill({status:204,body:''});const p=u.pathname==='/'?'index.html':u.pathname.slice(1),f=path.resolve(ROOT,p);if(!f.startsWith(ROOT+'/')||!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({contentType:p.endsWith('.html')?'text/html':p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'application/octet-stream',body:fs.readFileSync(f)});});await c.addInitScript(({blocked})=>{window.__printed=0;window.__opens=[];window.__copies=[];window.print=()=>window.__printed++;window.open=(...a)=>{window.__opens.push(a);return{opener:null}};const ac=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.href.startsWith('https://line.me/')){window.__opens.push([this.href]);return;}return ac.call(this)};Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>window.__copies.push(t)}});document.execCommand=()=>true;if(blocked){if(window.self===window.top)localStorage.setItem('hs_5390857_quote_draft_v11',JSON.stringify({updatedAt:Date.now(),serviceCategory:'water_tank',wtTonnage:'200',wtMaterial:'frp',wtPoolCount:'2',chkPvcValve:true,chkTax:true}));Storage.prototype.setItem=function(){throw Error('quota blocked')};}},{blocked});return c;}
const specs={
 'water-tank':['calc-schedule-mode','calc-region','calc-tonnage','calc-material','calc-pool-count'],
 'cooling-tower':['ct-schedule-mode','ct-region','ct-rt-scale','ct-tower-type','ct-tower-count'],
 'ac-cleaning':['ac-schedule-mode','ac-region','ac-unit-type','ac-qty-tier'],
 'motor-pump-valve':['mpv-schedule-mode','mpv-region','mpv-main-cat','mpv-sub-spec','mpv-scale-tier','mpv-qty'],
 shop:['shop-item-select','shop-region','shop-qty']};
async function choose(p,id,index=0){const s=p.locator('#'+id),wrap=s.locator('xpath=following-sibling::*[1]');const opts=await s.locator('option').count();index=Math.min(index,opts-1);if(await wrap.locator('input[type=radio]').count())await wrap.locator('input[type=radio]').nth(index).check();else{await s.selectOption({index});if(await wrap.locator('.hs-confirm-select').isVisible())await wrap.locator('.hs-confirm-select').click();}await p.waitForTimeout(25);}
async function shown(p){await p.locator('#hs-inline-paper-document').waitFor({state:'visible'});assert(await p.locator('#hs-inline-paper-document #qp-table-tbody tr').count()>0);assert.equal(await p.evaluate(()=>window.__printed),0);assert.equal(await p.evaluate(()=>window.__opens.length),0);}
(async()=>{for(const engine of ['chromium','webkit']){browser=await ({chromium,webkit}[engine]).launch();
for(const width of [320,390,1280]) await test(engine+' header '+width,async()=>{const c=await setup(width),p=await c.newPage();for(const name of ['index','water-tank','cooling-tower','ac-cleaning','motor-pump-valve','shop','quote']){await p.goto(ORIGIN+'/'+name+'.html');assert.equal(await p.locator('.brand-sub').innerText(),'商用空調保養維修｜冷卻水塔・自來水塔清洗');assert(await p.locator('.brand-sub').isVisible());assert(await p.locator('.brand-area').isVisible());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}await p.screenshot({path:'header-'+engine+'-'+width+'.png'});await c.close();});
for(const width of engine==='chromium'?[320,390,1280]:[390]){
for(const name of [...Object.keys(specs),'quote'])await test(engine+' '+name+' '+width,async()=>{const c=await setup(width),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.goto(ORIGIN+'/'+name+'.html');assert(await p.locator('.hs-choice-grid').count()>0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(name!=='quote'){
assert(await p.locator('#hs-inline-quote').isHidden());assert(await p.locator('.calc-result-box').isHidden());
for(const id of specs[name]){await choose(p,id,(id==='calc-tonnage'?1:0));}
await shown(p);const url=await p.locator('.hs-open-quote').getAttribute('href');assert(url.includes('from='+name));
// Invalidate immediately rather than leaving a stale quotation visible.
const last=p.locator('#'+specs[name].at(-1)).locator('xpath=following-sibling::*[1]');await last.locator('.hs-unsure').click();assert(await p.locator('#hs-inline-quote').isHidden());await choose(p,specs[name].at(-1),name==='motor-pump-valve'?0:1);await shown(p);
if(name==='water-tank'){
 await choose(p,'calc-tonnage',0);await choose(p,'calc-material',0);assert(await p.locator('#hs-inline-quote').isHidden());assert(await p.locator('#hs-confirm-no-entry').isVisible());await p.locator('#hs-confirm-no-entry').check();await shown(p);assert((await p.locator('.hs-open-quote').getAttribute('href')).includes('noentry=1'));
 await p.locator('#hs-confirm-no-entry').uncheck();assert(await p.locator('#hs-inline-quote').isHidden());await p.locator('#hs-confirm-no-entry').check();await shown(p);await p.locator('#chk-tax').check();await shown(p);
}
if(width===390){await p.locator('.hs-choice-progress').scrollIntoViewIfNeeded();await p.screenshot({path:`cards-${engine}-${name}.png`});await p.locator('#hs-inline-quote').scrollIntoViewIfNeeded();await p.screenshot({path:`preview-${engine}-${name}.png`});}
await p.locator('.hs-open-quote').click();await p.waitForURL('**/quote.html?**');assert(await p.locator('#qp-paper-sheet').isVisible());assert(await p.locator('#quote-actions').isVisible());assert.equal(await p.evaluate(()=>window.__opens.length),0);
await p.locator('#btn-q-print').click();assert.equal(await p.evaluate(()=>window.__printed),1);await p.locator('#btn-q-line').click();assert.equal(await p.evaluate(()=>window.__opens.length),1);
}else{
assert(await p.locator('#qp-paper-sheet').isHidden());await choose(p,'q-service-category',1);await choose(p,'q-display-mode',0);await choose(p,'q-ct-rt',1);await choose(p,'q-ct-type',0);await choose(p,'q-ct-count',0);await choose(p,'q-tax-mode',0);assert(await p.locator('#qp-paper-sheet').isVisible());await choose(p,'q-service-category',0);assert(await p.locator('#qp-paper-sheet').isHidden());
}
assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await c.close();});}
await test(engine+' storage-write blocked explicit choice',async()=>{const c=await setup(390,true),p=await c.newPage();await p.goto(ORIGIN+'/water-tank.html');assert.equal(await p.locator('#chk-pvc-valve').isChecked(),false);for(const id of specs['water-tank'])await choose(p,id,id==='calc-tonnage'?1:0);await shown(p);assert((await p.locator('#hs-inline-paper-document').innerText()).includes('13,000'));assert((await p.locator('#hs-inline-paper-document').innerText()).includes('待填客戶名稱'));await c.close();});
await test(engine+' invalid imported links remain unconfirmed',async()=>{const c=await setup(390),p=await c.newPage();for(const qs of ['from=water-tank','from=water-tank&cat=water_tank&mode=priority_50&reg='+encodeURIComponent('台北市 / 新北市')+'&ton=999&mat=concrete&pools=0&tax=0']){await p.goto(ORIGIN+'/quote.html?'+qs);assert(await p.locator('#qp-paper-sheet').isHidden());}await c.close();});
await test(engine+' cross tab option changes invalidate',async()=>{const c=await setup(390),p=await c.newPage();await p.goto(ORIGIN+'/water-tank.html');for(const id of specs['water-tank'])await choose(p,id,id==='calc-tonnage'?1:0);await shown(p);const other=await c.newPage();await other.goto(ORIGIN+'/index.html');await other.evaluate(()=>{const key='hs_5390857_quote_draft_v11',d=JSON.parse(localStorage.getItem(key));d.chkTax=!d.chkTax;d.updatedAt=Date.now();localStorage.setItem(key,JSON.stringify(d));});await p.waitForTimeout(500);assert(await p.locator('#hs-inline-quote').isHidden());await c.close();});
await test(engine+' quick changes and back navigation',async()=>{const c=await setup(390),p=await c.newPage();await p.goto(ORIGIN+'/water-tank.html');for(const id of specs['water-tank'])await choose(p,id,id==='calc-tonnage'?1:0);await shown(p);await choose(p,'calc-pool-count',0);await choose(p,'calc-pool-count',2);await choose(p,'calc-pool-count',1);await shown(p);assert((await p.locator('.hs-open-quote').getAttribute('href')).includes('pools=1'));await p.locator('.hs-open-quote').click();await p.waitForURL('**/quote.html?**');await p.goBack();assert(new URL(p.url()).pathname==='/water-tank.html');assert(await p.locator('.hs-choice-grid').count()>0);await c.close();});

await test(engine+' missing scripts never show sample price',async()=>{const c=await setup(390);await c.route('**/*.js*',r=>r.abort());const p=await c.newPage();for(const name of ['water-tank','ac-cleaning','quote']){await p.goto(ORIGIN+'/'+name+'.html');assert(await p.locator('#hs-estimate-loading').isVisible());if(name==='quote')assert(await p.locator('#qp-paper-sheet').isHidden());else assert(await p.locator('.calc-result-box').isHidden());}await c.close();});

function numbers(row){return row.locator('td.num-col').allTextContents().then(a=>a.map(x=>Number(x.replace(/[^0-9.-]/g,''))));}
const qp=(qs)=>ORIGIN+'/quote.html?from=share&dmode=ab_compare&tax=0&'+qs;
for(const width of [390,1280]){
await test(engine+' confirmed chlorine pricing '+width,async()=>{const c=await setup(width),p=await c.newPage();
 for(const qty of [1,2]){
  await p.goto(ORIGIN+'/quote.html?from=shop&shopmode=chlorine_only&qty='+qty+'&reg='+encodeURIComponent('台北市 / 新北市')+'&tax=0');
  await p.locator('#qp-paper-sheet').waitFor({state:'visible'});
  assert.deepEqual(await numbers(p.locator('#qp-table-tbody tr').first()),[3200*qty,3200*qty]);
 }
 for(const mode of ['chlorine_with_ct','chlorine_with_wt','both_shop_items']){
  await p.goto(ORIGIN+'/quote.html?from=shop&shopmode='+mode+'&qty=2&reg='+encodeURIComponent('台北市 / 新北市')+'&tax=0');
  await p.locator('#qp-paper-sheet').waitFor({state:'visible'});
  const rows=p.locator('#qp-table-tbody tr'),ch=rows.filter({hasText:'TCCA'});assert.equal(await ch.count(),1);assert.deepEqual(await numbers(ch),[5360,5360]);assert(await rows.count()>1);
 }
 for(const qs of ['cat=shop_chlorine','cat=shop_chlorine&shopmode=both_shop_items&cl25=1']){
  await p.goto(qp(qs));await p.locator('#qp-paper-sheet').waitFor({state:'visible'});assert.deepEqual(await numbers(p.locator('#qp-table-tbody tr').first()),[3200,3200]);
 }
 for(const qs of ['cat=ac_cleaning&actype=split&acqty=base','cat=mpv_repair&mpvspec=split_major&mpvtier=tier_std&mpvqty=2','cat=water_tank&ton=50&mat=concrete&pools=0']){
  await p.goto(qp(qs+'&cl25=1'));await p.locator('#qp-paper-sheet').waitFor({state:'visible'});assert.deepEqual(await numbers(p.locator('#qp-table-tbody tr').filter({hasText:'TCCA'})),[2680,2680]);
 }
 await p.locator('#btn-toggle-tech-specs').click();await choose(p,'q-service-category',8);await choose(p,'q-display-mode',0);await choose(p,'q-tax-mode',1);await p.locator('#qp-paper-sheet').waitFor({state:'visible'});assert.deepEqual(await numbers(p.locator('#qp-table-tbody tr').first()),[3200,3200]);
 await p.screenshot({path:`pricing-${engine}-${width}.png`});await c.close();});
await test(engine+' all repair units discounted at 2+ '+width,async()=>{const c=await setup(width),p=await c.newPage();
 for(const qty of [1,2,3,4]){await p.goto(qp('cat=mpv_repair&mpvspec=split_major&mpvtier=tier_std&mpvqty='+qty));await p.locator('#qp-paper-sheet').waitFor({state:'visible'});const f=qty>=2?.9:1;assert.deepEqual(await numbers(p.locator('#qp-table-tbody tr').first()),[6000*qty*f,4500*qty*f]);}
 await p.goto(ORIGIN+'/motor-pump-valve.html');for(const id of specs['motor-pump-valve'])await choose(p,id,id==='mpv-sub-spec'?2:0);await shown(p);
 for(const qty of [2,3,4]){await choose(p,'mpv-qty',qty-1);await shown(p);assert.deepEqual(await numbers(p.locator('#hs-inline-paper-document #qp-table-tbody tr').first()),[6000*qty*.9,4500*qty*.9]);}
 await c.close();});
}
await test(engine+' shop select and recovery with stored draft',async()=>{const c=await setup(390),p=await c.newPage();await p.goto(ORIGIN+'/shop.html');await choose(p,'shop-item-select',2);await choose(p,'shop-region',0);await choose(p,'shop-qty',1);await shown(p);assert.deepEqual(await numbers(p.locator('#hs-inline-paper-document #qp-table-tbody tr').first()),[6400,6400]);await p.locator('.hs-open-quote').click();await p.waitForURL('**/quote.html?**');assert.deepEqual(await numbers(p.locator('#qp-table-tbody tr').first()),[6400,6400]);await p.locator('#btn-q-print').click();assert.equal(await p.evaluate(()=>window.__printed),1);await c.close();});


const QKEY='hs_5390857_quote_draft_v11';
const IDENTITY='OLD_CUSTOMER_SENTINEL';
async function seedIdentity(p){await p.goto(ORIGIN+'/index.html');await p.evaluate(({key,identity})=>localStorage.setItem(key,JSON.stringify({updatedAt:Date.now(),serviceCategory:'water_tank',wtTonnage:'120',wtMaterial:'concrete',wtPoolCount:'0',clientName:identity,contactPerson:identity,clientAddr:identity,chkTax:false})),{key:QKEY,identity:IDENTITY});}
async function noOldIdentity(p){assert(!(await p.locator('body').innerText()).includes(IDENTITY));for(const id of ['q-client-name','q-contact-person','q-client-addr'])assert(!(await p.locator('#'+id).inputValue()).includes(IDENTITY));}
await test(engine+' old identity excluded from every quote entry',async()=>{const c=await setup(390),p=await c.newPage();
for(const query of ['', 'from=water-tank&cat=water_tank&mode=priority_50&reg=台北市 / 新北市&ton=120&mat=concrete&pools=0&tax=0','from=cooling-tower&cat=cooling_tower&mode=priority_50&reg=台北市 / 新北市&rt=100&type=open_round&cnt=0&tax=0','from=ac-cleaning&cat=ac_cleaning&mode=priority_50&reg=台北市 / 新北市&actype=split&acqty=base&tax=0','from=motor-pump-valve&cat=mpv_repair&mode=priority_50&reg=台北市 / 新北市&mpvspec=split_major&mpvtier=tier_std&mpvqty=1&tax=0','from=shop&shopmode=chlorine_only&qty=1&reg=台北市 / 新北市&tax=0','from=share&cat=water_tank&ton=120&mat=concrete&pools=0&dmode=ab_compare&tax=0&cname='+IDENTITY+'&cperson='+IDENTITY+'&caddr='+IDENTITY]){
 await seedIdentity(p);await p.goto(ORIGIN+'/quote.html?'+query);await noOldIdentity(p);
 assert(!(await p.evaluate(key=>localStorage.getItem(key),QKEY)).includes(IDENTITY));
}await c.close();});
await test(engine+' preview and full quote agree without saved customer',async()=>{const c=await setup(390),p=await c.newPage();await seedIdentity(p);await p.goto(ORIGIN+'/ac-cleaning.html');for(const id of specs['ac-cleaning'])await choose(p,id,0);await shown(p);assert(!(await p.locator('#hs-inline-paper-document').innerText()).includes(IDENTITY));await p.locator('.hs-open-quote').click();await p.waitForURL('**/quote.html?**');await noOldIdentity(p);await c.close();});
await test(engine+' customer entered now appears only in current quote',async()=>{const c=await setup(390),p=await c.newPage();await p.goto(qp('cat=ac_cleaning&actype=split&acqty=base'));await p.locator('#btn-toggle-tech-specs').click();
 for(const id of ['q-client-name','q-contact-person','q-client-addr'])await p.locator('#'+id).fill('CURRENT_CUSTOMER_SENTINEL');await p.waitForTimeout(300);
 assert((await p.locator('#qp-paper-sheet').innerText()).includes('CURRENT_CUSTOMER_SENTINEL'));
 assert(!(await p.evaluate(()=>JSON.stringify(localStorage))).includes('CURRENT_CUSTOMER_SENTINEL'));
 await p.reload();assert(!(await p.locator('body').innerText()).includes('CURRENT_CUSTOMER_SENTINEL'));await c.close();});
await test(engine+' cross tab specs cannot replace current customer quote',async()=>{const c=await setup(1280),p=await c.newPage();await p.goto(qp('cat=ac_cleaning&actype=split&acqty=base'));await p.locator('#btn-toggle-tech-specs').click();await p.locator('#q-client-name').fill('CURRENT_CUSTOMER_SENTINEL');await p.waitForTimeout(250);const before=await p.locator('#q-service-category').inputValue();const other=await c.newPage();await seedIdentity(other);await p.waitForTimeout(300);assert.equal(await p.locator('#q-service-category').inputValue(),before);assert.equal(await p.locator('#q-client-name').inputValue(),'CURRENT_CUSTOMER_SENTINEL');await noOldIdentity(p);
 await p.locator('#btn-q-load-draft').click();assert.equal(await p.locator('#q-client-name').inputValue(),'');await noOldIdentity(p);await c.close();});
await test(engine+' legacy identity inaccessible under blocked storage writes',async()=>{const c=await setup(390),p=await c.newPage();await seedIdentity(p);await c.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('read only storage')};});await p.goto(qp('cat=ac_cleaning&actype=split&acqty=base'));await noOldIdentity(p);await c.close();});
await test(engine+' back forward never reuses prior customer identity',async()=>{const c=await setup(390),p=await c.newPage();await p.goto(qp('cat=ac_cleaning&actype=split&acqty=base'));await p.locator('#btn-toggle-tech-specs').click();await p.locator('#q-client-name').fill('CURRENT_CUSTOMER_SENTINEL');await p.waitForTimeout(100);await p.goto(ORIGIN+'/index.html');await p.goBack();assert.equal(await p.locator('#q-client-name').inputValue(),'');await c.close();});

await test(engine+' clean current draft still purges legacy private fields',async()=>{const c=await setup(390),p=await c.newPage();await p.goto(ORIGIN+'/index.html');await p.evaluate(()=>{localStorage.setItem('hs_5390857_quote_draft_v11',JSON.stringify({updatedAt:Date.now(),serviceCategory:'water_tank'}));for(const k of ['hs_5390857_quote_draft_v10','hs_5390857_quote_draft_v8'])localStorage.setItem(k,JSON.stringify({updatedAt:Date.now(),clientName:'LEGACY_CUSTOMER_SENTINEL',contactPerson:'LEGACY_CUSTOMER_SENTINEL',clientAddr:'LEGACY_CUSTOMER_SENTINEL'}));});await p.goto(ORIGIN+'/quote.html');assert(!(await p.evaluate(()=>JSON.stringify(localStorage))).includes('LEGACY_CUSTOMER_SENTINEL'));await c.close();});
await browser.close();}console.log(JSON.stringify(report.tests));if(report.tests.some(x=>!x.passed))process.exitCode=1;})().catch(async e=>{report.error=String(e.stack);fs.writeFileSync('choice-audit.json',JSON.stringify(report,null,2));if(browser)await browser.close();process.exitCode=1;});

