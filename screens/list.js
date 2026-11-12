/* Hai danh sách ở cột trái: ghi chú gần đây, và bài tập, Lab của mọi môn. */
import { esc } from '../dom.js';
import { state, recentNotes } from '../state.js';
import { registerScreen } from '../router.js';
import { noteRow } from '../rows.js';
import { tom } from '../tom.js';

const main = document.getElementById('main');

function list(title, sub, notes, empty) {
  main.innerHTML = `
    <section class="hello"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div></section>
    <div class="rows tall">${notes.map(noteRow).join('') || `<p class="empty">${esc(empty)}</p>`}</div>`;
  tom(`<p class="say">${esc(notes.length ? `Có ${notes.length} ghi chú trong danh sách này.` : empty)}</p>`);
}

registerScreen('recent', () => list('Ghi chú gần đây', 'Mới sửa nằm trên cùng.', recentNotes(), 'Chưa có ghi chú nào.'));
registerScreen('lab', () => list('Bài tập và Lab', 'Ghi chú bài thực hành của mọi môn.', state.library.notes.filter((n) => n.kind === 'lab'), 'Chưa có ghi chú bài tập hay Lab nào.'));
