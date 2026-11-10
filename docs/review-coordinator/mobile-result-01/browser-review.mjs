import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';

const root = '/Users/alex/myit/demo/Landing/d5-marble';
const output = process.argv[2];
const files = new Set(['index.html','style.css','app.js','assets/interior.jpg','assets/warm.jpg','assets/light.jpg','assets/dark.jpg']);
const types = {html:'text/html; charset=utf-8',css:'text/css',js:'application/javascript',jpg:'image/jpeg'};
const server = createServer(async (req, res) => {
  const route = new URL(req.url, 'http://127.0.0.1').pathname;
  const file = route === '/' ? 'index.html' : route.slice(1);
  if (!files.has(file) || req.method !== 'GET') return res.writeHead(404).end();
  try {
    res.writeHead(200, {'Content-Type':types[file.split('.').at(-1)]});
    res.end(await readFile(join(root,file)));
  } catch {
    res.end();
  }
});
await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
const origin = 'http://127.0.0.1:' + server.address().port;
const results = [];
let browser;
try {
  browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const context = await browser.newContext({acceptDownloads:true,reducedMotion:'reduce'});
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});
  await context.route('**/*',r => r.request().url().startsWith(origin+'/') ? r.continue() : r.abort());
  for (const width of [360,390,430,1440]) {
    const page = await context.newPage();
    await page.setViewportSize({width,height:1000});
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    page.on('response',r => {if (r.status() >= 400) errors.push(r.status()+' '+r.url());});
    await page.goto(origin+'/',{waitUntil:'load'});
    const submit = page.getByRole('button',{name:'Подготовить запрос'});
    await submit.click();
    assert.equal(await page.locator('#summary').isHidden(),true);
    assert.equal(await page.locator('#task-error').isVisible(),true);
    assert.equal(await page.locator('#stage-error').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'task');
    await page.locator('[data-audience="Для проекта архитектора"]').click();
    await page.locator('[data-name="Тёмный контраст"]').click();
    await page.locator('#zoom').click();
    assert.equal(await page.locator('#viewer').evaluate(d=>d.open),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#viewer').evaluate(d=>d.open),false);
    await page.locator('#task').selectOption({label:'Поверхность для ванной'});
    await page.locator('#stage').selectOption({label:'Проектирование'});
    for (const [kind,comment] of [['normal',''],['long','я'.repeat(1000)]]) {
      await page.locator('#comment').fill(comment);
      await submit.click();
      const summary = page.locator('#summary');
      assert.equal(await summary.isVisible(),true);
      const geometry = await page.evaluate(()=>{
        const rect = e => { const r=e.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width}; };
        const section=document.querySelector('#project'),form=document.querySelector('#project-form'),summary=document.querySelector('#summary'),textarea=document.querySelector('#request-text');
        return {
          viewport:document.documentElement.clientWidth, documentWidth:document.documentElement.scrollWidth,
          section:rect(section), form:rect(form), summary:rect(summary), text:rect(textarea),
          paddingLeft:parseFloat(getComputedStyle(section).paddingLeft),
          paddingRight:parseFloat(getComputedStyle(section).paddingRight),
          textScrollWidth:textarea.scrollWidth, textClientWidth:textarea.clientWidth,
          childOverflow:[...summary.querySelectorAll('*')].filter(e=>{
            const r=e.getBoundingClientRect(), s=summary.getBoundingClientRect();
            return r.width>0 && (r.left<s.left-0.5 || r.right>s.right+0.5);
          }).map(e=>e.id||e.tagName)
        };
      });
      assert.equal(geometry.viewport,width);
      assert.equal(geometry.documentWidth,width);
      assert.ok(Math.abs(geometry.summary.left-geometry.form.left)<0.5);
      assert.ok(Math.abs(geometry.summary.right-geometry.form.right)<0.5);
      assert.deepEqual(geometry.childOverflow,[]);
      assert.ok(geometry.textScrollWidth <= geometry.textClientWidth);
      if (width<761) {
        assert.ok(Math.abs(geometry.summary.left-geometry.paddingLeft)<0.5);
        assert.ok(Math.abs(width-geometry.summary.right-geometry.paddingRight)<0.5);
      }
      const value=await page.locator('#request-text').inputValue();
      assert.match(value,/Для проекта архитектора/);
      assert.match(value,/Тёмный контраст/);
      assert.match(value,/запрос никуда не отправлен/);
      if(comment) assert.ok(value.includes(comment));
      const textAreaScroll = await page.locator('#request-text').evaluate(e=>{
        const extent=e.scrollHeight-e.clientHeight;
        e.scrollTop=e.scrollHeight;
        const reached=e.scrollTop;
        e.scrollTop=0;
        return {extent,reached};
      });
      assert.ok(Math.abs(textAreaScroll.extent-textAreaScroll.reached)<=1);
      await summary.evaluate(e=>window.scrollTo(0, window.scrollY+e.getBoundingClientRect().top-24));
      await page.screenshot({path:join(output,'result-'+width+'-'+kind+'.png')});
      await page.locator('#copy-request').click();
      await page.waitForFunction(()=>document.querySelector('#action-status').textContent==='Текст скопирован.');
      assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),value);
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download-request').click()]);
      assert.equal(download.suggestedFilename(),'zapros-po-proektu.txt');
      assert.ok((await readFile(await download.path())).equals(Buffer.from(value,'utf8')));
      await page.locator('#edit').click();
      assert.equal(await summary.isHidden(),true);
      assert.equal(await page.evaluate(()=>document.activeElement.id),'task');
      assert.equal(await page.locator('#comment').inputValue(),comment);
      results.push({width,kind,geometry,textAreaScroll,clipboard:true,txtBytes:Buffer.byteLength(value),edit:true});
    }
    await submit.click();
    await page.locator('#size').fill('240 × 65 см');
    assert.equal(await page.locator('#summary').isHidden(),true);
    await submit.click();
    assert.match(await page.locator('#request-text').inputValue(),/240 × 65 см/);
    assert.deepEqual(errors,[]);
    await page.close();
  }
  await writeFile(join(output,'results.json'),JSON.stringify({chrome:browser.version(),checks:results},null,2)+'\n');
  for (const x of results) console.log(x.width,x.kind,JSON.stringify(x.geometry),'TXT',x.txtBytes);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
