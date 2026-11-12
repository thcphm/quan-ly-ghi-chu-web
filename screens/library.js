/* Kệ môn học: màn hình đầu tiên. */
import { esc, icon, colorVar, KINDS, greeting } from '../dom.js';
import { state, count, recentNotes } from '../state.js';
import { registerScreen } from '../router.js';
import { noteRow } from '../rows.js';
import { tom } from '../tom.js';
import { dueState, dueParts, sortTasks } from '../due.js';

const main = document.getElementById('main');

function book(s) {
  return `<article class="book" style="--acc:${colorVar(s.color)}">
    <div class="spine"><span>${esc(s.code)}</span></div>
    <div class="cover">
      <div class="cover-top">
        <span class="mark">${esc(s.mark || s.code.slice(0, 2))}</span>
        <div><h3>${esc(s.name)}</h3><p>${esc(s.about)}</p></div>
      </div>
      ${Object.keys(KINDS).map((k) => `<button class="shelf-row" type="button" data-subject="${esc(s.id)}" data-kind="${k}">
        ${icon(KINDS[k].icon)}<span>${KINDS[k].name}</span><b>${count(s.id, k)}</b>
      </button>`).join('')}
      <button class="open" type="button" data-subject="${esc(s.id)}">Mở môn học</button>
    </div>
  </article>`;
}

function dueRow(t) {
  const s = t.subjectId && state.library.subjects.find((x) => x.id === t.subjectId);
  const { day, time } = dueParts(t.due);
  const status = t.done ? { level: 'done', text: 'Đã nộp' } : dueState(t.due);
  return `<div class="due ${status.level}" style="--acc:${colorVar(s ? s.color : 'brand')}">
    <label class="due-check"><input type="checkbox" data-task-done="${esc(t.id)}"${t.done ? ' checked' : ''} aria-label="Đã nộp: ${esc(t.title)}"></label>
    <div class="due-main">
      <p class="due-t">${esc(t.title)}</p>
      <p class="due-w">${s ? `<b>${esc(s.code)}</b>` : ''}<span>${day}</span><span>${time}</span>${t.note ? `<span class="due-n">${esc(t.note)}</span>` : ''}</p>
    </div>
    <em class="due-state">${status.text}</em>
    <div class="due-acts">
      <button type="button" data-task-calendar="${esc(t.id)}">Thêm vào Google Calendar</button>
      <button type="button" data-task-ics="${esc(t.id)}">Tải file lịch</button>
      <button type="button" data-modal="task-edit" data-id="${esc(t.id)}">Sửa</button>
      <button type="button" data-task-remove="${esc(t.id)}">Xóa</button>
    </div>
  </div>`;
}

registerScreen('library', () => {
  const { library, stats } = state;
  const drafts = library.notes.filter((n) => n.origin === 'gd1-draft').slice(0, 4);
  const recent = recentNotes().slice(0, 4);
  const desk = drafts.length
    ? { title: 'Cần đọc lại và sửa', rows: drafts.map(noteRow).join('') }
    : recent.length
      ? { title: 'Ghi chú mới sửa', rows: recent.map(noteRow).join('') }
      : { title: 'Ghi chú', rows: '<p class="empty">Chưa có ghi chú. Mở một bài giảng để viết ghi chú đầu tiên.</p>' };

  const tasks = sortTasks(library.tasks);
  const urgent = tasks.filter((t) => !t.done && ['late', 'today', 'soon'].includes(dueState(t.due).level)).length;

  main.innerHTML = `
    <section class="hello">
      <div>
        <h1>${greeting()}${state.owner ? `, ${esc(state.owner)}` : ''}</h1>
        <p>Bài giảng, bài tập và tài liệu ôn tập của các môn nằm trên kệ này.</p>
      </div>
      <button class="ghost" type="button" data-modal="subject-add">${icon('i-plus')}Thêm môn học</button>
    </section>
    <section class="shelf" aria-label="Danh sách môn học">
      <svg class="lamp" viewBox="0 0 120 150" aria-hidden="true">
        <path d="M60 0v62" stroke="#2a3b57" stroke-width="2"/>
        <path d="M30 96l14-34h32l14 34z" fill="#16233a" stroke="#2a3b57" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="60" cy="97" rx="26" ry="5" fill="#f2c879"/>
      </svg>
      <div class="books">${library.subjects.map(book).join('') || '<p class="empty">Chưa có môn học nào. Bấm Thêm môn học để bắt đầu.</p>'}</div>
      <div class="board"></div>
    </section>
    <section class="desk dues" aria-label="Hạn nộp">
      <div class="dues-head">
        <h2>Sắp đến hạn</h2>
        <button class="ghost small" type="button" data-modal="task-add">${icon('i-plus')}Thêm hạn nộp</button>
      </div>
      <div class="rows">${tasks.map(dueRow).join('') || '<p class="empty">Chưa có hạn nộp nào. Bấm Thêm hạn nộp để ghi lại deadline bài tập, Lab, assignment.</p>'}</div>
    </section>
    <section class="desk">
      <h2>${desk.title}</h2>
      <div class="rows">${desk.rows}</div>
    </section>
    <section class="desk data-narrow" aria-label="Dữ liệu">
      <h2>Dữ liệu</h2>
      <div class="data-actions">
        <button type="button" data-action="export">Xuất dữ liệu</button>
        <button type="button" data-action="import">Nhập dữ liệu</button>
      </div>
    </section>`;

  const message = stats.draftNotes
    ? `${stats.draftNotes} ghi chú mang từ giai đoạn 1 đang là bản nháp do AI soạn. Bạn đọc lại, sửa theo cách hiểu của mình thì nó mới thành ghi chú của bạn.`
    : stats.ownNotes
      ? `Bạn có ${stats.ownNotes} ghi chú tự viết, đã ghi chú ${stats.activeDays} ngày.`
      : 'Mở một môn, chọn một bài giảng rồi viết ghi chú đầu tiên.';
  const dueLine = urgent ? `Bạn có ${urgent} hạn nộp trong 3 ngày tới hoặc đã quá hạn. ` : '';
  tom(`<p class="say">${esc(dueLine + message)}</p>`);
});
