/* Khởi động app, xử lý bấm, các hộp thoại. Giao diện chỉ nói chuyện với dữ liệu qua window.api. */
import { state, setLibrary, subject, subjectNotes, subjectRefs } from './state.js';
import { go, back, refresh, setHooks } from './router.js';
import { updateRail } from './rail.js';
import { say, useTool, askTom } from './tom.js';
import { leaveNote, saveNow } from './screens/note.js';
import './screens/library.js';
import './screens/subject.js';
import './screens/lesson.js';
import './screens/list.js';
import './screens/quiz.js';
import './search.js';

const api = window.api;
const RAIL = { subject: 'library', lesson: 'library', note: 'library', newnote: 'library', ref: 'library', quiz: 'library' };
setHooks({
  beforeLeave: leaveNote,
  afterRender: (name) => updateRail(RAIL[name] || name)
});
api.onFlush(saveNow);

/* ---------- Hộp thoại ---------- */
const dlgSubject = document.getElementById('dlgSubject');
const formSubject = document.getElementById('formSubject');
const subjectError = document.getElementById('subjectError');
const dlgRemove = document.getElementById('dlgRemove');
const dlgGd1 = document.getElementById('dlgGd1');

function openSubjectDialog(id) {
  const s = id && subject(id);
  formSubject.reset();
  formSubject.dataset.id = s ? s.id : '';
  subjectError.hidden = true;
  formSubject.code.disabled = !!s;
  document.getElementById('dlgTitle').textContent = s ? 'Sửa môn học' : 'Thêm môn học';
  document.getElementById('subjectSubmit').textContent = s ? 'Lưu môn học' : 'Thêm môn học';
  if (s) {
    formSubject.code.value = s.code;
    formSubject.name.value = s.name;
    formSubject.about.value = s.about;
    formSubject.color.value = s.color;
  }
  dlgSubject.showModal();
  (s ? formSubject.name : formSubject.code).focus();
}

formSubject.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = formSubject.dataset.id;
  const fields = { name: formSubject.name.value, about: formSubject.about.value, color: formSubject.color.value };
  const result = await api.subjects.save(id ? { id, ...fields } : { code: formSubject.code.value, ...fields });
  if (result.error) {
    subjectError.textContent = result.error;
    subjectError.hidden = false;
    return;
  }
  setLibrary(result);
  dlgSubject.close();
  if (id) refresh(); else go('library');
});

function openRemoveDialog(id) {
  const s = subject(id);
  dlgRemove.dataset.id = id;
  dlgRemove.querySelector('p').textContent = `Xóa môn ${s.name}? ${subjectNotes(id).length} ghi chú và ${subjectRefs(id).length} tài liệu của môn sẽ mất, không lấy lại được.`;
  dlgRemove.showModal();
}
document.getElementById('removeConfirm').addEventListener('click', async () => {
  const result = await api.subjects.remove(dlgRemove.dataset.id);
  dlgRemove.close();
  if (result.error) return say(result.error);
  setLibrary(result);
  go('library');
});

document.getElementById('gd1Confirm').addEventListener('click', async () => {
  const result = await api.gd1.import();
  dlgGd1.close();
  if (result.error) return say(result.error);
  setLibrary(result);
  await refresh();
  say(`Đã nhập ${result.added.lessons} bài giảng, ${result.added.notes} ghi chú nháp và ${result.added.refs} tài liệu từ giai đoạn 1.`);
});

/* ---------- Cài đặt T.O.M: khóa Gemini ---------- */
const dlgAi = document.getElementById('dlgAi');
const aiKey = document.getElementById('aiKey');
const aiError = document.getElementById('aiError');
const aiSave = document.getElementById('aiSave');

function showAiStatus(status) {
  document.getElementById('aiStatus').textContent = status.hasKey
    ? `Đã có khóa. T.O.M đang dùng mô hình ${status.model}.`
    : 'Chưa có khóa. T.O.M đang trả lời bằng cách liệt kê các đoạn khớp.';
  document.getElementById('aiClear').hidden = !status.hasKey;
}
async function openAiDialog() {
  aiKey.value = '';
  aiError.hidden = true;
  showAiStatus(await api.ai.status());
  dlgAi.showModal();
}
document.getElementById('formAi').addEventListener('submit', async (e) => {
  e.preventDefault();
  aiError.hidden = true;
  aiSave.disabled = true;
  aiSave.textContent = 'Đang kiểm tra khóa';
  const result = await api.ai.setKey(aiKey.value);
  aiSave.disabled = false;
  aiSave.textContent = 'Lưu khóa';
  aiKey.value = '';
  if (result.error) {
    aiError.textContent = result.error;
    aiError.hidden = false;
    return;
  }
  showAiStatus(result);
  say('Đã lưu khóa. Giờ bạn hỏi, mình sẽ trả lời từ nguồn trong thư viện và ghi rõ nguồn.');
});
document.getElementById('aiClear').addEventListener('click', async () => showAiStatus(await api.ai.clearKey()));

const askInput = document.getElementById('askInput');
document.getElementById('askForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const question = askInput.value;
  askInput.value = '';
  askTom(question);
});

/* ---------- Hạn nộp ---------- */
const dlgTask = document.getElementById('dlgTask');
const formTask = document.getElementById('formTask');
const taskError = document.getElementById('taskError');
const dlgRemoveTask = document.getElementById('dlgRemoveTask');
const task = (id) => state.library.tasks.find((t) => t.id === id);

function openTaskDialog(id) {
  const t = id && task(id);
  formTask.reset();
  formTask.dataset.id = t ? t.id : '';
  taskError.hidden = true;
  document.getElementById('taskTitle').textContent = t ? 'Sửa hạn nộp' : 'Thêm hạn nộp';
  formTask.subjectId.replaceChildren(new Option('Không gắn môn', ''), ...state.library.subjects.map((s) => new Option(`${s.code} ${s.name}`, s.id)));
  if (t) {
    formTask.title.value = t.title;
    formTask.subjectId.value = t.subjectId || '';
    [formTask.date.value, formTask.time.value] = t.due.split('T');
    formTask.note.value = t.note || '';
  } else {
    formTask.time.value = '23:59';
  }
  dlgTask.showModal();
  formTask.title.focus();
}

async function taskChanged(result) {
  if (result.error) return say(result.error);
  setLibrary(result);
  await refresh();
  return result;
}

formTask.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fields = { title: formTask.title.value, subjectId: formTask.subjectId.value || null, due: `${formTask.date.value}T${formTask.time.value}`, note: formTask.note.value };
  const id = formTask.dataset.id;
  const result = await api.tasks.save(id ? { id, ...fields } : fields);
  if (result.error) {
    taskError.textContent = result.error;
    taskError.hidden = false;
    return;
  }
  dlgTask.close();
  await taskChanged(result);
  say(id ? 'Đã lưu hạn nộp.' : 'Đã thêm hạn nộp. Bấm Thêm vào Google Calendar để điện thoại và email cũng nhắc bạn.');
});

document.addEventListener('change', async (e) => {
  const box = e.target.closest('[data-task-done]');
  if (box) await taskChanged(await api.tasks.done(box.dataset.taskDone, box.checked));
});

document.addEventListener('click', async (e) => {
  const d = e.target.closest('[data-task-calendar],[data-task-ics],[data-task-remove]')?.dataset;
  if (!d) return;
  if (d.taskCalendar) {
    const result = await api.tasks.calendar(d.taskCalendar);
    say(result.error || 'Đã mở Google Calendar trong trình duyệt với sự kiện điền sẵn. Bấm Lưu ở đó là xong; Google sẽ nhắc theo cài đặt thông báo của lịch.');
  } else if (d.taskIcs) {
    const result = await api.tasks.ics(d.taskIcs);
    if (result.error) return say(result.error);
    if (!result.canceled) say(`Đã lưu file ${result.file}. Mở file này để thêm vào Outlook, lịch điện thoại hoặc lịch khác.`);
  } else {
    dlgRemoveTask.dataset.id = d.taskRemove;
    dlgRemoveTask.querySelector('p').textContent = `Xóa hạn nộp "${task(d.taskRemove)?.title || ''}"? Sự kiện đã thêm trên Google Calendar không bị xóa theo.`;
    dlgRemoveTask.showModal();
  }
});
document.getElementById('removeTaskConfirm').addEventListener('click', async () => {
  const result = await api.tasks.remove(dlgRemoveTask.dataset.id);
  dlgRemoveTask.close();
  await taskChanged(result);
});

/* ---------- Sản phẩm của Xưởng: ôn tập, xóa ---------- */
const dlgRemoveProduct = document.getElementById('dlgRemoveProduct');
document.addEventListener('click', (e) => {
  const quiz = e.target.closest('[data-quiz]');
  if (quiz) return go('quiz', quiz.dataset.quiz);
  const remove = e.target.closest('[data-remove-product]');
  if (remove) {
    dlgRemoveProduct.dataset.id = remove.dataset.removeProduct;
    document.getElementById('removeProductConfirm').textContent = remove.dataset.label || 'Xóa';
    dlgRemoveProduct.showModal();
  }
});
document.addEventListener('quiz:again', (e) => go('quiz', e.detail.id, e.detail.unknown));
document.getElementById('removeProductConfirm').addEventListener('click', async () => {
  const id = dlgRemoveProduct.dataset.id;
  const result = await api.studio.remove(id);
  dlgRemoveProduct.close();
  if (result.error) return say(result.error);
  state.library.refs = state.library.refs.filter((r) => r.id !== id);
  back();     // về màn hình danh sách vừa rời
});

/* ---------- Thêm file và thư mục từ máy ---------- */
document.addEventListener('click', async (e) => {
  const add = e.target.closest('[data-add]');
  if (!add) return;
  const { add: mode, subjectId, kind } = add.dataset;
  const result = await (mode === 'folder' ? api.sources.addFolder(subjectId, kind) : api.sources.addFiles(subjectId, kind));
  if (result.canceled) return;
  if (result.error) return say(result.error);
  setLibrary(result);
  await refresh();
  const parts = [`Đã thêm ${result.added.length} file.`];
  if (result.updated.length) parts.push(`Cập nhật ${result.updated.length} file đã có.`);
  if (result.skipped.length) parts.push(`Bỏ qua ${result.skipped.length} file: ${result.skipped.slice(0, 3).map((s) => s.reason).join(' ')}${result.skipped.length > 3 ? ' Và các file khác.' : ''}`);
  say(parts.join(' '));
});

/* ---------- Xuất và nhập dữ liệu ---------- */
const dlgImport = document.getElementById('dlgImport');
async function exportData() {
  const result = await api.data.export();
  if (result.canceled) return;
  if (result.error) return say(result.error);
  say(`Đã xuất ${result.counts.subjects} môn, ${result.counts.notes} ghi chú và ${result.counts.refs} tài liệu ra file ${result.file}.`);
}
document.getElementById('importConfirm').addEventListener('click', async () => {
  dlgImport.close();
  const result = await api.data.import();
  if (result.canceled) return;
  if (result.error) return say(result.error);
  setLibrary(result);
  await go('library');
  say(`Đã nhập ${result.library.subjects.length} môn và ${result.library.notes.length} ghi chú. Thư viện cũ vẫn được giữ một bản trong trình duyệt.`);
});
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'export') exportData();
  if (action === 'import') dlgImport.showModal();
});

const MODALS = {
  'ai-settings': openAiDialog,
  'subject-add': () => openSubjectDialog(null),
  'subject-edit': (el) => openSubjectDialog(el.dataset.id),
  'subject-remove': (el) => openRemoveDialog(el.dataset.id),
  'task-add': () => openTaskDialog(null),
  'task-edit': (el) => openTaskDialog(el.dataset.id),
  gd1: () => dlgGd1.showModal()
};

/* ---------- Bấm: mọi nút điều hướng dùng thuộc tính data-*, xử lý ở một chỗ ---------- */
document.addEventListener('click', (e) => {
  const cancel = e.target.closest('[data-cancel]');
  if (cancel) return cancel.closest('dialog').close();
  const t = e.target.closest('[data-go],[data-subject],[data-lesson],[data-new],[data-note],[data-ref],[data-tool],[data-modal],[data-close]');
  if (!t) return;
  const d = t.dataset;
  if ('close' in d) back();
  else if (d.modal) MODALS[d.modal](t);
  else if (d.tool) useTool(d.tool);
  else if (d.lesson) go('lesson', ...d.lesson.split(':'));
  else if (d.new !== undefined) { const [sid, lesson, kind] = d.new.split(':'); go('newnote', sid, lesson ? Number(lesson) : null, kind || null); }
  else if (d.note) go('note', d.note);
  else if (d.ref) go('ref', d.ref);
  else if (d.subject) go('subject', d.subject, d.kind);
  else go(d.go);
});

/* Cửa sổ hẹp: T.O.M thu vào, bấm khuôn mặt trên thanh để mở */
const tomPanel = document.getElementById('tom');
const tomToggle = document.getElementById('tomToggle');
tomToggle.addEventListener('click', () => tomToggle.setAttribute('aria-expanded', tomPanel.classList.toggle('show')));

/* ---------- Khởi động ---------- */
const first = await api.library.load();
setLibrary(first);
state.gd1Available = first.gd1Available;
state.owner = first.owner || '';
state.recovered = first.recovered;
await go('library');
if (first.recovered) say('File dữ liệu bị hỏng. Mình đã mở bản sao lưu gần nhất và giữ lại file hỏng trong thư mục dữ liệu.');

const { library } = state;
const empty = !library.notes.length && !library.refs.length && library.subjects.every((s) => !s.lessons.length);
if (first.gd1Available && empty && !first.recovered) dlgGd1.showModal();
