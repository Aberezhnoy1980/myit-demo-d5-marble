import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('content.js','utf8'),ctx);const d=ctx.window.SLOY_CONTENT.en;
let html=fs.readFileSync('index.html','utf8');
html=html.replace(/(<(\w+)[^>]*data-t="([^"]+)"[^>]*>)[^<]*(<\/\2>)/g,(m,start,tag,key,end)=>start+d[key]+end);
html=html.replace(/(<(\w+)[^>]*data-html="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g,(m,start,tag,key,end)=>start+d[key]+end);
fs.writeFileSync('index.html',html);fs.copyFileSync('index.html','dist/index.html');
