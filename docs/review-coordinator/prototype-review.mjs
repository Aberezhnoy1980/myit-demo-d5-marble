import {chromium} from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const out=dirname(fileURLToPath(import.meta.url)),root=resolve(out,'../..');
const server=spawn('python3',['-m','http.server','4337','--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
const results=[],errors=[];let b;
const check=(name,pass,data)=>{results.push({name,pass,data});if(!pass)console.log('FAIL',name,JSON.stringify(data));};
try{
 b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 const c=await b.newContext({viewport:{width:1440,height:1000}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4337/',{waitUntil:'networkidle'});
 for(const width of [360,390,600,768,1024,1440]){await p.setViewportSize({width,height:900});check('overflow '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.locator('.submit').click();check('empty errors',await p.locator('.error:visible').count()===2);check('first invalid focus',await p.evaluate(()=>document.activeElement.id==='task'));
 for(const [aud,mat,task,stage] of [
  ['Для проекта архитектора','Тёмный контраст','Поверхность для ванной','Проектирование'],
  ['Для дома','Светлый ритм','Столешница для кухни','Идея / планирование']]){
  await p.locator(`.aud[data-audience="${aud}"]`).focus();await p.keyboard.press('Enter');
  await p.locator(`.material[data-name="${mat}"]`).click();await p.locator('#task').selectOption({label:task});await p.locator('#stage').selectOption({label:stage});
  await p.locator('.submit').click();const text=await p.locator('#summary').textContent();
  check('summary '+aud,text.includes(aud)&&text.includes(mat)&&text.includes(task)&&text.includes('запрос не отправлен'));
  check('summary focus '+aud,await p.evaluate(()=>document.activeElement.id==='summary'));
  await p.locator('#comment').fill('Изменение после резюме');check('stale summary hidden '+aud,await p.locator('#summary').isHidden());
 }
 await p.locator('.submit').click();await p.locator('.material').first().click();check('material invalidates summary',await p.locator('#summary').isHidden());
 await p.locator('.submit').click();await p.locator('.aud').last().click();check('audience invalidates summary',await p.locator('#summary').isHidden());
 await p.locator('#zoom').focus();await p.keyboard.press('Enter');check('dialog keyboard open',await p.locator('#viewer').evaluate(e=>e.open));
 const modalFocus=[];for(let i=0;i<5;i++){await p.keyboard.press('Tab');modalFocus.push(await p.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id})));}
 check('dialog background not focusable',modalFocus.every(x=>x.id==='close-viewer'||x.tag==='BODY'),modalFocus);
 await p.keyboard.press('Escape');check('dialog closes',!await p.locator('#viewer').evaluate(e=>e.open));check('dialog focus returned',await p.evaluate(()=>document.activeElement.id==='zoom'));
 await p.emulateMedia({reducedMotion:'reduce'});check('reduced smooth disabled',await p.locator('html').evaluate(e=>getComputedStyle(e).scrollBehavior==='auto'));
 const colors=await p.evaluate(()=>[...document.querySelectorAll('.aud.active strong,.material.active strong')].map(e=>{let a=e;while(a&&getComputedStyle(a).backgroundColor==='rgba(0, 0, 0, 0)')a=a.parentElement;return {selector:e.closest('button').className,fg:getComputedStyle(e).color,bg:getComputedStyle(a).backgroundColor,size:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight};}));
 const lum=s=>{const a=s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
 for(const color of colors){const l=[lum(color.fg),lum(color.bg)].sort((a,b)=>b-a),ratio=(l[0]+.05)/(l[1]+.05);check('selected text contrast '+color.selector,ratio>=4.5,{...color,ratio});}
 await p.setViewportSize({width:390,height:844});await p.locator('#size').fill('1'.repeat(120));await p.locator('#comment').fill('я'.repeat(1000));await p.locator('.submit').click();check('long summary no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:out+'/long-summary-390.png',fullPage:true,animations:'disabled'});
 const fresh=await c.newPage();await fresh.setViewportSize({width:390,height:844});await fresh.goto('http://127.0.0.1:4337/',{waitUntil:'networkidle'});
 await fresh.screenshot({path:out+'/hero-390.png',animations:'disabled'});
 const tab=[];for(let i=0;i<17;i++){await fresh.keyboard.press('Tab');tab.push(await fresh.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent?.trim().slice(0,60),id:document.activeElement.id})));}
 check('keyboard controls reachable',tab.some(x=>x.id==='zoom')&&tab.some(x=>x.id==='task'),tab);
 const nojs=await b.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),np=await nojs.newPage();await np.goto('http://127.0.0.1:4337/');
 check('nojs honest explanation',(await np.locator('noscript').textContent()).includes('Форма не отправляет'));
 check('nojs inactive form hidden',await np.locator('#project-form').isHidden());check('nojs content available',await np.locator('h1').isVisible());await nojs.close();
 await fresh.route('**/assets/dark.jpg',r=>r.abort());await fresh.locator('[data-name="Тёмный контраст"]').click();await fresh.waitForTimeout(250);
 check('missing media does not break form',await fresh.locator('#task').isVisible());
 await fresh.screenshot({path:out+'/missing-media-390.png',fullPage:true,animations:'disabled'});
 await fresh.locator('.material-image').screenshot({path:out+'/missing-media-detail.png'});
 check('no pageerror',errors.length===0,errors);
 console.log('Chrome',b.version(),'passed',results.filter(r=>r.pass).length,'/',results.length);
}catch(e){check('runner',false,e.stack);}
finally{await b?.close();server.kill();await writeFile(out+'/results.json',JSON.stringify({date:'2026-11-06',results},null,2));}
