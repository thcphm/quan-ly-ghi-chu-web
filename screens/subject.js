/* Trang một môn: bốn ngăn. Ngăn Bài giảng chỉ có các bài của trường, ghi chú nằm trong từng bài. */
import { esc, icon, colorVar, KINDS } from '../dom.js';
import { subject, count, lessonNotes, subjectNotes, subjectRefs } from '../state.js';
import { registerScreen } from '../router.js';
import { noteRow, refRow } from '../rows.js';
import { tom } from '../tom.js';

const main = document.getElementById('main');

function lessonRow(s, l) {
  const c = lessonNotes(s.id, l.n).length;
  return `<button class="row lesson-row" type="button" data-lesson="${esc(s.id)}:${l.n}" style="--acc:${colorVar(s.color)}">
    <span class="row-no">${l.n}</span>
    <span class="row-t"><span>${esc(l.title)}</span></span>
    <span class="row-s">${esc(l.source)}</span>
    <span class="row-w">${c ? `${c} ghi chú` : 'Chưa có ghi chú'}</span>
  </button>`;
}

registerScreen('subject', (id, kind = 'lecture') => {
  const s = subject(id);
  if (!KINDS[kind]) kind = 'lecture';
  const notes = subjectNotes(id).filter((n) => n.kind === kind);
  const refs = subjectRefs(id).filter((r) => r.kind === kind).sort((a, b) => (a.lesson || 99) - (b.lesson || 99));
  let body;
  if (kind === 'lecture') {
    body = s.lessons.map((l) => lessonRow(s, l)).join('') || '<p class="empty">Môn này chưa có bài giảng nào.</p>';
  } else {
    body = notes.map(noteRow).join('') + refs.map(refRow).join('')
      || `<p class="empty">${kind === 'doc' ? 'Môn này chưa có tài liệu. Bấm Thêm file hoặc Thêm thư mục để đưa tài liệu từ máy vào.' : 'Ngăn này chưa có gì. Thêm file từ máy, hoặc bấm Ghi chú mới để viết ghi chú đầu tiên.'}</p>`;
  }
  const canWrite = kind === 'lab' || kind === 'quiz';

  main.innerHTML = `
    <section class="crumb" style="--acc:${colorVar(s.color)}">
      <button class="back" type="button" data-go="library" aria-label="Về kệ môn học">${icon('i-back')}</button>
      <span class="mark">${esc(s.mark || s.code.slice(0, 2))}</span>
      <div><h1>${esc(s.name)}</h1><p>${esc(s.code)}${s.about ? `, ${esc(s.about)}` : ''}</p></div>
      <div class="crumb-actions">
        ${canWrite ? `<button class="ghost" type="button" data-new="${esc(id)}::${kind}">${icon('i-plus')}Ghi chú mới</button>` : ''}
        <button class="ghost" type="button" data-modal="subject-edit" data-id="${esc(id)}">Sửa môn học</button>
        <button class="ghost" type="button" data-modal="subject-remove" data-id="${esc(id)}">Xóa môn học</button>
      </div>
    </section>
    <div class="tabs" role="tablist" style="--acc:${colorVar(s.color)}">
      ${Object.keys(KINDS).map((k) => `<button role="tab" type="button" class="${k === kind ? 'on' : ''}" aria-selected="${k === kind}" data-subject="${esc(id)}" data-kind="${k}">${icon(KINDS[k].icon)}${KINDS[k].name}<b>${count(id, k)}</b></button>`).join('')}
    </div>
    ${kind === 'lecture' ? '' : `<div class="row-tools">
      <button class="ghost" type="button" data-add="files" data-subject-id="${esc(id)}" data-kind="${kind}">${icon('i-plus')}Thêm file</button>
      <button class="ghost" type="button" data-add="folder" data-subject-id="${esc(id)}" data-kind="${kind}">${icon('i-plus')}Thêm thư mục</button>
      <span>Đọc được PDF, Word, TXT, MD</span>
    </div>`}
    <div class="rows${kind === 'lecture' ? ' tall' : ''}">${body}</div>`;

  tom(`<p class="say">Môn ${esc(s.name)} có ${s.lessons.length} bài giảng, ${subjectNotes(id).length} ghi chú và ${subjectRefs(id).length} tài liệu. Mở một bài để đọc slide và ghi chú.</p>`, id);
});
