const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=process.cwd(), ORIGIN='https://5390857.com';
const candidate=fs.readFileSync('.qa/analytics.candidate.js','utf8');
const marker='SYNTHETIC_PRIVATE_MARKER_839274';
const report={engine:'Chromium in isolated GitHub Actions (not physical device)',started:new Date().toISOString(),tests:[],requests:[],googleScriptLoaded:false};
const ui=`<section id="hs-analytics-choice"><button data-analytics-choice="granted">Allow</button><button data-analytics-choice="denied">Deny</button></section><button id="hs-analytics-settings">Settings</button><a id="test-phone" href="tel:000000000">phone</a><a id="test-line" href="https://line.me/test">line</a><a id="test-quote" href="/quote.html">quote</a><a id="test-service" href="/water-tank.html">service</a><script src="/assets/analytics.js"></script>`;
let browser;
async function setup(options={}) {
 const context=await browser.newContext({serviceWorkers:'block'});const log=[];
 if(options.gpc)await context.addInitScript(()=>Object.defineProperty(navigator,'globalPrivacyControl',{value:true}));
 if(options.stale)await context.addInitScript(()=>localStorage.setItem('hs_analytics_consent_v1','granted'));
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url()),headers=await req.allHeaders();
  if(u.origin===ORIGIN){
   let p=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(p==='assets/analytics.js')return route.fulfill({contentType:'application/javascript',body:candidate});
   const file=path.resolve(root,p);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
   let body=fs.readFileSync(file);if(p.endsWith('.html'))body=body.toString().replace('<head>','<head><meta name="referrer" content="no-referrer">').replace('</body>',ui+'</body>');
   return route.fulfill({contentType:p.endsWith('.html')?'text/html':p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'application/octet-stream',body});
  }
  const rec={url:req.url(),method:req.method(),body:req.postData(),referer:headers.referer||'',kind:'blocked'};log.push(rec);
  // Only actual Google JS runtime is fetched. All collection/other endpoints are intercepted before transmission.
  if(u.hostname==='www.googletagmanager.com'&&u.pathname==='/gtag/js'){
   rec.kind='runtime';const response=await route.fetch();rec.status=response.status();report.googleScriptLoaded=response.ok();return route.fulfill({response});
  }
  if(/google-analytics\.com$/.test(u.hostname)&&u.pathname.includes('collect'))rec.kind='collection';
  return route.fulfill({status:204,body:''});
 });
 return {context,log};
}
function validate(log){for(const r of log){assert(!decodeURIComponent(r.url+(r.body||'')+r.referer).includes(marker),'synthetic private data leaked to outbound request');if(r.kind==='runtime'||r.kind==='collection')assert.equal(r.referer,'','HTTP Referer must be empty');}}
function events(log){return log.filter(r=>r.kind==='collection').flatMap(r=>{const u=new URL(r.url);const base=new URLSearchParams(u.search);const lines=(r.body||'').split('\n');return lines.map(line=>{const q=new URLSearchParams(base);for(const [k,v] of new URLSearchParams(line))q.set(k,v);return Object.fromEntries(q);});});}
async function test(name,fn){let passed=false;try{await fn();passed=true;}finally{report.tests.push({name,passed});fs.writeFileSync('runtime-audit.json',JSON.stringify(report,null,2));}}
(async()=>{browser=await chromium.launch();
for(const [name,url,opts] of [['no consent','/',{}],['query excluded','/?name='+marker,{}],['hash excluded','/#'+marker,{}],['quote excluded','/quote.html?name='+marker,{}],['quote clean excluded','/quote.html',{}],['unknown excluded','/not-known.html',{}],['GPC excluded','/',{gpc:true}],['stale grant ignored','/',{stale:true}]])await test(name,async()=>{
 const {context,log}=await setup(opts);const p=await context.newPage();await p.goto(ORIGIN+url);if(!['no consent','stale grant ignored','unknown excluded'].includes(name))await p.locator('[data-analytics-choice="granted"]').click();await p.waitForTimeout(1800);assert.equal(log.filter(r=>r.kind==='runtime'||r.kind==='collection').length,0);validate(log);report.requests.push({test:name,log});await context.close();});
await test('unsafe referrer excluded',async()=>{const {context,log}=await setup();const p=await context.newPage();await p.goto(ORIGIN+'/',{referer:ORIGIN+'/quote.html?name='+marker});await p.locator('[data-analytics-choice="granted"]').click();await p.waitForTimeout(1800);assert.equal(log.length,0);await context.close();});
await test('runtime explicit consent + fixed fields + all clicks',async()=>{
 const {context,log}=await setup();const p=await context.newPage();await p.goto(ORIGIN+'/');await p.evaluate(m=>{document.title=m;document.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault();});},marker);await p.locator('[data-analytics-choice="granted"]').click();await p.waitForTimeout(5000);assert(report.googleScriptLoaded,'Google runtime not loaded');
 for(const id of ['test-phone','test-line','test-quote','test-service'])await p.locator('#'+id).click();await p.waitForTimeout(5000);
 validate(log);const ev=events(log);assert.equal(ev.filter(e=>e.en==='page_view').length,1,'exactly one pageview');for(const name of ['contact_click','quote_intent','service_intent'])assert(ev.some(e=>e.en===name),'missing '+name);
 for(const e of ev){assert.equal(e.dl,ORIGIN+'/');assert.equal(e.dt,'home');assert(!e.dr);}
 report.requests.push({test:'consent events',log});
 // Withdrawal reload must stop the runtime, and stale grants must not restart it.
 await p.locator('#hs-analytics-settings').click();await p.locator('[data-analytics-choice="denied"]').click();await p.waitForTimeout(2500);const n=log.length;await p.reload();await p.waitForTimeout(2500);assert.equal(log.length,n,'revoked visit restarted runtime');await context.close();});
await test('multi-tab revocation',async()=>{
 const {context,log}=await setup();const a=await context.newPage(),b=await context.newPage();for(const p of [a,b]){await p.goto(ORIGIN+'/');await p.locator('[data-analytics-choice="granted"]').click();}await a.waitForTimeout(5000);await a.locator('#hs-analytics-settings').click();await a.locator('[data-analytics-choice="denied"]').click();await a.waitForTimeout(2500);for(const p of [a,b])assert.equal(await p.locator('script[src*="googletagmanager.com"]').count(),0);const n=log.length;await b.reload();await b.waitForTimeout(2000);assert.equal(log.length,n);validate(log);report.requests.push({test:'multitab',log});await context.close();});
await browser.close();report.completed=new Date().toISOString();fs.writeFileSync('runtime-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.tests.length,googleScriptLoaded:report.googleScriptLoaded}));
})().catch(async e=>{report.error=String(e.stack||e);fs.writeFileSync('runtime-audit.json',JSON.stringify(report,null,2));console.error(e);if(browser)await browser.close();process.exitCode=1;});
