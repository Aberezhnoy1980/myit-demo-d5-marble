import {chromium} from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const out=process.argv[2];
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
for (const w of [390,1440]) {
  const p=await b.newPage({viewport:{width:w,height:w===390?844:900},deviceScaleFactor:w===390?2:1});
  await p.goto('http://127.0.0.1:4335/dist/');await p.waitForLoadState('networkidle');
  // force lazy images
  for (const sel of ['#gallery-image','#feature-image']) {await p.locator(sel).scrollIntoViewIfNeeded();}
  await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));
  await p.screenshot({path:`${out}/full-${w}.png`,fullPage:true});
  await p.screenshot({path:`${out}/fold-${w}.png`});
  for (const id of ['gallery','materials','approach','visit','project']) {
    await p.locator('#'+id).screenshot({path:`${out}/${id}-${w}.png`});
  }
  const m=await p.evaluate(()=>{
    const cs=e=>getComputedStyle(e);
    const pick=(sel)=>[...document.querySelectorAll(sel)].slice(0,3).map(e=>{const s=cs(e);const r=e.getBoundingClientRect();return {sel,text:(e.textContent||'').trim().slice(0,40),font:s.fontFamily.split(',')[0],size:s.fontSize,lh:s.lineHeight,ls:s.letterSpacing,weight:s.fontWeight,w:Math.round(r.width),h:Math.round(r.height)}});
    const sels=['h1','h2','h3','.eyebrow','.demo','.intro','.section-head>p','.piece-copy p','.thumb','.fine','.strap','.header nav a','.languages button','.filters button','.index-heading button','.image-control','.button','.text-link','.material','.aud','.aud small','label','select','input','.hero-image figcaption','.logo span','footer p'];
    const types=sels.flatMap(pick);
    const small=[...document.querySelectorAll('button,a,select,input,textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<44||r.width<44)}).map(e=>({tag:e.tagName,text:(e.textContent||e.id).trim().slice(0,30),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}));
    const fontSizes={};document.querySelectorAll('body *').forEach(e=>{if(e.children.length===0&&e.textContent.trim()){const s=cs(e).fontSize;fontSizes[s]=(fontSizes[s]||0)+1}});
    return {docH:document.documentElement.scrollHeight,sections:[...document.querySelectorAll('main>section,.strap')].map(s=>({id:s.id||s.className,h:Math.round(s.getBoundingClientRect().height)})),types,small,fontSizes};
  });
  await fs.writeFile(`${out}/metrics-${w}.json`,JSON.stringify(m,null,1));
  // gallery interaction: select fireplace, enlarge dialog
  await p.locator('[data-piece="1"]').click();await p.waitForTimeout(400);
  await p.locator('#gallery').screenshot({path:`${out}/gallery-fireplace-${w}.png`});
  await p.locator('[data-piece="4"]').click();await p.waitForTimeout(400);
  await p.locator('#gallery').screenshot({path:`${out}/gallery-column-${w}.png`});
  await p.locator('#gallery-view').click();await p.waitForTimeout(400);
  await p.screenshot({path:`${out}/dialog-${w}.png`});
  await p.keyboard.press('Escape');
  await p.locator('#gallery-select').click();await p.waitForTimeout(400);
  await p.screenshot({path:`${out}/after-select-${w}.png`});
  await p.locator('#task').selectOption({index:1});await p.locator('#stage').selectOption({index:1});
  await p.locator('#project-form button[type=submit]').click();await p.waitForTimeout(400);
  await p.locator('#project').screenshot({path:`${out}/result-${w}.png`});
  await p.close();
}
await b.close();
