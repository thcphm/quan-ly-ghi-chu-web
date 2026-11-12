/* Cột trái: số đếm, học kỳ, thanh 5 ngày. Tất cả tính từ dữ liệu thật. */
import { state } from './state.js';

const GOAL_DAYS = 5;

export function updateRail(active) {
  const { library, stats } = state;
  const set = (name, value) => { document.querySelector(`.nav[data-go="${name}"] b`).textContent = value; };
  set('library', library.subjects.length);
  set('recent', library.notes.length);
  set('lab', library.notes.filter((n) => n.kind === 'lab').length);
  if (active) document.querySelectorAll('.nav').forEach((b) => b.classList.toggle('on', b.dataset.go === active));

  document.getElementById('termName').textContent = library.term || '';
  document.getElementById('termSub').textContent = `${library.subjects.length} môn, ${stats.ownNotes} ghi chú của bạn${stats.draftNotes ? `, ${stats.draftNotes} bản nháp` : ''}`;
  const days = stats.activeDays;
  document.querySelectorAll('#streak i').forEach((el, i) => el.classList.toggle('on', i < days));
  document.getElementById('streak').setAttribute('aria-label', `Đã ghi chú ${Math.min(days, GOAL_DAYS)} trên ${GOAL_DAYS} ngày`);
  document.getElementById('streakText').textContent = days ? `Đã ghi chú ${days} ngày` : 'Chưa bắt đầu tính 5 ngày';
}
