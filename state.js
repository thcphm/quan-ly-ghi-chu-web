/* Thư viện đang mở và các hàm tra cứu. Dữ liệu gốc nằm ở tiến trình chính; đây là bản sao để vẽ. */
export const state = { library: { subjects: [], notes: [], refs: [], tasks: [], term: '' }, stats: { ownNotes: 0, draftNotes: 0, activeDays: 0 }, gd1Available: false, recovered: false, owner: '' };

export function setLibrary(result) {
  if (result.library) state.library = result.library;
  if (result.stats) state.stats = result.stats;
}

export const subject = (id) => state.library.subjects.find((s) => s.id === id);
export const note = (id) => state.library.notes.find((n) => n.id === id);
export const ref = (id) => state.library.refs.find((r) => r.id === id);
export const isOwn = (n) => n.origin !== 'gd1-draft';

export const lessonNotes = (subjectId, n) => state.library.notes.filter((x) => x.subjectId === subjectId && x.lesson === Number(n));
export const subjectNotes = (subjectId) => state.library.notes.filter((n) => n.subjectId === subjectId);
export const subjectRefs = (subjectId) => state.library.refs.filter((r) => r.subjectId === subjectId);

/* Ngăn Bài giảng đếm số bài của trường. Các ngăn khác đếm ghi chú và tài liệu trong ngăn. */
export function count(subjectId, kind) {
  if (kind === 'lecture') return (subject(subjectId)?.lessons || []).length;
  return subjectNotes(subjectId).filter((n) => n.kind === kind).length + subjectRefs(subjectId).filter((r) => r.kind === kind).length;
}

/* Các bài chưa có ghi chú do người dùng tự viết hoặc đã sửa */
export function gaps(subjectId) {
  return (subject(subjectId)?.lessons || []).filter((l) => !lessonNotes(subjectId, l.n).some(isOwn)).map((l) => l.n);
}

export const recentNotes = () => [...state.library.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export function upsertNote(saved) {
  const notes = state.library.notes;
  const i = notes.findIndex((n) => n.id === saved.id);
  if (i >= 0) notes[i] = saved; else notes.push(saved);
}
export function dropNote(id) {
  state.library.notes = state.library.notes.filter((n) => n.id !== id);
}
