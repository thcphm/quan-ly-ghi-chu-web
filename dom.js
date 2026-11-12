/* Các mẩu dùng chung khi dựng HTML. Mọi chữ người dùng gõ phải đi qua esc(). */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
export const colorVar = (name) => `var(--${/^[a-z]+$/.test(name) ? name : 'brand'})`;
export const $ = (selector, root = document) => root.querySelector(selector);

/* Bốn ngăn cố định của mỗi môn. Ghi chú chỉ thuộc ba ngăn đầu, tài liệu thuộc quiz hoặc doc. */
export const KINDS = {
  lecture: { name: 'Bài giảng', icon: 'i-lecture' },
  lab: { name: 'Bài tập và Lab', icon: 'i-lab' },
  quiz: { name: 'Ôn tập và Quiz', icon: 'i-quiz' },
  doc: { name: 'Tài liệu', icon: 'i-doc' }
};
export const NOTE_KINDS = ['lecture', 'lab', 'quiz'];

export function greeting(hour = new Date().getHours()) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}
