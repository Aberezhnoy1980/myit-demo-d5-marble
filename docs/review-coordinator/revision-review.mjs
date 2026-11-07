import {chromium} from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=dirname(fileURLToPath(import.meta.url)),root=resolve(base,'../..'),out=base+'/r2';await mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','4337','--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
let b;const results=[],errors=[];const check=(name,pass,data)=>{results.push({name,pass,data});if(!pass)console.log('FAIL',name,data);};
try{
 b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 const p=await b.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4337/',{waitUntil:'networkidle'});
 const lum=s=>{const a=s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
 for(const width of [360,390,600,768,1024,1440]){
  await p.setViewportSize({width,height:900});check('overflow '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if([390,1440].includes(width)){
   const colors=await p.evaluate(()=>[...document.querySelectorAll('.aud.active strong,.material.active strong')].map(e=>{let a=e;while(a&&getComputedStyle(a).backgroundColor==='rgba(0, 0, 0, 0)')a=a.parentElement;return {type:e.closest('button').className,fg:getComputedStyle(e).color,bg:getComputedStyle(a).backgroundColor,size:getComputedStyle(e).fontSize};}));
   for(const col of colors){const l=[lum(col.fg),lum(col.bg)].sort((a,b)=>b-a);const ratio=(l[0]+.05)/(l[1]+.05);check('contrast '+width+' '+col.type,ratio>=4.5,{...col,ratio});}
   check('visible selected markers '+width,await p.locator('.aud.active b,.material.active b').evaluateAll(a=>a.length===2&&a.every(e=>e.textContent.includes('Выбрано'))));
   check('demo marker in first viewport '+width,await p.locator('.demo-marker').evaluate(e=>e.getBoundingClientRect().top<innerHeight&&e.getBoundingClientRect().bottom>0));
   await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:out+`/hero-${width}.png`,animations:'disabled'});
  }
 }
 for(const [aud,mat,task,stage] of [['Для проекта архитектора','Тёмный контраст','Поверхность для ванной','Проектирование'],['Для дома','Светлый ритм','Столешница для кухни','Идея / планирование']]){
  await p.locator(`[data-audience="${aud}"]`).click();await p.locator(`[data-name="${mat}"]`).click();await p.locator('#task').selectOption({label:task});await p.locator('#stage').selectOption({label:stage});await p.locator('.submit').click();
  const text=await p.locator('#summary').textContent();check('summary '+aud,text.includes(aud)&&text.includes(mat)&&text.includes('запрос не отправлен'));
  await p.locator('#comment').fill('Новая правка '+aud);check('stale hidden '+aud,await p.locator('#summary').isHidden());
 }
 await p.route('**/assets/dark.jpg',r=>r.abort());await p.locator('[data-name="Тёмный контраст"]').click();await p.waitForFunction(()=>!document.querySelector('#image-status').hidden);
 check('image failure explained',await p.locator('#image-status').isVisible());check('failed image hidden',await p.locator('#feature-image').isHidden());check('failed zoom disabled',await p.locator('#zoom').isDisabled());
 await p.setViewportSize({width:390,height:844});await p.locator('.material-image').screenshot({path:out+'/missing-image.png'});
 await p.locator('[data-name="Светлый ритм"]').click();await p.waitForFunction(()=>document.querySelector('#feature-image').naturalWidth>0&&!document.querySelector('#zoom').disabled);
 check('recovery image visible',await p.locator('#feature-image').isVisible());check('recovery status hidden',await p.locator('#image-status').isHidden());
 await p.locator('#zoom').focus();await p.keyboard.press('Enter');check('recovered dialog open',await p.locator('#viewer').evaluate(e=>e.open));await p.keyboard.press('Escape');check('escape returns focus',await p.evaluate(()=>!document.querySelector('#viewer').open&&document.activeElement.id==='zoom'));
 await p.locator('.material-list').screenshot({path:out+'/material-choice-390.png'});
 check('no pageerror',errors.length===0,errors);
 console.log('Chrome',b.version(),'pass',results.filter(r=>r.pass).length,'/',results.length);
}catch(e){check('runner',false,e.stack);}finally{await b?.close();server.kill();await writeFile(out+'/results.json',JSON.stringify({date:'2026-11-06',results},null,2));}
