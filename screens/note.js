/* Soạn ghi chú: tự lưu khi dừng gõ, lưu ngay khi rời màn hình hoặc đóng app. Tài liệu dùng cùng khung ở chế độ chỉ đọc. */
import { esc, icon, colorVar, KINDS, NOTE_KINDS } from '../dom.js';
import { state, subject, note, ref, lessonNotes, subjectNotes, subjectRefs, upsertNote, dropNote } from '../state.js';
import { registerScreen, back } from '../router.js';
import { noteTitle } from '../rows.js';
import { updateRail } from '../rail.js';
import { tom, say } from '../tom.js';

const main = document.getElementById('main');
const SAVE_DELAY = 800;
const CLOSE = `<button class="close" type="button" data-close aria-label="Đóng ghi chú">${icon('i-close')}</button>`;

let draft = null;          // ghi chú đang soạn; id chỉ có sau lần lưu đầu tiên
let dirty = false;
let timer = 0;
let chain = Promise.resolve();
let shown = { text: 'Chưa lưu', tone: 'not' };

function status(text, tone = '') {
  shown = { text, tone };
  const el = main.querySelector('.saved');
  if (!el) return;
  el.textContent = text;
  el.className = `saved ${tone}`.trim();
  main.querySelector('.retry').hidden = tone !== 'bad';
}

async function persist() {
  const mine = draft;
  if (!mine || !dirty) return;
  if (!mine.title.trim() && !mine.body.trim()) return;      // ghi chú trống thì chưa tạo
  dirty = false;
  if (draft === mine) status('Đang lưu', 'not');
  const result = await window.api.notes.save({ id: mine.id, subjectId: mine.subjectId, kind: mine.kind, lesson: mine.lesson, title: mine.title, body: mine.body, tags: mine.tags });
  if (result.error) {
    dirty = true;
    if (draft === mine) { status('Chưa lưu được', 'bad'); say(result.error); }
    return;
  }
  const created = !mine.id;
  mine.id = result.note.id;
  mine.origin = result.note.origin;
  upsertNote(result.note);
  state.stats = result.stats;
  updateRail();
  if (draft !== mine) return;
  if (!dirty) status('Đã lưu');
  if (mine.origin !== 'gd1-draft') main.querySelector('.tags em')?.remove();
  if (created) main.querySelector('.note-foot').hidden = false;
}

/* Lưu ngay, nối đuôi các lần lưu để không chạy chồng nhau */
export function saveNow() {
  clearTimeout(timer);
  chain = chain.then(persist);
  return chain;
}
export async function leaveNote() {
  await saveNow();
  draft = null;
  dirty = false;
}

function touch() {
  dirty = true;
  status('Chưa lưu', 'not');
  clearTimeout(timer);
  timer = setTimeout(saveNow, SAVE_DELAY);
}

const chip = (group, value, label, on, color) => `<button class="chip" type="button" data-pick="${group}" data-value="${esc(value)}" aria-pressed="${on}" style="--acc:${color || 'var(--brand)'}">${esc(label)}</button>`;

function render() {
  const d = draft;
  const s = subject(d.subjectId);
  const lessons = s.lessons.length ? s.lessons.map((l) => l.n) : [1, 2, 3, 4, 5, 6, 7, 8];
  const siblings = (d.lesson ? lessonNotes(d.subjectId, d.lesson) : subjectNotes(d.subjectId).filter((n) => n.kind === d.kind)).slice(0, 10);
  const home = d.lesson && s.lessons.some((l) => l.n === d.lesson)
    ? `<button class="back wide" type="button" data-lesson="${esc(s.id)}:${d.lesson}">${icon('i-back')}Bài ${d.lesson}</button>`
    : `<button class="back wide" type="button" data-subject="${esc(s.id)}" data-kind="${d.kind}">${icon('i-back')}${esc(s.name)}</button>`;

  main.innerHTML = `
    <div class="editor" style="--acc:${colorVar(s.color)}">
      <div class="side">
        ${home}
        ${siblings.map((n) => `<button class="mini ${n.id === d.id ? 'on' : ''}" type="button" data-note="${esc(n.id)}"><span>${esc(noteTitle(n))}</span><small>${n.origin === 'gd1-draft' ? 'Bản nháp GĐ1' : 'Ghi chú của bạn'}</small></button>`).join('')}
      </div>
      <article class="paper">
        <p class="paper-meta"><span>${esc(s.code)}, ${KINDS[d.kind].name}${d.lesson ? `, Bài ${d.lesson}` : ''}</span><span class="saved"></span><button class="retry" type="button" hidden>Thử lại</button>${CLOSE}</p>
        <h1 contenteditable="plaintext-only" spellcheck="false" data-ph="Tiêu đề ghi chú" aria-label="Tiêu đề ghi chú"></h1>
        <div class="tags">${d.origin === 'gd1-draft' ? '<em>Bản nháp GĐ1</em>' : ''}${d.tags.map((t) => `<button class="tag" type="button" data-untag="${esc(t)}" title="Bấm để bỏ thẻ">${esc(t)}</button>`).join('')}<input type="text" id="tagInput" placeholder="Thêm thẻ" aria-label="Thêm thẻ" maxlength="30"></div>
        <div class="pick"><span>Môn</span>${state.library.subjects.map((x) => chip('subject', x.id, x.name, x.id === d.subjectId, colorVar(x.color))).join('')}</div>
        <div class="pick"><span>Ngăn</span>${NOTE_KINDS.map((k) => chip('kind', k, KINDS[k].name, k === d.kind)).join('')}</div>
        <div class="pick"><span>Bài</span>${lessons.map((n) => chip('lesson', n, n, n === d.lesson)).join('')}${d.kind === 'lecture' ? '' : chip('lesson', '', 'Không', !d.lesson)}</div>
        <div class="text" contenteditable="plaintext-only" spellcheck="false" data-ph="Viết ghi chú ở đây. Ghi chú tự lưu khi bạn dừng gõ." aria-label="Nội dung ghi chú"></div>
        <div class="note-foot" ${d.id ? '' : 'hidden'}><button class="act" type="button" data-delete>Xóa ghi chú</button></div>
      </article>
    </div>`;

  const title = main.querySelector('.paper h1');
  const body = main.querySelector('.paper .text');
  title.textContent = d.title;
  body.textContent = d.body;
  status(shown.text, shown.tone);

  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); body.focus(); } });
  title.addEventListener('input', () => { d.title = title.innerText.replace(/\s*\n\s*/g, ' ').trim(); touch(); });
  body.addEventListener('input', () => { d.body = body.innerText.replace(/\n+$/, ''); touch(); });
  main.querySelector('.retry').addEventListener('click', saveNow);

  const tagInput = main.querySelector('#tagInput');
  tagInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const tag = tagInput.value.trim();
    if (!tag || d.tags.includes(tag)) { tagInput.value = ''; return; }
    d.tags = [...d.tags, tag];
    touch(); render();
    main.querySelector('#tagInput').focus();
  });
  main.querySelectorAll('[data-untag]').forEach((el) => el.addEventListener('click', () => {
    d.tags = d.tags.filter((t) => t !== el.dataset.untag);
    touch(); render();
  }));
  main.querySelectorAll('[data-pick]').forEach((el) => el.addEventListener('click', () => {
    const { pick, value } = el.dataset;
    if (pick === 'subject') d.subjectId = value;
    if (pick === 'kind') d.kind = value;
    if (pick === 'lesson') d.lesson = value ? Number(value) : null;
    if (d.kind === 'lecture' && !d.lesson) d.lesson = 1;   // ghi chú bài giảng luôn thuộc một bài
    touch(); render();
  }));
  main.querySelector('[data-delete]').addEventListener('click', () => document.getElementById('dlgDeleteNote').showModal());
}

document.getElementById('deleteNoteConfirm').addEventListener('click', async () => {
  const dialog = document.getElementById('dlgDeleteNote');
  if (!draft || !draft.id) return dialog.close();
  clearTimeout(timer);
  await chain;
  const id = draft.id;
  draft = null;
  dirty = false;
  const result = await window.api.notes.remove(id);
  dialog.close();
  if (result.error) return say(result.error);
  dropNote(id);
  state.stats = result.stats;
  updateRail();
  back();
});

function start(next, message) {
  draft = next;
  dirty = false;
  shown = next.id ? { text: 'Đã lưu', tone: '' } : { text: 'Chưa lưu', tone: 'not' };
  render();
  tom(`<p class="say">${esc(message)}</p>`, next.subjectId, next.lesson);
}

registerScreen('note', (id) => {
  const n = note(id);
  start({ ...n, tags: [...n.tags] }, n.origin === 'gd1-draft'
    ? 'Ghi chú này là bản nháp từ giai đoạn 1. Sửa tiêu đề hoặc nội dung theo cách hiểu của bạn thì nó thành ghi chú của bạn.'
    : 'Ghi chú tự lưu khi bạn dừng gõ.');
});

registerScreen('newnote', (subjectId, lesson = null, kind = null) => {
  const s = subject(subjectId) || state.library.subjects[0];
  if (!s) {
    main.innerHTML = '<section class="hello"><div><h1>Ghi chú mới</h1><p>Chưa có môn học nào. Thêm một môn học trước khi viết ghi chú.</p></div></section>';
    return tom('<p class="say">Về kệ môn học rồi bấm Thêm môn học.</p>');
  }
  const k = NOTE_KINDS.includes(kind) ? kind : (s.lessons.length ? 'lecture' : 'lab');
  const n = lesson ? Number(lesson) : (k === 'lecture' ? 1 : null);
  start({ id: null, subjectId: s.id, kind: k, lesson: n, title: '', body: '', tags: [], origin: 'user' }, 'Cứ viết trước. Ghi chú được lưu ngay khi có tiêu đề hoặc nội dung.');
  main.querySelector('.paper h1').focus();
});

registerScreen('ref', (id) => {
  const r = ref(id);
  const s = subject(r.subjectId);
  const siblings = subjectRefs(r.subjectId).filter((x) => x.kind === r.kind).slice(0, 10);
  const studio = r.origin === 'studio' || r.origin === 'file';     // hai loại này người dùng xóa được
  const fromFile = r.origin === 'file';
  const removeLabel = fromFile ? 'Xóa tài liệu' : 'Xóa sản phẩm';
  main.innerHTML = `
    <div class="editor" style="--acc:${colorVar(s.color)}">
      <div class="side">
        <button class="back wide" type="button" data-subject="${esc(s.id)}" data-kind="${r.kind}">${icon('i-back')}${esc(s.name)}</button>
        ${siblings.map((x) => `<button class="mini ${x.id === id ? 'on' : ''}" type="button" data-ref="${esc(x.id)}"><span>${esc(x.title)}</span><small>${esc(x.source)}</small></button>`).join('')}
      </div>
      <article class="paper">
        <p class="paper-meta"><span>${esc(s.code)}, ${KINDS[r.kind].name}, nguồn: ${esc(r.source)}</span><span class="saved not">Chỉ đọc</span>${CLOSE}</p>
        <h1>${esc(r.title)}</h1>
        <div class="tags"><em class="ref">${fromFile ? 'File từ máy' : studio ? 'Sản phẩm của Xưởng' : 'Tài liệu'}</em></div>
        ${r.quiz ? `<p class="product-go"><button class="act primary" type="button" data-quiz="${esc(id)}">Ôn tập với bộ này</button></p>` : ''}
        <div class="text">${esc(r.text)}</div>
        ${studio ? `<div class="note-foot"><button class="act" type="button" data-remove-product="${esc(id)}" data-label="${removeLabel}">${removeLabel}</button></div>` : ''}
      </article>
    </div>`;
  tom(`<p class="say">${fromFile ? 'Đây là file bạn thêm từ máy. T.O.M dùng nó làm nguồn khi trả lời câu hỏi.' : studio ? 'Sản phẩm này do AI tạo từ nội dung trong thư viện. Bạn nên đối chiếu lại với slide.' : 'Đây là tài liệu để đọc và tra cứu, không sửa được. Tài liệu do AI tạo, bạn nên đối chiếu lại với slide.'}</p>`, r.subjectId, r.lesson || null);
});
