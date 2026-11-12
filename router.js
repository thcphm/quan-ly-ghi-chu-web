/* Chuyển màn hình. Mỗi file trong screens/ tự đăng ký màn hình của mình. */
const screens = {};
const hooks = { beforeLeave: async () => {}, afterRender: () => {} };
const EDITORS = ['note', 'newnote', 'ref'];
let lastList = ['library'];
let current = ['library'];

export function registerScreen(name, render) { screens[name] = render; }
export function setHooks(next) { Object.assign(hooks, next); }

export async function go(name, ...args) {
  await hooks.beforeLeave();
  if (!EDITORS.includes(name)) lastList = [name, ...args];
  current = [name, ...args];
  screens[name](...args);
  hooks.afterRender(name, args);
  document.getElementById('main').scrollTop = 0;
}

/* Nút X của ghi chú: quay về màn hình danh sách vừa rời */
export const back = () => go(...lastList);
/* Vẽ lại màn hình đang mở sau khi dữ liệu đổi */
export const refresh = () => go(...current);
