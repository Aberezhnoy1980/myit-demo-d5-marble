(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const data = window.SLOY_CONTENT;
// Piece index → image, stone family and the matching task in the brief.
const PIECES = [
  {file: 'table', big: 'table-1536', task: 3},
  {file: 'fireplace', task: 2},
  {file: 'basin', task: 1},
  {file: 'object', task: 6},
  {file: 'column', task: 5}
];
const ORDER = $$('[data-piece]').map(el => Number(el.dataset.piece));
const TYPES = ['project', 'samples', 'consultation'];
const stones = new Set();
let lang = 'en', reference = null, viewerIndex = 0, viewerOrigin = null, menuOpen = false;

const t = () => data[lang];
const get = path => path.split('.').reduce((o, k) => (o == null ? o : o[k]), t());
const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const checked = name => { const el = $(`input[name="${name}"]:checked`); return el ? Number(el.value) : null; };
const checkedAll = name => $$(`input[name="${name}"]:checked`).map(el => Number(el.value));
const typeVal = () => checked('type') ?? 0;
// Разделители списков: в арабском — «،» и «؛».
const comma = () => (lang === 'ar' ? '، ' : ', ');
const semi = () => (lang === 'ar' ? '؛ ' : '; ');

/* ---------- language ---------- */
function applyLanguage() {
  const d = t();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = d.meta.title;
  $('meta[name="description"]').content = d.meta.description;
  $$('[data-t]').forEach(el => { const v = get(el.dataset.t); if (typeof v === 'string') el.textContent = v; });
  $$('[data-h]').forEach(el => { const v = get(el.dataset.h); if (typeof v === 'string') el.innerHTML = v; });
  $$('[data-a]').forEach(el => el.setAttribute('aria-label', get(el.dataset.a)));
  $$('[data-a-alt]').forEach(el => { el.alt = get(el.dataset.aAlt); });
  $$('[data-ph]').forEach(el => { el.placeholder = get(el.dataset.ph); });
  $$('[data-alt]').forEach(img => { img.alt = `${d.pieces[img.dataset.alt].name} — ${d.collection.alt}`; });
  $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  setMenu(menuOpen);
  updateType();
  renderReference();
  updateSamples();
  updateTrack();
  if ($('#viewer').open) renderViewer();
  if (!$('#summary').hidden) buildBrief();
}
$$('[data-lang]').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; applyLanguage(); }));

/* ---------- menu (narrow screens) ---------- */
const nav = $('#nav'), menuButton = $('#menu-button');
function setMenu(open) {
  menuOpen = open;
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  $('span', menuButton).textContent = open ? t().nav.close : t().nav.menu;
}
menuButton.addEventListener('click', () => setMenu(!menuOpen));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuButton.focus(); } });
matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

/* ---------- collection ---------- */
const track = $('#pieces');
function updateTrack() {
  if (getComputedStyle(track).display !== 'flex') return;
  const cards = $$('.piece', track);
  const step = cards[1].offsetLeft - cards[0].offsetLeft;
  const max = track.scrollWidth - track.clientWidth;
  const pos = Math.abs(track.scrollLeft), rtl = document.documentElement.dir === 'rtl';
  const idx = pos >= max - 2 ? cards.length - 1 : Math.round(pos / Math.abs(step));
  $('#track-count').textContent = fmt(t().collection.count, {i: idx + 1, n: cards.length});
  const fill = $('#track-fill');
  fill.style.width = `${100 / cards.length}%`;
  fill.style.transform = `translateX(${(rtl ? -idx : idx) * 100}%)`;
}
let trackFrame = 0;
track.addEventListener('scroll', () => { cancelAnimationFrame(trackFrame); trackFrame = requestAnimationFrame(updateTrack); }, {passive: true});
addEventListener('resize', updateTrack);

$$('.piece-open img').forEach(img => {
  const mark = () => img.closest('.piece-open').classList.toggle('img-missing', !(img.complete && img.naturalWidth > 0));
  img.addEventListener('error', mark);
  img.addEventListener('load', mark);
});

function renderReference() {
  const has = reference !== null;
  if (has) {
    const p = t().pieces[reference];
    $('#reference-text').textContent = `${p.name} · ${p.material}${comma()}${p.finish}`;
  }
  $('#f-reference').hidden = !has || typeVal() !== 0;
  $$('.add').forEach(b => {
    const on = Number(b.dataset.add) === reference;
    b.classList.toggle('is-added', on);
    $('use', b).setAttribute('href', on ? '#i-check' : '#i-plus');
    $('span', b).textContent = on ? t().collection.inBrief : t().collection.add;
  });
}

function useInBrief(i) {
  reference = i;
  setType(0);
  $('#task').value = String(PIECES[i].task);
  clearError('task');
  renderReference();
  status(fmt(t().form.added, {x: t().pieces[i].name}));
  goToForm();
}
$$('[data-add]').forEach(b => b.addEventListener('click', () => useInBrief(Number(b.dataset.add))));
$('#reference-remove').addEventListener('click', () => { reference = null; renderReference(); invalidate(); status(''); $('#task').focus(); });

/* ---------- viewer ---------- */
const viewer = $('#viewer'), viewerImage = $('#viewer-image');
function renderViewer() {
  const i = ORDER[viewerIndex], d = t(), p = d.pieces[i], src = PIECES[i].big || PIECES[i].file;
  $('#viewer-error').hidden = true;
  viewerImage.hidden = false;
  if (!viewerImage.src.endsWith(`assets/concepts/${src}.jpg`)) viewerImage.src = `assets/concepts/${src}.jpg`;
  viewerImage.alt = `${p.name} — ${d.collection.alt}`;
  $('#viewer-count').textContent = fmt(d.collection.count, {i: viewerIndex + 1, n: ORDER.length});
  $('#viewer-title').textContent = p.name;
  $('#viewer-text').textContent = p.text;
  $('#viewer-material').textContent = p.material;
  $('#viewer-finish').textContent = p.finish;
  $('#viewer-application').textContent = p.application;
}
function openViewer(i, origin) {
  viewerOrigin = origin;
  viewerIndex = ORDER.indexOf(i);
  renderViewer();
  viewer.showModal();
  $('#viewer-close').focus();
}
function stepViewer(dir) { viewerIndex = (viewerIndex + dir + ORDER.length) % ORDER.length; renderViewer(); }
$$('[data-open]').forEach(b => b.addEventListener('click', () => openViewer(Number(b.dataset.open), b)));
$('#viewer-close').addEventListener('click', () => viewer.close());
$('#viewer-prev').addEventListener('click', () => stepViewer(-1));
$('#viewer-next').addEventListener('click', () => stepViewer(1));
$('#viewer-use').addEventListener('click', () => { const i = ORDER[viewerIndex]; viewerOrigin = null; viewer.close(); useInBrief(i); });
viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select')) return;
  // В RTL «вперёд» — влево.
  const forward = document.documentElement.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const back = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
  if (e.key === back) { e.preventDefault(); stepViewer(-1); }
  if (e.key === forward) { e.preventDefault(); stepViewer(1); }
});
viewer.addEventListener('close', () => { viewerOrigin?.focus({preventScroll: true}); viewerOrigin = null; });
viewerImage.addEventListener('error', () => { viewerImage.hidden = true; $('#viewer-error').hidden = false; });

/* ---------- material library ---------- */
function syncStones() {
  $$('[data-stone-toggle]').forEach(b => b.setAttribute('aria-pressed', String(stones.has(Number(b.dataset.stoneToggle)))));
  $$('input[name="stone"]').forEach(c => { c.checked = stones.has(Number(c.value)); });
  updateSamples();
}
function updateSamples() {
  const n = stones.size, link = $('#sample-request');
  $('#sample-count').textContent = n ? fmt(t().library.selected, {n}) : t().library.none;
  link.setAttribute('aria-disabled', String(!n));
  if (n) link.removeAttribute('tabindex'); else link.setAttribute('tabindex', '-1');
}
$$('[data-stone-toggle]').forEach(b => b.addEventListener('click', () => {
  const i = Number(b.dataset.stoneToggle);
  if (stones.has(i)) stones.delete(i); else stones.add(i);
  syncStones();
  clearError('materials');
  invalidate();
}));

/* ---------- entry points into the brief ---------- */
function goToForm() {
  const form = $('#brief-form');
  const ty = typeVal();
  let focus = null;
  if (ty === 0) focus = !$('#task').value ? $('#task') : checked('stage') === null ? $('input[name="stage"]') : $('#scope');
  else if (ty === 1) focus = !stones.size ? $('input[name="stone"]') : $('input[name="finish"]');
  else focus = checked('format') === null ? $('input[name="format"]') : $('#times');
  history.replaceState(null, '', '#brief');
  form.scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  focus.focus({preventScroll: true});
}
$$('[data-start]').forEach(a => a.addEventListener('click', e => {
  const kind = a.dataset.start;
  if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
  setMenu(false);
  if (!kind) return; // plain anchor: header CTA
  e.preventDefault();
  if (kind === 'home') { setType(0); setRadio('role', 0); status(''); }
  if (kind === 'trade') { setType(0); status(''); }
  if (kind === 'samples') { setType(1); status(stones.size ? fmt(t().form.samplesAdded, {n: stones.size}) : ''); }
  if (kind === 'consultation') { setType(2); status(''); }
  goToForm();
}));

/* ---------- brief form ---------- */
const form = $('#brief-form');
function setRadio(name, value) { const el = $(`input[name="${name}"][value="${value}"]`); if (el) el.checked = true; }
function setType(n) { setRadio('type', n); updateType(); invalidate(); }
function status(text) { $('#form-status').textContent = text; }
function updateType() {
  const ty = typeVal(), f = t().form;
  $$('[data-for]').forEach(el => { el.hidden = !el.dataset.for.split(' ').includes(String(ty)); });
  $('#f-reference').hidden = reference === null || ty !== 0;
  $('#materials-legend').textContent = ty === 1 ? f.materialsSamples : f.materials;
  const mm = $('#materials-mark');
  mm.textContent = ty === 1 ? f.required : f.optional;
  mm.classList.toggle('req', ty === 1);
  $('#scope-label').textContent = ty === 1 ? f.scopeSamples : f.scope;
  const sm = $('#stage-mark');
  sm.textContent = ty === 0 ? f.required : f.optional;
  sm.classList.toggle('req', ty === 0);
  ['task', 'stage', 'materials', 'format'].forEach(clearError);
}
function fieldOf(id) { return id === 'task' ? $('#task') : $('#f-' + id); }
function clearError(id) {
  $(`#${id}-error`).hidden = true;
  const el = fieldOf(id);
  el.removeAttribute('aria-invalid');
  el.removeAttribute('aria-describedby');
}
function showError(id) {
  $(`#${id}-error`).hidden = false;
  const el = fieldOf(id);
  el.setAttribute('aria-invalid', 'true');
  el.setAttribute('aria-describedby', `${id}-error`);
}
function invalidate() { $('#summary').hidden = true; $('#action-status').textContent = ''; }

form.addEventListener('change', e => {
  const el = e.target;
  if (el.name === 'type') { updateType(); renderReference(); status(''); }
  if (el.name === 'stone') { const i = Number(el.value); if (el.checked) stones.add(i); else stones.delete(i); syncStones(); clearError('materials'); }
  if (el.name === 'stage') clearError('stage');
  if (el.name === 'format') clearError('format');
  if (el.id === 'task') clearError('task');
  invalidate();
});
form.addEventListener('input', invalidate);

function validate() {
  const ty = typeVal(), errors = [];
  ['task', 'stage', 'materials', 'format'].forEach(clearError);
  if (ty === 0) {
    if (!$('#task').value) errors.push(['task', $('#task')]);
    if (checked('stage') === null) errors.push(['stage', $('input[name="stage"]')]);
  }
  if (ty === 1 && !stones.size) errors.push(['materials', $('input[name="stone"]')]);
  if (ty === 2 && checked('format') === null) errors.push(['format', $('input[name="format"]')]);
  errors.forEach(([id]) => showError(id));
  if (errors.length) {
    const target = errors[0][1];
    target.focus({preventScroll: true});
    fieldOf(errors[0][0]).scrollIntoView({block: 'center', behavior: 'auto'});
  }
  return !errors.length;
}

function buildBrief() {
  const d = t(), f = d.form, r = d.result, ty = typeVal();
  const role = checked('role'), stage = checked('stage');
  const text = id => $('#' + id).value.trim() || r.notSpecified;
  const stoneNames = [...stones].sort((a, b) => a - b).map(i => d.materials[i].name).join(comma()) || r.notSelected;
  const rows = [[f.typeLegend, f.types[ty]], [f.roleLegend, role === null ? r.notSpecified : f.roles[role]]];
  if (ty === 0) {
    const p = reference === null ? null : d.pieces[reference];
    rows.push(
      [f.reference, p ? `${p.name} (${p.material}${semi()}${p.finish})` : r.notSelected],
      [f.task, f.tasks[Number($('#task').value)]],
      [f.materials, stoneNames],
      [f.scope, text('scope')],
      [f.location, text('location')],
      [f.stage, f.stages[stage]]
    );
  }
  if (ty === 1) {
    const finishes = checkedAll('finish').map(i => d.library.finishes[i].name).join(comma()) || r.notSelected;
    rows.push(
      [f.materialsSamples, stoneNames],
      [f.finishes, finishes],
      [f.scopeSamples, text('scope')],
      [f.location, text('location')],
      [f.stage, stage === null ? r.notSpecified : f.stages[stage]]
    );
  }
  if (ty === 2) rows.push([f.format, f.formats[checked('format')]], [f.times, text('times')]);
  rows.push([f.notes, $('#notes').value.trim() || r.notProvided]);
  $('#request-text').value = [r.titles[ty], '', ...rows.map(([k, v]) => `${k.replace(/[?؟:]\s*$/, '')}: ${v}`), '', r.caveat, '', r.next[ty], '', r.noSend].join('\n');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate()) return;
  buildBrief();
  status('');
  const summary = $('#summary');
  summary.hidden = false;
  $('#action-status').textContent = '';
  summary.focus({preventScroll: true});
  summary.scrollIntoView({block: 'start', behavior: 'auto'});
});
$('#edit').addEventListener('click', () => {
  const first = $('input[name="type"]:checked');
  form.scrollIntoView({block: 'start', behavior: 'auto'});
  first.focus({preventScroll: true});
});
$('#copy-request').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw Error('no clipboard');
    await navigator.clipboard.writeText($('#request-text').value);
    $('#action-status').textContent = t().result.copied;
  } catch {
    $('#action-status').textContent = t().result.copyFailed;
    $('#request-text').focus();
    $('#request-text').select();
  }
});
$('#download-request').addEventListener('click', () => {
  let url;
  try {
    url = URL.createObjectURL(new Blob([$('#request-text').value], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sloy-brief-${TYPES[typeVal()]}-${lang}.txt`;
    document.body.append(a);
    a.click();
    a.remove();
    $('#action-status').textContent = t().result.downloaded;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    if (url) URL.revokeObjectURL(url);
    $('#action-status').textContent = t().result.downloadFailed;
    $('#request-text').focus();
    $('#request-text').select();
  }
});

applyLanguage();
})();
