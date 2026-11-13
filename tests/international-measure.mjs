import {chromium} from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';import {gzipSync} from 'node:zlib';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:390,height:900}});await p.goto('http://127.0.0.1:4335/dist/');await p.waitForLoadState('networkidle');
const result=await p.evaluate(()=>({initialBytes:performance.getEntriesByType('navigation')[0].encodedBodySize+performance.getEntriesByType('resource').reduce((s,r)=>s+r.encodedBodySize,0),resources:performance.getEntriesByType('resource').map(r=>({url:r.name.split('/dist/')[1],bytes:r.encodedBodySize}))}));result.jsGzip=gzipSync(await fs.readFile('app.js')).length+gzipSync(await fs.readFile('content.js')).length;
await fs.writeFile('docs/international-performance.json',JSON.stringify(result,null,2)+'\n');console.log(result);
await p.locator('#feature-image').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('#feature-image').naturalWidth>0);await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'screenshots/international/full-en-390.png',fullPage:true});await p.setViewportSize({width:1440,height:900});await p.screenshot({path:'screenshots/international/full-en-1440.png',fullPage:true});await b.close();
