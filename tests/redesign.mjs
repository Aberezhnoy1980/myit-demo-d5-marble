// Проверка редизайна D5 SLOY (12.11.2026).
// Запуск из папки D5 при работающем сервере: node tests/redesign.mjs
// BASE — адрес страницы (по умолчанию http://127.0.0.1:4335/dist/), OUT — новый каталог для снимков и протокола.
import {chromium} from '/Users/alex/myit/demo/Landing/d2-photo/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import vm from 'node:vm';

const BASE = process.env.BASE || 'http://127.0.0.1:4335/dist/';
const OUT = process.env.OUT || 'screenshots/redesign-2026-11-12';
if (fs.existsSync(OUT)) { console.error(`${OUT} уже существует: старые свидетельства не перезаписываются. Укажите новый OUT.`); process.exit(2); }
fs.mkdirSync(OUT, {recursive: true});

const ctx = {window: {}};
vm.runInNewContext(fs.readFileSync('content.js', 'utf8'), ctx);
const DICT = ctx.window.SLOY_CONTENT;
const get = (lang, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), DICT[lang]);

const log = [];
let failed = 0;
function check(name, ok, detail = '') {
  if (!ok) failed++;
  const line = `${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`;
  log.push(line);
  console.log(line);
}

const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});

async function open(width, {lang = 'en', js = true, height} = {}) {
  const context = await browser.newContext({viewport: {width, height: height || (width < 600 ? 844 : 900)}, javaScriptEnabled: js, acceptDownloads: true});
  if (js) await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: new URL(BASE).origin});
  const page = await context.newPage();
  const issues = [];
  page.on('pageerror', e => issues.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') issues.push('console: ' + m.text()); });
  page.on('requestfailed', r => issues.push('failed: ' + r.url()));
  page.on('request', r => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) issues.push('external: ' + r.url()); });
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (lang !== 'en') await page.evaluate(l => document.querySelector(`[data-lang="${l}"]`).click(), lang);
  return {page, context, issues};
}

// Поле готового запроса без внутренней прокрутки: весь текст, включая оговорку, виден.
const requestFits = page => page.evaluate(() => { const el = document.querySelector('#request-text'); return el.scrollHeight <= el.clientHeight + 1 && getComputedStyle(el).overflowY === 'hidden'; });

// Снимок секции без наложения закреплённой шапки.
async function shot(page, selector, path) {
  await page.addStyleTag({content: '.header{position:relative!important}', }).then(h => h.evaluate(el => { el.id = 'shot-style'; }));
  await page.locator(selector).screenshot({path});
  await page.evaluate(() => document.getElementById('shot-style')?.remove());
}

async function loadAll(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    // Ленивые кадры за краем горизонтальной ленты иначе не загрузятся до свайпа.
    document.querySelectorAll('img[loading=lazy]').forEach(img => { img.loading = 'eager'; });
    for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
    scrollTo(0, 0);
    const wait = img => Promise.race([img.decode().catch(() => null), new Promise(r => setTimeout(r, 4000))]);
    await Promise.all([...document.images].filter(img => img.src && !img.complete).map(wait));
  });
  await page.waitForTimeout(250);
}

// ---------- 1. Вёрстка, шкала, цели нажатия, контраст: 4 ширины × 2 языка ----------
for (const width of [390, 768, 1100, 1440]) {
  for (const lang of ['en', 'ru', 'ar']) {
    const {page, context, issues} = await open(width, {lang});
    await loadAll(page);
    const tag = `${width} ${lang}`;
    const m = await page.evaluate(() => {
      const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && r.bottom > 0 && !el.closest('[hidden],dialog:not([open]),.sprite'); };
      const leaves = [...document.querySelectorAll('body *')].filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && visible(el));
      const sizes = {};
      const tooSmall = [];
      for (const el of leaves) {
        if (el.closest('.logo')) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        sizes[fs.toFixed(1)] = (sizes[fs.toFixed(1)] || 0) + 1;
        if (fs < 12) tooSmall.push(el.textContent.trim().slice(0, 30) + ' ' + fs);
      }
      const parse = c => { const v = c.match(/[\d.]+/g).map(Number); return {r: v[0], g: v[1], b: v[2], a: v[3] ?? 1}; };
      const lum = ({r, g, b}) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const bgOf = el => {
        const layers = [];
        for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c.a > 0) layers.push(c); if (c.a >= 1) break; }
        let out = {r: 255, g: 255, b: 255};
        for (const c of layers.reverse()) out = {r: c.r * c.a + out.r * (1 - c.a), g: c.g * c.a + out.g * (1 - c.a), b: c.b * c.a + out.b * (1 - c.a)};
        return out;
      };
      const lowContrast = [];
      for (const el of leaves) {
        if (el.closest('[aria-disabled="true"]') || el.closest('#sample-request')) continue;
        const s = getComputedStyle(el), fg = parse(s.color), bg = bgOf(el);
        const blend = {r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a)};
        const [L1, L2] = [lum(blend), lum(bg)].sort((a, b) => b - a);
        const ratio = (L1 + .05) / (L2 + .05);
        const fsz = parseFloat(s.fontSize), large = fsz >= 24 || (fsz >= 18.66 && Number(s.fontWeight) >= 700);
        if (ratio < (large ? 3 : 4.5)) lowContrast.push(`${el.textContent.trim().slice(0, 30)} ${ratio.toFixed(2)}`);
      }
      const targets = [...document.querySelectorAll('a,button,select,input:not([type=radio]):not([type=checkbox]),textarea,summary,.chip span')].filter(el => visible(el) && !el.closest('.skip') && !el.matches('.skip'));
      const smallTargets = targets.filter(el => { const r = el.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(el => `${el.tagName}.${el.className} "${el.textContent.trim().slice(0, 20)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
      const h1 = document.querySelector('h1'), range = document.createRange(); range.selectNodeContents(h1);
      const rects = [...range.getClientRects()], cs = getComputedStyle(h1.parentElement), box = h1.parentElement.getBoundingClientRect();
      const h1Fits = Math.max(...rects.map(r => r.right)) <= box.right - parseFloat(cs.paddingRight) + 1 && Math.min(...rects.map(r => r.left)) >= box.left + parseFloat(cs.paddingLeft) - 1;
      return {overflow: document.documentElement.scrollWidth - innerWidth, sizes, tooSmall, lowContrast, smallTargets, h1Fits, dir: document.documentElement.dir, headerOk: (() => { const h = document.querySelector('.header'); return h.scrollWidth <= h.clientWidth + 1 && [...h.children].every(c => c.getBoundingClientRect().height <= h.clientHeight); })(), docH: document.documentElement.scrollHeight};
    });
    check(`${tag}: нет горизонтальной прокрутки`, m.overflow <= 0, `${m.overflow}px`);
    check(`${tag}: H1 помещается в колонку`, m.h1Fits);
    check(`${tag}: направление письма`, m.dir === (lang === 'ar' ? 'rtl' : 'ltr'), m.dir);
    check(`${tag}: шапка помещается в одну строку`, m.headerOk);
    check(`${tag}: шрифт не меньше 12 px`, !m.tooSmall.length, m.tooSmall.join('; '));
    check(`${tag}: не больше 9 размеров текста (без логотипа)`, Object.keys(m.sizes).length <= 9, Object.keys(m.sizes).sort((a, b) => a - b).join(', '));
    check(`${tag}: цели нажатия ≥ 44 px`, !m.smallTargets.length, m.smallTargets.slice(0, 6).join('; '));
    check(`${tag}: контраст текста по WCAG AA`, !m.lowContrast.length, m.lowContrast.slice(0, 6).join('; '));
    check(`${tag}: без ошибок JS и внешних запросов`, !issues.length, issues.join('; '));
    if (width === 390 || width === 1440) {
      await page.screenshot({path: `${OUT}/fold-${lang}-${width}.png`});
      await page.screenshot({path: `${OUT}/full-${lang}-${width}.png`, fullPage: true});
      log.push(`INFO ${tag}: высота страницы ${m.docH}px`);
    }
    await context.close();
  }
}

// ---------- 2. Сценарии ----------
for (const width of [390, 1440]) {
  const {page, context, issues} = await open(width);
  await loadAll(page);
  const tag = `${width}`;
  const txt = () => page.inputValue('#request-text');
  const typeChecked = () => page.evaluate(() => document.querySelector('input[name=type]:checked').value);
  const focusedId = () => page.evaluate(() => { const a = document.activeElement; return a.id || `${a.name}:${a.value}`; });

  check(`${tag}: по умолчанию тип «Проект», роль не выбрана, результат скрыт`, await typeChecked() === '0' && await page.evaluate(() => !document.querySelector('input[name=role]:checked') && document.querySelector('#summary').hidden));

  // пустая отправка проекта
  await page.click('#brief-form button[type=submit]');
  check(`${tag}: пустой проект — ошибки задачи и стадии, фокус на задаче`, await page.isVisible('#task-error') && await page.isVisible('#stage-error') && await focusedId() === 'task' && await page.getAttribute('#task', 'aria-invalid') === 'true');

  // предмет из коллекции → бриф
  if (width === 1440) await page.click('[data-add="2"]');
  else { await page.evaluate(() => document.querySelector('[data-piece="2"]').scrollIntoView({inline: 'start'})); await page.click('[data-add="2"]'); }
  await page.waitForTimeout(500);
  check(`${tag}: «Add to brief» переносит предмет и задачу, фокус на стадии`, (await page.textContent('#reference-text')).includes('Fluted column base') && await page.inputValue('#task') === '5' && await focusedId() === 'stage:0' && (await page.textContent('#form-status')).includes('Fluted column base'));
  check(`${tag}: кнопка предмета показывает «In your brief»`, (await page.textContent('[data-add="2"]')).includes('In your brief'));
  await page.check('input[name=stage][value="1"]');
  await page.click('#brief-form button[type=submit]');
  let t = await txt();
  check(`${tag}: TXT проекта без подставленных значений`, t.startsWith('PROJECT ENQUIRY — SLOY') && t.includes('Collection reference: Fluted column base (Travertine; Honed)') && t.includes('You are: Not specified') && t.includes('Stones of interest: Not selected') && t.includes('Project stage: Design development') && t.includes('What are you planning: Architectural element') && !t.includes('?:') && !t.includes('Warm character'), t.split('\n').slice(0, 10).join(' | '));
  check(`${tag}: результат показан и в фокусе`, await page.isVisible('#summary') && await focusedId() === 'summary');
  check(`${tag}: поле запроса без внутренней прокрутки (EN, проект)`, await requestFits(page));
  if (width === 390) await shot(page, '#summary', `${OUT}/result-en-390.png`);
  else await shot(page, '#brief', `${OUT}/brief-result-en-1440.png`);

  // смена языка переводит результат
  await page.evaluate(() => document.querySelector('[data-lang=ru]').click());
  t = await txt();
  check(`${tag}: RU переводит готовый результат`, await page.isVisible('#summary') && t.startsWith('ЗАПРОС ПО ПРОЕКТУ — СЛОЙ') && t.includes('База колонны с каннелюрами'));
  check(`${tag}: поле запроса без внутренней прокрутки после смены языка (RU)`, await requestFits(page));
  await page.evaluate(() => document.querySelector('[data-lang=en]').click());

  // правка скрывает результат
  await page.fill('#notes', 'Lobby, two columns');
  check(`${tag}: правка формы скрывает устаревший результат`, await page.isHidden('#summary'));
  await page.click('#reference-remove');
  check(`${tag}: ссылку на предмет можно убрать`, await page.isHidden('#f-reference'));

  // библиотека → образцы
  await page.click('[data-stone-toggle="0"]');
  await page.click('[data-stone-toggle="3"]');
  check(`${tag}: библиотека считает выбранные камни`, (await page.textContent('#sample-count')).includes('2 selected') && await page.getAttribute('#sample-request', 'aria-disabled') === 'false');
  if (width === 1440) await shot(page, '#materials', `${OUT}/library-en-1440.png`);
  await page.click('#sample-request');
  await page.waitForTimeout(400);
  check(`${tag}: «Request these samples» → тип «Образцы» и отмеченные камни`, await typeChecked() === '1' && await page.isChecked('input[name=stone][value="0"]') && await page.isChecked('input[name=stone][value="3"]') && await page.isVisible('#f-finishes') && await page.isHidden('#f-task'));
  await page.check('input[name=finish][value="1"]');
  await page.click('#brief-form button[type=submit]');
  t = await txt();
  check(`${tag}: TXT образцов`, t.startsWith('SAMPLE REQUEST — SLOY') && t.includes('Stones for samples: Calacatta type, Verde type') && t.includes('Finishes to see: Honed') && t.includes('Project stage: Design development'), t.split('\n').slice(0, 9).join(' | '));
  await page.uncheck('input[name=stone][value="0"]');
  await page.uncheck('input[name=stone][value="3"]');
  await page.click('#brief-form button[type=submit]');
  check(`${tag}: образцы без камней — ошибка; библиотека синхронизирована`, await page.isVisible('#materials-error') && await page.getAttribute('[data-stone-toggle="0"]', 'aria-pressed') === 'false' && await page.getAttribute('#sample-request', 'aria-disabled') === 'true');

  // шоурум → консультация
  await page.click('#showroom [data-start="consultation"]');
  await page.waitForTimeout(400);
  await page.click('#brief-form button[type=submit]');
  check(`${tag}: консультация требует формат`, await typeChecked() === '2' && await page.isVisible('#format-error') && await page.isHidden('#f-stage'));
  await page.check('input[name=format][value="1"]');
  await page.fill('#times', 'Sunday morning');
  await page.click('#brief-form button[type=submit]');
  t = await txt();
  check(`${tag}: TXT консультации`, t.startsWith('CONSULTATION REQUEST — SLOY') && t.includes('Meeting format: Video call') && t.includes('Preferred days and times (GST): Sunday morning'));
  check(`${tag}: поле запроса без внутренней прокрутки (консультация)`, await requestFits(page));
  if (width === 1440) {
    await page.setViewportSize({width: 390, height: 844});
    await page.waitForTimeout(200);
    check(`1440→390: поле подстраивает высоту при сужении окна`, await requestFits(page));
    await page.setViewportSize({width: 1440, height: 900});
    await page.waitForTimeout(200);
  }

  // копирование и скачивание
  await page.click('#copy-request');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check(`${tag}: копирование`, clip === t && (await page.textContent('#action-status')) === 'Text copied.');
  check(`${tag}: копия и поле содержат оговорку об ИИ-кадрах`, clip.includes(DICT.en.result.caveat) && clip.includes(DICT.en.result.noSend));
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-request')]);
  const file = await download.path();
  check(`${tag}: скачивание TXT`, download.suggestedFilename() === 'sloy-brief-consultation-en.txt' && fs.readFileSync(file, 'utf8') === t);
  check(`${tag}: файл содержит оговорку об ИИ-кадрах`, fs.readFileSync(file, 'utf8').includes(DICT.en.result.caveat));

  // путь «для дома»
  await page.click('.paths [data-start="home"]');
  await page.waitForTimeout(400);
  check(`${tag}: «Plan a home project» → проект и роль «Homeowner»`, await typeChecked() === '0' && await page.isChecked('input[name=role][value="0"]'));

  // просмотрщик
  await page.click('[data-open="3"]');
  check(`${tag}: просмотрщик открыт, фокус на «Закрыть»`, await page.isVisible('#viewer') && (await page.textContent('#viewer-title')) === 'Fireplace surround' && await focusedId() === 'viewer-close');
  await page.screenshot({path: `${OUT}/viewer-en-${width}.png`});
  await page.keyboard.press('ArrowRight');
  check(`${tag}: стрелка вправо — следующий предмет`, (await page.textContent('#viewer-title')) === 'Floating vanity' && (await page.textContent('#viewer-count')) === '5 / 6');
  await page.keyboard.press('Escape');
  check(`${tag}: Esc закрывает, фокус возвращается`, await page.isHidden('#viewer') && await page.evaluate(() => document.activeElement.dataset.open) === '3');
  await page.click('[data-open="0"]');
  await page.click('#viewer-use');
  await page.waitForTimeout(400);
  check(`${tag}: «Use in my brief» из просмотрщика`, await page.isHidden('#viewer') && (await page.textContent('#reference-text')).includes('Residential lobby') && await page.inputValue('#task') === '4');

  if (width === 390) {
    // меню
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('#menu-button');
    check(`390: меню открывается`, await page.isVisible('#nav a[href="#trade"]') && await page.getAttribute('#menu-button', 'aria-expanded') === 'true');
    await page.screenshot({path: `${OUT}/menu-en-390.png`});
    const aligned = await page.evaluate(() => { const a = document.querySelector('#nav a'); const r = document.createRange(); r.selectNodeContents(a); return r.getBoundingClientRect().left - a.getBoundingClientRect().left; });
    check(`390: пункты меню выровнены по началу строки`, aligned < 4, `${Math.round(aligned)}px`);
    await page.keyboard.press('Escape');
    check(`390: Esc закрывает меню, фокус на кнопке`, await page.isHidden('#nav a[href="#trade"]') && await focusedId() === 'menu-button');
    await page.click('#menu-button');
    await page.click('#nav [data-lang="ru"]');
    check(`390: язык переключается из меню`, await page.evaluate(() => document.documentElement.lang) === 'ru' && (await page.textContent('#menu-button')).includes('Закрыть'));
    await page.click('#nav a[href="#materials"]');
    check(`390: переход по пункту закрывает меню`, await page.isHidden('#nav a[href="#trade"]'));
    // лента коллекции
    await page.evaluate(() => { const t = document.querySelector('#pieces'); t.scrollLeft = t.scrollWidth; });
    await page.waitForTimeout(300);
    check(`390: счётчик ленты на последнем предмете`, (await page.textContent('#track-count')) === '6 / 6');
    await page.evaluate(() => { const t = document.querySelector('#pieces'); t.scrollLeft = 0; document.querySelector('#collection').scrollIntoView(); });
    await page.waitForTimeout(300);
    await shot(page, '#collection', `${OUT}/collection-ru-390.png`);
  } else {
    await shot(page, '#collection', `${OUT}/collection-en-1440.png`);
    await shot(page, '#trade', `${OUT}/trade-en-1440.png`);
  }
  check(`${tag}: сценарии без ошибок JS и внешних запросов`, !issues.length, issues.join('; '));
  await context.close();
}

// ---------- 2b. Арабский сценарий (RTL) ----------
for (const width of [390, 1440]) {
  const {page, context, issues} = await open(width, {lang: 'ar'});
  await loadAll(page);
  const tag = `${width} ar`;
  check(`${tag}: lang=ar, dir=rtl, заголовок страницы`, await page.evaluate(() => document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl') && (await page.title()).startsWith('SLOY — مشغل الرخام'));
  await page.evaluate(() => document.querySelector('[data-piece="3"]').scrollIntoView({inline: 'center', block: 'center'}));
  await page.click('[data-add="3"]');
  await page.waitForTimeout(400);
  check(`${tag}: предмет переносится в бриф`, (await page.textContent('#reference-text')).includes('إطار مدفأة · نوع نيرو، مطفأ') && await page.inputValue('#task') === '2');
  await page.check('input[name=stage][value="0"]');
  await page.click('#brief-form button[type=submit]');
  const t = await page.inputValue('#request-text');
  check(`${tag}: арабский TXT`, t.startsWith('طلب مشروع — SLOY') && t.includes('مرجع من المجموعة: إطار مدفأة (نوع نيرو؛ مطفأ)') && t.includes('ما الذي تخطط له: إطار مدفأة') && !/[?؟]:/.test(t), t.split('\n').slice(0, 6).join(' | '));
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-request')]);
  check(`${tag}: поле запроса без внутренней прокрутки (AR)`, await requestFits(page));
  check(`${tag}: арабский текст содержит оговорку`, t.includes(DICT.ar.result.caveat));
  check(`${tag}: имя файла AR`, download.suggestedFilename() === 'sloy-brief-project-ar.txt');
  await page.click('[data-open="0"]');
  await page.keyboard.press('ArrowLeft');
  check(`${tag}: в RTL стрелка влево — следующий предмет`, (await page.textContent('#viewer-count')) === '2 / 6');
  await page.keyboard.press('ArrowRight');
  check(`${tag}: в RTL стрелка вправо — предыдущий предмет`, (await page.textContent('#viewer-count')) === '1 / 6');
  await page.screenshot({path: `${OUT}/viewer-ar-${width}.png`});
  await page.keyboard.press('Escape');
  const flipped = await page.evaluate(() => getComputedStyle(document.querySelector('.hero .button .i')).transform);
  check(`${tag}: стрелки кнопок зеркалятся`, flipped.startsWith('matrix(-1'), flipped);
  if (width === 390) {
    await page.evaluate(() => { const t = document.querySelector('#pieces'); t.scrollLeft = -t.scrollWidth; });
    await page.waitForTimeout(300);
    check(`${tag}: счётчик ленты в RTL на последнем предмете`, (await page.textContent('#track-count')) === '6 / 6');
    check(`${tag}: счётчик читается слева направо`, await page.evaluate(() => getComputedStyle(document.querySelector('#track-count')).direction) === 'ltr');
    await page.evaluate(() => { const t = document.querySelector('#pieces'); t.scrollLeft = 0; document.querySelector('#collection').scrollIntoView(); });
    await page.waitForTimeout(300);
    await shot(page, '#collection', `${OUT}/collection-ar-390.png`);
  } else {
    await shot(page, '#materials', `${OUT}/library-ar-1440.png`);
    await shot(page, '#brief', `${OUT}/brief-result-ar-1440.png`);
  }
  check(`${tag}: без ошибок JS и внешних запросов`, !issues.length, issues.join('; '));
  await context.close();
}

// ---------- 3. Без JavaScript ----------
{
  const {page, context} = await open(1440, {js: false});
  const mism = await page.evaluate(() => [...document.querySelectorAll('[data-t]')].map(el => [el.dataset.t, el.textContent]));
  const bad = mism.filter(([k, v]) => typeof get('en', k) === 'string' && get('en', k) !== v).map(([k]) => k);
  const unknown = mism.filter(([k]) => typeof get('en', k) !== 'string').map(([k]) => k);
  check('no-JS: статический текст совпадает с английским словарём', !bad.length, bad.join(', '));
  check('no-JS: все ключи разметки есть в словаре', !unknown.length, unknown.join(', '));
  const h = await page.evaluate(() => [...document.querySelectorAll('[data-h]')].map(el => [el.dataset.h, el.innerHTML]));
  check('no-JS: заголовки с переносами совпадают', h.every(([k, v]) => get('en', k) === v));
  check('no-JS: коллекция видна, форма скрыта', await page.isVisible('[data-piece="0"] img') && await page.isHidden('#brief-form'));
  const ruKeys = mism.map(([k]) => k).filter(k => typeof get('ru', k) !== 'string');
  check('RU: у всех ключей разметки есть перевод', !ruKeys.length, ruKeys.join(', '));
  const arKeys = mism.map(([k]) => k).filter(k => typeof get('ar', k) !== 'string');
  check('AR: у всех ключей разметки есть перевод', !arKeys.length, arKeys.join(', '));
  await context.close();
}

// ---------- 4. Отказ изображения ----------
{
  const context = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/assets/concepts/vanity-verde.jpg', r => r.abort());
  await page.goto(BASE);
  await page.evaluate(() => document.querySelector('[data-piece="4"]').scrollIntoView());
  await page.waitForTimeout(500);
  check('Отказ изображения: карточка помечена, страница работает', await page.evaluate(() => document.querySelector('[data-piece="4"] .piece-open').classList.contains('img-missing')) && !errors.length);
  await page.click('[data-add="4"]');
  check('Отказ изображения: предмет всё равно добавляется в бриф', (await page.textContent('#reference-text')).includes('Floating vanity'));
  await context.close();
}

await browser.close();
const summary = `${failed ? 'FAILED' : 'OK'}: ${log.filter(l => l.startsWith('PASS')).length} PASS, ${failed} FAIL · ${BASE} · ${new Date().toISOString()}`;
log.push(summary);
fs.writeFileSync(`${OUT}/checks.txt`, log.join('\n') + '\n');
console.log(summary);
process.exit(failed ? 1 : 0);
