/* Một hàng ghi chú hoặc tài liệu trong danh sách. */
import { esc, icon, colorVar, KINDS } from './dom.js';
import { subject } from './state.js';

export const badge = (n) => (n.origin === 'gd1-draft' ? '<em>Bản nháp GĐ1</em>' : '');
export const noteTitle = (n) => n.title || 'Ghi chú chưa đặt tên';

export function noteRow(n) {
  const s = subject(n.subjectId);
  return `<button class="row" type="button" data-note="${esc(n.id)}" style="--acc:${colorVar(s.color)}">
    <span class="row-ic">${icon(KINDS[n.kind].icon)}</span>
    <span class="row-t"><span>${esc(noteTitle(n))}</span>${badge(n)}</span>
    <span class="row-s">${esc(s.code)}</span>
    <span class="row-w">${n.lesson ? `Bài ${n.lesson}` : ''}</span>
  </button>`;
}

export function refRow(r) {
  const s = subject(r.subjectId);
  return `<button class="row" type="button" data-ref="${esc(r.id)}" style="--acc:${colorVar(s.color)}">
    <span class="row-ic">${icon(KINDS[r.kind].icon)}</span>
    <span class="row-t"><span>${esc(r.title)}</span><em class="ref">${r.origin === 'file' ? 'File từ máy' : r.origin === 'studio' ? 'Xưởng' : 'Tài liệu'}</em></span>
    <span class="row-s">${esc(s.code)}</span>
    <span class="row-w">${r.lesson ? `${r.kind === 'lab' ? 'Lab' : 'Bài'} ${r.lesson}` : esc(r.source)}</span>
  </button>`;
}
