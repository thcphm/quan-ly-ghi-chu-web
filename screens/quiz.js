/* Ôn tập: lật từng câu hỏi hoặc thẻ nhớ của một bộ do Xưởng tạo, đánh dấu đã nhớ hay chưa. */
import { esc, icon, colorVar } from '../dom.js';
import { subject, ref } from '../state.js';
import { registerScreen } from '../router.js';
import { tom, tomPlay } from '../tom.js';

const main = document.getElementById('main');

registerScreen('quiz', (id, onlyUnknown = false) => {
  const r = ref(id);
  const s = subject(r.subjectId);
  const cards = r.tool === 'cards';
  /* Thứ tự các câu sẽ ôn trong lượt này, giữ chỉ số gốc để lưu đúng câu */
  const order = r.quiz.map((_, i) => i).filter((i) => !onlyUnknown || !r.quiz[i].known);
  let at = 0;

  function done() {
    const known = r.quiz.filter((x) => x.known).length;
    const left = r.quiz.length - known;
    main.querySelector('.quiz').innerHTML = `
      <p class="q-meta">Xong lượt ôn</p>
      <h2 class="q">Bạn nhớ ${known} trên ${r.quiz.length} ${cards ? 'thẻ' : 'câu'}.</h2>
      <div class="q-actions">
        ${left ? `<button class="act primary" type="button" data-again="unknown">Ôn lại ${left} ${cards ? 'thẻ' : 'câu'} chưa nhớ</button>` : ''}
        <button class="act" type="button" data-again="all">Ôn lại từ đầu</button>
        <button class="act" type="button" data-ref="${esc(id)}">Đóng</button>
      </div>`;
    main.querySelector('[data-again="unknown"]')?.addEventListener('click', () => registerAgain(true));
    main.querySelector('[data-again="all"]').addEventListener('click', () => registerAgain(false));
    if (!left) tomPlay('cheer', 1.2);
  }
  const registerAgain = (unknown) => document.dispatchEvent(new CustomEvent('quiz:again', { detail: { id, unknown } }));

  function card() {
    if (at >= order.length) return done();
    const index = order[at];
    const item = r.quiz[index];
    main.querySelector('.quiz').innerHTML = `
      <div class="progress" role="img" aria-label="${cards ? 'Thẻ' : 'Câu'} ${at + 1} trên ${order.length}">${order.map((_, i) => `<i class="${i < at ? 'on' : ''}"></i>`).join('')}</div>
      <p class="q-meta">${cards ? 'Thẻ' : 'Câu'} ${at + 1} trên ${order.length}, môn ${esc(s.name)}${r.lesson ? `, Bài ${r.lesson}` : ''}</p>
      <h2 class="q">${esc(item.q)}</h2>
      <div class="answer" id="answer" hidden><p>${esc(item.a)}</p></div>
      <div class="q-actions">
        <button class="act primary" type="button" id="reveal">${cards ? 'Lật thẻ' : 'Xem đáp án'}</button>
        <button class="act" type="button" data-known="false" hidden>Chưa nhớ</button>
        <button class="act" type="button" data-known="true" hidden>Đã nhớ</button>
      </div>`;
    const box = main.querySelector('.quiz');
    box.querySelector('#reveal').addEventListener('click', (e) => {
      box.querySelector('#answer').hidden = false;
      e.currentTarget.hidden = true;
      box.querySelectorAll('[data-known]').forEach((b) => { b.hidden = false; });
      box.querySelector('[data-known="true"]').focus();
    });
    box.querySelectorAll('[data-known]').forEach((b) => b.addEventListener('click', async () => {
      const known = b.dataset.known === 'true';
      const result = await window.api.studio.known(id, index, known);
      if (!result.error) item.known = known;
      at += 1;
      card();
    }));
  }

  main.innerHTML = `
    <section class="crumb" style="--acc:${colorVar(s.color)}">
      <button class="back" type="button" data-ref="${esc(id)}" aria-label="Về sản phẩm">${icon('i-back')}</button>
      <div><h1>${cards ? 'Thẻ nhớ' : 'Ôn tập'}</h1><p>${esc(r.title)}</p></div>
    </section>
    <div class="quiz" style="--acc:${colorVar(s.color)}"></div>`;
  tom(`<p class="say">${cards ? 'Đọc thuật ngữ, tự nhớ lại nghĩa rồi lật thẻ.' : 'Tự trả lời trước rồi mới xem đáp án.'} Bộ này do AI tạo từ nội dung trong thư viện, thấy chỗ nào lạ thì đối chiếu lại với slide.</p>`, r.subjectId, r.lesson || null);
  if (!order.length) done(); else card();
});
