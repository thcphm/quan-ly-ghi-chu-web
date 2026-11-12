/* Ô tìm kiếm trên thanh trên: tìm theo tên ngay khi gõ, rồi tìm thêm trong nội dung. */
import { esc, colorVar, KINDS } from './dom.js';
import { state, subject } from './state.js';

const q = document.getElementById('q');
const found = document.getElementById('found');
const plain = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const TITLE_LIMIT = 7;
const DELAY = 200;
let timer = 0;
let turn = 0;

const hit = (attr, code, title, kind, color, extra = '') => `<button class="hit ${extra}" type="button" ${attr} style="--acc:${colorVar(color)}"><b>${esc(code)}</b><span>${esc(title)}</span><small>${esc(kind)}</small></button>`;

/* Khớp theo tên: môn học, bài giảng, ghi chú, tài liệu */
function byTitle(key) {
  const out = [];
  const { subjects, notes, refs } = state.library;
  for (const s of subjects) if (plain(`${s.code} ${s.name}`).includes(key)) out.push(hit(`data-subject="${esc(s.id)}"`, s.code, s.name, 'Môn học', s.color));
  for (const s of subjects) for (const l of s.lessons) if (plain(l.title).includes(key)) out.push(hit(`data-lesson="${esc(s.id)}:${l.n}"`, s.code, `Bài ${l.n}: ${l.title}`, 'Bài giảng', s.color));
  for (const n of notes) if (plain(`${n.title} ${n.tags.join(' ')}`).includes(key)) out.push(hit(`data-note="${esc(n.id)}"`, subject(n.subjectId).code, n.title || 'Ghi chú chưa đặt tên', 'Ghi chú', subject(n.subjectId).color));
  for (const r of refs) if (plain(r.title).includes(key)) out.push(hit(`data-ref="${esc(r.id)}"`, subject(r.subjectId).code, r.title, KINDS[r.kind].name, subject(r.subjectId).color));
  return out.slice(0, TITLE_LIMIT);
}

/* Khớp trong nội dung: hiện một mẩu quanh chỗ khớp, kèm nguồn */
function snippet(text, key) {
  const first = key.split(' ').find((w) => w.length > 1) || key;
  const at = Math.max(0, plain(text).indexOf(first) - 40);
  const cut = text.slice(at, at + 150).replace(/\s+/g, ' ');
  return `${at ? '…' : ''}${cut}${at + 150 < text.length ? '…' : ''}`;
}
function inside(p, key) {
  const attr = p.type === 'lesson' ? `data-lesson="${esc(p.subjectId)}:${Number(p.lesson)}"` : p.type === 'note' ? `data-note="${esc(p.id)}"` : `data-ref="${esc(p.id)}"`;
  return `<button class="hit inside" type="button" ${attr} style="--acc:${colorVar(subject(p.subjectId)?.color)}"><b>${esc(p.label)}</b><span>${esc(snippet(p.text, key))}</span></button>`;
}

function close() {
  found.hidden = true;
  clearTimeout(timer);
  turn += 1;
}

function search() {
  const text = q.value.trim();
  const key = plain(text);
  clearTimeout(timer);
  if (!key) return close();
  const mine = ++turn;
  const titles = byTitle(key);
  found.innerHTML = titles.join('') || '<p class="empty searching">Đang tìm trong nội dung.</p>';
  found.hidden = false;
  timer = setTimeout(async () => {
    const passages = await window.api.search.find(text, null);
    if (mine !== turn || passages.error) return;
    const content = passages.map((p) => inside(p, key));
    found.innerHTML = titles.length + content.length
      ? titles.join('') + (content.length ? `<p class="found-h">Trong nội dung</p>${content.join('')}` : '')
      : '<p class="empty">Không thấy môn học, bài giảng hay ghi chú nào khớp. Thử từ khác.</p>';
  }, DELAY);
}

q.addEventListener('input', search);
q.addEventListener('focus', search);
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); q.select(); }
  if (e.key === 'Escape' && !found.hidden) { close(); q.blur(); }
});
document.addEventListener('click', (e) => {
  if (e.target.closest('#found .hit')) { close(); q.value = ''; return; }
  if (!e.target.closest('.search-wrap')) close();
});
