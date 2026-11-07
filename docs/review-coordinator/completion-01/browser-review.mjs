import {chromium} from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const out=path.dirname(new URL(import.meta.url).pathname),base='http://127.0.0.1:4335/dist/';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
const result={browser:browser.version(),checks:[],errors:[],requests:[]};
const check=(name,pass,detail)=>result.checks.push({name,pass,detail});
async function make(options={}){
 const ctx=await browser.newContext({viewport:{width:390,height:900},acceptDownloads:true,...options});
 await ctx.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(e.message));
 p.on('request',r=>result.requests.push({url:r.url(),method:r.method()}));await p.goto(base);return {ctx,p};
}
async function form(p,audience,material,task,stage){
 await p.locator(`[data-audience="${audience}"]`).click();await p.locator(`[data-name="${material}"]`).click();
 await p.locator('#task').selectOption({label:task});await p.locator('#stage').selectOption({label:stage});
 await p.locator('.submit').click();
}
try{
 const {ctx,p}=await make({permissions:['clipboard-read','clipboard-write']});
 await p.locator('.submit').click();
 check('empty-errors-and-focus',await p.locator('#task-error').isVisible()&&await p.locator('#stage-error').isVisible()&&await p.evaluate(()=>document.activeElement.id)==='task');
 await form(p,'Для проекта архитектора','Тёмный контраст','Поверхность для ванной','Проектирование');
 let text=await p.locator('#request-text').inputValue();
 check('architect-result',text.includes('Для проекта архитектора')&&text.includes('Тёмный контраст')&&text.includes('Поверхность для ванной')&&text.includes('запрос никуда не отправлен'));
 await p.locator('#copy-request').click();await p.waitForFunction(()=>document.querySelector('#action-status').textContent==='Текст скопирован.');
 check('architect-actual-clipboard',await p.evaluate(()=>navigator.clipboard.readText())===text);
 let [download]=await Promise.all([p.waitForEvent('download'),p.locator('#download-request').click()]);
 let bytes=await fs.readFile(await download.path());
 check('architect-actual-download',bytes.equals(Buffer.from(text,'utf8'))&&download.suggestedFilename()==='zapros-po-proektu.txt');
 await fs.writeFile(path.join(out,'architect-request.txt'),bytes);
 check('author-example-matches',bytes.equals(await fs.readFile('examples/zapros-po-proektu.txt')));
 await p.locator('#summary').screenshot({path:path.join(out,'request-390.png')});
 await p.locator('[data-audience="Для дома"]').click();check('audience-invalidates',await p.locator('#summary').isHidden());
 await p.locator('[data-name="Светлый ритм"]').click();await p.locator('#size').fill('240 × 65 см');await p.locator('#comment').fill('Демо: '+ 'я'.repeat(990));
 await p.locator('#task').selectOption({label:'Столешница для кухни'});await p.locator('#stage').selectOption({label:'Ремонт или строительство'});await p.locator('.submit').click();
 text=await p.locator('#request-text').inputValue();
 check('home-result-long-input',text.includes('Контекст: Для дома')&&text.includes('Светлый ритм')&&text.includes('240 × 65 см')&&text.includes('я'.repeat(990)));
 await p.locator('#copy-request').click();await p.waitForFunction(()=>document.querySelector('#action-status').textContent==='Текст скопирован.');
 check('home-actual-clipboard',await p.evaluate(()=>navigator.clipboard.readText())===text);
 [download]=await Promise.all([p.waitForEvent('download'),p.locator('#download-request').click()]);bytes=await fs.readFile(await download.path());
 check('home-actual-download',bytes.equals(Buffer.from(text,'utf8')));await fs.writeFile(path.join(out,'home-request.txt'),bytes);
 await p.locator('#edit').click();check('edit-preserves-values',await p.locator('#size').inputValue()==='240 × 65 см'&&await p.locator('#comment').inputValue().then(t=>t.length===996));
 await p.locator('.submit').click();await p.locator('#size').fill('180 × 60 см');check('field-invalidates',await p.locator('#summary').isHidden());
 await p.locator('.submit').click();check('regenerated-current-data',await p.locator('#request-text').inputValue().then(t=>t.includes('180 × 60 см')&&!t.includes('240 × 65 см')));
 await p.locator('[data-name="Тёплая пластика"]').click();check('material-invalidates',await p.locator('#summary').isHidden());
 await p.locator('#zoom').focus();await p.keyboard.press('Enter');check('keyboard-image-dialog',await p.locator('#viewer').evaluate(e=>e.open));
 await p.keyboard.press('Escape');check('image-dialog-return-focus',await p.evaluate(()=>document.activeElement.id)==='zoom');
 const broken=await make();let aborted=0;
 await broken.p.route('**/assets/dark.jpg',r=>{aborted++;return r.abort()});await broken.p.locator('[data-name="Тёмный контраст"]').click();
 await broken.p.waitForFunction(()=>!document.querySelector('#image-status').hidden);
 check('photo-failure',aborted>0&&await broken.p.locator('#zoom').isDisabled()&&await broken.p.locator('#feature-image').isHidden());
 await broken.p.unroute('**/assets/dark.jpg');await broken.p.locator('[data-name="Светлый ритм"]').click();await broken.p.waitForFunction(()=>!document.querySelector('#zoom').disabled);
 check('photo-restored',await broken.p.locator('#image-status').isHidden()&&await broken.p.locator('#feature-image').isVisible());await broken.ctx.close();
 for(const width of [360,390,768,1024,1280,1440]){
  await p.setViewportSize({width,height:900});await p.locator('.submit').click();
  check(`long-result-overflow-${width}`,await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
 }
 const contrast=await p.evaluate(()=>{const L=c=>{const v=c.match(/\d+/g).slice(0,3).map(Number).map(x=>(x/=255)<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};return [['.aud.active strong','body'],['.material.active strong','.materials']].map(([f,b])=>(L(getComputedStyle(document.querySelector(b)).backgroundColor)+.05)/(L(getComputedStyle(document.querySelector(f)).color)+.05))});
 check('selected-contrast',contrast.every(v=>v>=4.5),contrast);
 check('selected-noncolor-markers',await p.locator('.aud.active').textContent().then(t=>t.includes('Выбрано'))&&await p.locator('.material.active').textContent().then(t=>t.includes('Выбрано')));
 await p.emulateMedia({reducedMotion:'reduce'});check('reduced-motion',await p.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='auto');
 await p.screenshot({path:path.join(out,'long-result-1440.png'),fullPage:true});
 for(const resource of ['','app.js','style.css','assets/interior.jpg','assets/warm.jpg','assets/light.jpg','assets/dark.jpg'])check('prefix-resource-'+(resource||'index'),(await ctx.request.get(base+resource)).status()===200);
 await ctx.close();
 const denied=await browser.newContext({viewport:{width:390,height:900}});
 await denied.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('synthetic denied')}}}));
 const q=await denied.newPage();await q.goto(base);await q.locator('#task').selectOption({index:1});await q.locator('#stage').selectOption({index:1});await q.locator('.submit').click();await q.locator('#copy-request').click();
 await q.waitForFunction(()=>document.querySelector('#action-status').textContent.includes('Не удалось'));
 check('clipboard-denied-selection',await q.locator('#request-text').evaluate(el=>document.activeElement===el&&el.selectionEnd-el.selectionStart===el.value.length));await denied.close();
 const nojs=await make({javaScriptEnabled:false});check('no-js',await nojs.p.locator('#project-form').isHidden()&&await nojs.p.locator('noscript').textContent().then(t=>t.includes('JavaScript')));await nojs.ctx.close();
 check('no-external-submissions',result.requests.every(r=>r.method==='GET'&&r.url.startsWith(base)));
}finally{await browser.close();await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n')}
console.log(JSON.stringify({checks:result.checks.length,passed:result.checks.filter(c=>c.pass).length,failed:result.checks.filter(c=>!c.pass),pageErrors:result.errors}));
