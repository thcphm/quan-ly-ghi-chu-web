/* Hạn nộp: tính còn bao lâu và viết ngày giờ cho dễ đọc. Ngày giờ lưu dạng "2026-11-20T23:59" theo giờ trên máy. */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const pad = (n) => String(n).padStart(2, '0');
const dayIndex = (d) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY + 0.5);

/* Trạng thái hiện cạnh hạn nộp: late (quá hạn), today, soon (trong 3 ngày), later */
export function dueState(due, now = new Date()) {
  const end = new Date(due);
  const left = end.getTime() - now.getTime();
  if (left <= 0) return { level: 'late', text: 'Quá hạn' };
  const days = dayIndex(end) - dayIndex(now);
  if (days === 0) return { level: 'today', text: left < HOUR ? `Còn ${Math.max(1, Math.floor(left / 60000))} phút` : 'Hôm nay' };
  if (days === 1) return { level: 'soon', text: 'Ngày mai' };
  return { level: days <= 3 ? 'soon' : 'later', text: `Còn ${days} ngày` };
}

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

/* "Thứ 4, 15/01/2031" và "23:59" */
export function dueParts(due) {
  const d = new Date(due);
  return { day: `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/* Chưa xong xếp trước, gần hạn nhất lên đầu; việc đã xong nằm cuối */
export function sortTasks(tasks) {
  return [...(tasks || [])].sort((a, b) => (a.done - b.done) || a.due.localeCompare(b.due));
}
