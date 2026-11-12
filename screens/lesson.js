/* Trang một bài giảng: nội dung slide bên trái, ghi chú của bài bên phải. */
import { esc, icon, colorVar } from '../dom.js';
import { subject, lessonNotes } from '../state.js';
import { registerScreen } from '../router.js';
import { noteTitle } from '../rows.js';
import { tom } from '../tom.js';

const main = document.getElementById('main');

registerScreen('lesson', (subjectId, number) => {
  const s = subject(subjectId);
  const l = s.lessons.find((x) => x.n === Number(number));
  const mine = lessonNotes(subjectId, l.n);
  const source = l.source || 'bài giảng';
  const create = `<button class="act primary" type="button" data-new="${esc(subjectId)}:${l.n}:lecture">Ghi chú mới cho bài này</button>`;

  main.innerHTML = `
    <section class="crumb" style="--acc:${colorVar(s.color)}">
      <button class="back" type="button" data-subject="${esc(subjectId)}" data-kind="lecture" aria-label="Về danh sách bài giảng">${icon('i-back')}</button>
      <span class="mark">${l.n}</span>
      <div><h1>${esc(l.title)}</h1><p>${esc(s.code)}, Bài ${l.n}${l.source ? `, ${esc(l.source)}` : ''}</p></div>
    </section>
    <div class="lesson" style="--acc:${colorVar(s.color)}">
      <article class="slide">
        <p class="panel-h">Nội dung ${esc(source)} (bản chữ)</p>
        <div class="slide-text">${l.text ? esc(l.text) : '<span class="more">Bài này chưa có nội dung slide.</span>'}</div>
      </article>
      <section class="lesson-notes">
        <p class="panel-h">Ghi chú của bài này</p>
        ${mine.map((n) => `<button class="mini card" type="button" data-note="${esc(n.id)}"><span>${esc(noteTitle(n))}</span><small>${n.origin === 'gd1-draft' ? 'Bản nháp GĐ1, cần đọc lại và sửa' : 'Ghi chú của bạn'}</small></button>`).join('') || '<p class="empty">Bài này chưa có ghi chú.</p>'}
        ${create}
      </section>
    </div>`;

  tom(`<p class="say">Bài ${l.n} có ${mine.length} ghi chú. Bạn đọc slide bên trái rồi ghi lại theo cách hiểu của mình. Các công cụ trong Xưởng sẽ làm việc trên bài này.</p>`, subjectId, l.n);
});
