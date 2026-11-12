/* Cột T.O.M: lời nhắc theo màn hình, câu trả lời gần nhất, rồi tới Xưởng (công cụ và danh sách đã tạo). */
import { esc, icon, colorVar } from './dom.js';
import { state, subject, subjectRefs, gaps } from './state.js';
import { go } from './router.js';

const body = document.getElementById('tomBody');
let currentSubject = null;
let currentLesson = null;
let answer = '';          // câu hỏi và câu trả lời gần nhất, giữ lại khi chuyển màn hình

export const tomPlay = (name, seconds) => document.dispatchEvent(new CustomEvent('tom:play', { detail: { name, seconds } }));

/* Xưởng: công cụ tạo sản phẩm học tập, tách khỏi phần ghi chú */
const TOOLS = [
  { id: 'sum', name: 'Tóm tắt', icon: 'i-sum', color: 'brand' },
  { id: 'quiz', name: 'Câu hỏi', icon: 'i-quiz', color: 'screen' },
  { id: 'cards', name: 'Thẻ nhớ', icon: 'i-cards', color: 'lamp' },
  { id: 'outline', name: 'Đề cương', icon: 'i-doc', color: 'amp' },
  { id: 'terms', name: 'Thuật ngữ', icon: 'i-lecture', color: 'desk' },
  { id: 'gaps', name: 'Bài thiếu', icon: 'i-check', color: 'terminal' }
];
function productTool(title, tool) {
  const own = TOOLS.find((t) => t.id === tool);
  if (own) return own;
  if (/SELF-QUIZ/i.test(title)) return TOOLS[1];
  if (/GLOSSARY|tra cuu/i.test(title)) return TOOLS[4];
  if (/SUMMARY|LIÊN HỆ/i.test(title)) return TOOLS[0];
  if (/AI NOTE/i.test(title)) return TOOLS[5];
  return TOOLS[3];
}

function studio(subjectId) {
  const s = subjectId && subject(subjectId);
  const all = (s ? subjectRefs(subjectId) : state.library.refs).filter((r) => r.origin !== 'file');     // file từ máy là nguồn, không phải sản phẩm
  const made = all.slice(0, 6).map((r) => {
    const t = productTool(r.title, r.tool);
    return `<button class="made-row" type="button" data-ref="${esc(r.id)}" style="--acc:${colorVar(t.color)}">
      ${icon(t.icon)}<span><b>${esc(r.title)}</b><small>${esc(subject(r.subjectId).code)}, ${esc(r.source)}</small></span>
    </button>`;
  }).join('');
  return `<section class="studio" aria-label="Xưởng">
    <p class="tom-h">Xưởng${s ? `, môn ${esc(s.name)}` : ''}</p>
    <div class="tools">${TOOLS.map((t) => `<button class="tool" type="button" data-tool="${t.id}" style="--acc:${colorVar(t.color)}">${icon(t.icon)}<span>${t.name}</span></button>`).join('')}</div>
    <p class="tool-note" id="toolNote" role="status" hidden></p>
    <p class="tom-h">Đã tạo (${all.length})</p>
    <div class="made">${made || '<p class="empty">Chưa có sản phẩm nào.</p>'}</div>
    ${s && all.length > 6 ? `<button class="link" type="button" data-subject="${esc(subjectId)}" data-kind="doc">Xem tất cả ${all.length} tài liệu</button>` : ''}
  </section>`;
}

/* html: lời nhắc và tối đa một nút chính. subjectId và lesson: môn, bài đang mở, để Xưởng và câu hỏi làm việc trên đúng chỗ đó. */
export function tom(html, subjectId = null, lesson = null) {
  currentSubject = subjectId;
  currentLesson = lesson;
  body.innerHTML = `${html}<div id="tomAnswer" aria-live="polite">${answer}</div>${studio(subjectId)}`;
}

export function say(message) {
  const el = body.querySelector('.say');
  if (el) el.textContent = message; else body.insertAdjacentHTML('afterbegin', `<p class="say">${esc(message)}</p>`);
}

let running = false;
/* Năm công cụ AI: tạo sản phẩm từ bài đang mở (hoặc cả môn), lưu vào danh sách Đã tạo rồi mở ra */
async function runStudio(id, out) {
  if (running) return;
  if (!currentSubject) { out.textContent = 'Mở một môn học hoặc một bài giảng rồi bấm lại.'; out.hidden = false; return; }
  const tool = TOOLS.find((t) => t.id === id);
  const scope = currentLesson ? `Bài ${currentLesson}` : `cả môn ${subject(currentSubject).name}`;
  running = true;
  out.textContent = `T.O.M đang tạo ${tool.name} từ ${scope}. Việc này mất vài giây.`;
  out.hidden = false;
  tomPlay('think', 3);
  let result;
  try {
    result = await window.api.studio.run(id, currentSubject, currentLesson);
  } catch (error) {
    result = { error: 'Không chạy được công cụ lúc này.' };
  }
  running = false;
  const note = document.getElementById('toolNote');
  if (result.error) {
    if (note) { note.textContent = result.error; note.hidden = false; }
    return;
  }
  state.library.refs.unshift(result.product);
  go(result.product.quiz ? 'quiz' : 'ref', result.product.id);
}

export function useTool(id) {
  const out = document.getElementById('toolNote');
  if (id !== 'gaps') return runStudio(id, out);
  if (!currentSubject) {
    out.textContent = 'Mở một môn học rồi bấm lại.';
  } else {
    const missing = gaps(currentSubject);
    out.textContent = missing.length
      ? `Các bài chưa có ghi chú của bạn: ${missing.map((n) => `Bài ${n}`).join(', ')}.`
      : 'Bài nào cũng đã có ghi chú của bạn.';
    tomPlay('think', 1.2);
  }
  out.hidden = false;
}

/* ---------- Hỏi đáp: T.O.M chỉ trả lời từ nguồn có trong thư viện ---------- */

/* Nguồn bấm được: mở đúng bài giảng, ghi chú hoặc tài liệu chứa đoạn đó */
function sourceAttr(s) {
  if (s.type === 'lesson') return `data-lesson="${esc(s.subjectId)}:${Number(s.lesson)}"`;
  if (s.type === 'note') return `data-note="${esc(s.id)}"`;
  return `data-ref="${esc(s.id)}"`;
}
const sourceButton = (s) => `<button class="src" type="button" ${sourceAttr(s)}><b>${Number(s.n)}</b><span>${esc(s.label)}</span></button>`;

function replyHtml(result) {
  if (result.error) return `<p class="note">${esc(result.error)}</p>`;
  if (result.mode === 'none') return '<p>Thư viện của bạn chưa có thông tin về câu này.</p>';
  if (result.mode === 'ai') {
    const byNumber = new Map(result.sources.map((s) => [s.n, s]));
    const points = result.points.map((p) => `<li>${esc(p.text)}${p.sources.filter((n) => byNumber.has(n)).map((n) => `<button class="cite" type="button" ${sourceAttr(byNumber.get(n))} title="${esc(byNumber.get(n).label)}" aria-label="Nguồn ${n}: ${esc(byNumber.get(n).label)}">${n}</button>`).join('')}</li>`).join('');
    return `<p class="tom-h">Trả lời từ nguồn trong thư viện</p><ul>${points}</ul><div class="srcs">${result.sources.map(sourceButton).join('')}</div>`;
  }
  const why = result.notice || (result.hasKey ? '' : 'Chưa có khóa AI nên mình chưa diễn đạt lại được. Đây là nguyên văn các đoạn khớp trong thư viện. Bấm nút bánh răng để dán khóa.');
  const quotes = result.sources.map((s) => `${sourceButton(s)}<p class="quote">${esc(s.text.length > 360 ? `${s.text.slice(0, 360)}…` : s.text)}</p>`).join('');
  return `${why ? `<p class="note">${esc(why)}</p>` : ''}<p class="tom-h">Các đoạn khớp trong thư viện</p>${quotes}`;
}

function showAnswer(html) {
  answer = html;
  const box = document.getElementById('tomAnswer');
  if (box) { box.innerHTML = html; box.scrollIntoView({ block: 'nearest' }); }
}

let asking = false;
export async function askTom(question) {
  const text = question.trim();
  if (!text || asking) return;
  asking = true;
  const asked = `<p class="asked">${esc(text)}</p>`;
  showAnswer(`${asked}<div class="reply pending">T.O.M đang đọc thư viện.</div>`);
  tomPlay('think', 2);
  let result;
  try {
    result = await window.api.ai.ask(text, currentSubject);
  } catch (error) {
    result = { error: 'Không hỏi được T.O.M lúc này.' };
  }
  asking = false;
  showAnswer(`${asked}<div class="reply">${replyHtml(result)}</div>`);
  if (result.mode === 'ai') tomPlay('point', 1.4);
}
