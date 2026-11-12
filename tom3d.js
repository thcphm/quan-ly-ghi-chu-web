/* T.O.M 3D trong khung trợ lí: nhìn theo chuột, vẫy chào, phản ứng khi người dùng bấm. */
import * as THREE from 'three';
import { createMascot } from './mascot.js';

const canvas = document.getElementById('tomCanvas');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

try {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 0.8, 0.1, 30);
  camera.position.set(0, 1.28, 6.6);
  camera.lookAt(0, 1.08, 0);
  scene.add(new THREE.HemisphereLight('#dbe7ff', '#27345a', 0.5));
  const key = new THREE.DirectionalLight('#ffffff', 1.5);
  key.position.set(2.5, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#4fdcff', 2.6);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const mascot = createMascot({ shell: '#e6eaf1', accent: '#1fb5b0', mark: '#e6fbf9' }, renderer);
  scene.add(mascot.group);

  function fit() {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    renderer.setSize(box.width, box.height, false);
    camera.aspect = box.width / box.height;
    camera.updateProjectionMatrix();
  }
  fit();
  new ResizeObserver(fit).observe(canvas);

  addEventListener('pointermove', (e) => {
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    const x = (e.clientX - (box.left + box.width / 2)) / innerWidth * 2.4;
    const y = (e.clientY - (box.top + box.height * 0.3)) / innerHeight * 2.4;
    mascot.look(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  });

  /* app.js gửi sự kiện tom:play để T.O.M phản ứng */
  document.addEventListener('tom:play', (e) => { if (!reduceMotion) mascot.play(e.detail.name, e.detail.seconds || 1.6); });
  canvas.addEventListener('click', () => mascot.play('cheer', 0.9));

  let last = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || !canvas.offsetWidth) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    mascot.update(reduceMotion ? 0 : dt);
    renderer.render(scene, camera);
  })(last);

  if (reduceMotion) { mascot.update(0.016); } else mascot.play('wave', 2);
  document.body.classList.add('tom-3d');
} catch (err) {
  /* Máy không chạy được WebGL: giữ khuôn mặt vẽ bằng CSS */
  console.warn('T.O.M 3D không chạy được, dùng khuôn mặt 2D.', err);
}
