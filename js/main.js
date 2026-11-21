import * as THREE from '../vendor/three.module.min.js';
import { buildRoom, applyMonitorTextures } from './room.js';
import { buildScreens } from './screens.js';
import { monitorTexture } from './textures.js';
import { Orbit, Walker } from './controls.js';
import { initUI, openPanel, closePanel, showTip, hideTip } from './ui.js';
import { initSim } from './sim.js';

/* ---------- WebGL 可用性检查（3D 失败时降级 2D） ---------- */
const probe = document.createElement('canvas');
if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
  document.getElementById('fallback').style.display = 'flex';
  throw new Error('WebGL unavailable');
}

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.style.touchAction = 'none';
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e12);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 80);

/* ---------- 灯光 ---------- */
const hemi = new THREE.HemisphereLight(0xffffff, 0xc4ced7, 1.35);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.7);
dir.position.set(4, 7.5, 7);
dir.castShadow = true;
dir.shadow.mapSize.set(2048, 2048);
dir.shadow.camera.left = -13;
dir.shadow.camera.right = 13;
dir.shadow.camera.top = 10;
dir.shadow.camera.bottom = -8;
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 30;
dir.shadow.bias = -0.0006;
dir.shadow.normalBias = 0.02;
scene.add(dir);

const pointDefs = [
  [-4.2, 3.16, -3.4], [4.2, 3.16, -3.4],
  [-4.2, 3.16, 1.0], [4.2, 3.16, 1.0],
  [0, 3.1, 4.4]
];
const points = pointDefs.map(p => {
  const l = new THREE.PointLight(0xfff4e6, 13, 11, 2);
  l.position.set(...p);
  scene.add(l);
  return l;
});

/* ---------- 场景 ---------- */
const room = buildRoom(scene);
applyMonitorTextures(room, [
  monitorTexture(0), monitorTexture(1), monitorTexture(0), monitorTexture(1)
]);
const wall = buildScreens(scene);

// 告警覆盖层（中部“安全播出”分区变红）
const alarmPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(1.2, 0.64),
  new THREE.MeshBasicMaterial({ color: 0xff2f2f, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
);
alarmPlane.position.set(1.9, 2.52, wall.wallZ + 0.095);
scene.add(alarmPlane);
const alarmLight = new THREE.PointLight(0xff3b30, 0, 13, 2);
alarmLight.position.set(2.0, 2.2, -4.2);
scene.add(alarmLight);

/* ---------- 交互 ---------- */
const controls = new Orbit(camera, renderer.domElement);
controls.target.set(0, 1.5, -3.4);
controls.r = 8.4;
controls.theta = 0;
controls.phi = 1.5;
controls.apply();

const VIEWS = [
  { pos: [0, 2.05, 4.9], target: [0, 1.35, -3.2] },
  { pos: [-3.2, 1.62, 0.9], target: [1.0, 1.6, -4.6] },
  { pos: [1.0, 1.85, 0.4], target: [3.0, 2.15, -5.2] },
  { pos: [1.2, 1.55, 0.9], target: [5.2, 1.05, -2.35] },
  { pos: [0, 3.05, 3.9], target: [0, 0.8, -2.4] },
  /* 6 回望玻璃门：相机贴在大屏前，朝后墙玻璃门方向 */
  { pos: [0.3, 1.8, -4.05], target: [-0.3, 1.45, 5.2] }
];

const clickTargets = [];
scene.traverse(o => {
  if (o.isMesh && o.userData.info) clickTargets.push(o);
});

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downAt = null;

function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(pointer, camera);
  const hits = ray.intersectObjects(clickTargets, false);
  return hits.length ? hits[0].object : null;
}

function setHover(obj) {
  if (hovered === obj) return;
  if (hovered) {
    if (hovered.userData.frame) {
      hovered.userData.frame.material.color.set(0x0a1118);
      hovered.scale.set(1, 1, 1);
    }
    if (hovered.userData.isWall) hovered.material.color.set(0xffffff);
  }
  hovered = obj;
  if (obj) {
    if (obj.userData.frame) {
      obj.userData.frame.material.color.set(0x2f9fc9);
      obj.scale.set(1.015, 1.015, 1);
    }
    if (obj.userData.isWall) obj.material.color.set(0xcfe9ff);
    renderer.domElement.style.cursor = 'pointer';
  } else {
    renderer.domElement.style.cursor = 'grab';
    hideTip();
  }
}

renderer.domElement.addEventListener('pointermove', e => {
  if (walker.enabled) { hideTip(); renderer.domElement.style.cursor = 'grab'; return; }
  if (e.buttons) { hideTip(); return; }
  const obj = pick(e);
  setHover(obj);
  if (obj) showTip(obj.userData.info.title, e.clientX, e.clientY);
  else hideTip();
});

renderer.domElement.addEventListener('pointerdown', e => {
  downAt = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || walker.enabled) { downAt = null; return; }
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;
  const obj = pick(e);
  if (obj) openPanel(obj.userData.info.key);
});

/* ---------- 第一人称行走 ---------- */
const WALK = { xMin: -8.15, xMax: 8.15, zMin: -4.15, zMax: 4.85 };

function clampWalk(p) {
  p.x = THREE.MathUtils.clamp(p.x, WALK.xMin, WALK.xMax);
  p.z = THREE.MathUtils.clamp(p.z, WALK.zMin, WALK.zMax);
  // 三张控制台与座椅区域不可穿行，从两侧通道绕行
  if (p.z > -2.95 && p.z < 0.6) p.z = p.z < -1.2 ? -2.95 : 0.6;
  // 右侧应急值班工位操作台
  if (p.z > 0.55 && p.z < 4.15 && p.x > 6.45) p.x = 6.45;
  return p;
}

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const walkRay = new THREE.Raycaster();
const walkPoint = new THREE.Vector3();

function groundAt(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  walkRay.setFromCamera(pointer, camera);
  return walkRay.ray.intersectPlane(groundPlane, walkPoint) ? walkPoint.clone() : null;
}

const walker = new Walker(camera, renderer.domElement, { groundAt, clamp: clampWalk });
const walkBtn = document.getElementById('walk-btn');

function setWalk(on) {
  if (on === walker.enabled) return;
  if (on) {
    closePanel();
    const dirV = new THREE.Vector3();
    camera.getWorldDirection(dirV);
    const start = clampWalk(new THREE.Vector3(camera.position.x, 0, camera.position.z));
    walker.enter({ pos: [start.x, start.z], yaw: Math.atan2(-dirV.x, -dirV.z), pitch: -0.02 });
    controls.enabled = false;
    walkBtn.classList.add('active');
    walkBtn.textContent = '退出行走';
  } else {
    walker.exit();
    controls.enabled = true;
    controls.apply();
    walkBtn.classList.remove('active');
    walkBtn.textContent = '自由行走';
  }
  const hint = document.querySelector('#hint span');
  if (hint) hint.textContent = on
    ? '拖拽环视 · 点击地面向前走 · WASD / 方向键移动 · F 退出'
    : '点击地面进入第一人称行走（F 切换）';
  hideTip();
}

walkBtn.addEventListener('click', () => setWalk(!walker.enabled));
window.addEventListener('keydown', e => {
  if (e.code === 'KeyF') setWalk(!walker.enabled);
  else if (e.code === 'Escape' && walker.enabled) setWalk(false);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- 告警演练 ---------- */
let alarmOn = false;
const baseHemi = hemi.intensity, baseDir = dir.intensity;
const basePoints = points.map(p => p.intensity);

function alarmScene(on) {
  alarmOn = on;
  if (on) {
    hemi.intensity = 0.55;
    dir.intensity = 0.75;
    points.forEach(p => p.intensity = 4.5);
    renderer.toneMappingExposure = 0.92;
  } else {
    hemi.intensity = baseHemi;
    dir.intensity = baseDir;
    points.forEach((p, i) => p.intensity = basePoints[i]);
    renderer.toneMappingExposure = 1.05;
    alarmPlane.material.opacity = 0;
    alarmLight.intensity = 0;
  }
}

const sim = initSim();

initUI({
  onView: i => {
    if (walker.enabled) setWalk(false);
    const v = VIEWS[i] || VIEWS[0];
    controls.flyTo(v.pos, v.target);
    closePanel();
  },
  onAlarm: on => {
    alarmScene(on);
    if (on) sim.open('sec');
  }
});

/* ---------- 后墙中间玻璃门：靠近并面向时自动开合 ---------- */
const doorAnchor = new THREE.Vector3(0, 1.2, 5.4);
const camDir = new THREE.Vector3();
const toDoor = new THREE.Vector3();
let doorOpen = 0;

function updateDoor(dt) {
  camera.getWorldDirection(camDir);
  toDoor.copy(doorAnchor).sub(camera.position);
  const dist = toDoor.length();
  toDoor.normalize();
  const want = dist < 4.2 && camDir.dot(toDoor) > 0.55 ? 1 : 0;
  doorOpen += (want - doorOpen) * Math.min(1, dt * 3);
  (room.userData.slideDoors || []).forEach(d => {
    d.obj.position.x = d.dir * (0.925 + 1.55 * doorOpen);
  });
}

/* ---------- 人物动作：打字、环视、巡逻、故障处置 ---------- */
const people = room.userData.people || [];

/* 处置台操作触发值班员肢体反馈 */
let reactT = 0;
let reactWho = null;
window.addEventListener('sim:action', () => {
  reactT = 2.6;
  reactWho = people.find(p => p.userData.patrick) || people[0] || null;
});

function animatePeople(t, dt) {
  people.forEach(p => {
    const parts = p.userData.parts;
    if (!parts) return;
    const seed = p.position.x * 1.7 + p.position.z * 0.9;

    if (p.userData.kind === 'seated') {
      if (parts.armL) parts.armL.rotation.x = Math.sin(t * 2.6 + seed) * 0.09;
      if (parts.armR) parts.armR.rotation.x = Math.sin(t * 2.2 + seed + 1.3) * 0.11;
      if (parts.head) parts.head.rotation.y = Math.sin(t * 0.45 + seed) * 0.24;
      if (parts.head) parts.head.rotation.x = Math.sin(t * 0.32 + seed) * 0.05;
      return;
    }

    // 高级猫工：大厅内不定位置游走
    if (p.userData.kind === 'cat') {
      const w = p.userData.wander;
      if (w.wait > 0) {
        w.wait -= dt;
        if (parts.legL) parts.legL.rotation.x *= 0.86;
        if (parts.legR) parts.legR.rotation.x *= 0.86;
        if (parts.armL) parts.armL.rotation.x *= 0.86;
        if (parts.armR) parts.armR.rotation.x *= 0.86;
      } else {
        const dx = w.target.x - p.position.x;
        const dz = w.target.z - p.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.12) {
          const n = w.points[(Math.random() * w.points.length) | 0];
          w.target.set(n[0], 0, n[1]);
          w.wait = 0.8 + Math.random() * 1.6;
        } else {
          const step = Math.min(w.speed * dt, dist);
          p.position.x += (dx / dist) * step;
          p.position.z += (dz / dist) * step;
          p.rotation.y = Math.atan2(dx, dz);
          const sw = Math.sin(t * 8.5) * 0.45;
          if (parts.legL) parts.legL.rotation.x = sw;
          if (parts.legR) parts.legR.rotation.x = -sw;
          if (parts.armL) parts.armL.rotation.x = -sw * 0.35;
          if (parts.armR) parts.armR.rotation.x = sw * 0.35;
        }
      }
      if (parts.tail) parts.tail.rotation.y = Math.sin(t * 2.4) * 0.55;
      if (parts.head) parts.head.rotation.y = Math.sin(t * 1.1) * 0.22;
      return;
    }

    const patrol = p.userData.patrol;
    if (patrol) {
      const c = (patrol.z0 + patrol.z1) / 2;
      const amp = (patrol.z1 - patrol.z0) / 2;
      p.position.z = c + Math.sin(t * 0.55) * amp;
      const step = Math.cos(t * 0.55) * amp;
      const swing = THREE.MathUtils.clamp(step * 2.4, -0.34, 0.34);
      if (parts.legL) parts.legL.rotation.x = swing;
      if (parts.legR) parts.legR.rotation.x = -swing;
      if (parts.armL) parts.armL.rotation.x = -swing * 0.7;
      if (parts.armR) parts.armR.rotation.x = swing * 0.7;
      if (parts.head) parts.head.rotation.y = Math.sin(t * 0.7) * 0.3;
      return;
    }

    // 站立观察 / 处置动作
    if (parts.head) parts.head.rotation.y = Math.sin(t * 0.38 + 1) * 0.34;
    if (p.userData.idle) {
      const idle = p.userData.idle;
      if (parts.armR) parts.armR.rotation.x = -Math.abs(Math.sin(t * 0.9)) * idle.arm * 0.45 - 0.15;
      if (parts.armL) parts.armL.rotation.x = Math.sin(t * 0.7 + 1) * 0.08;
    }
  });

  // 处置动作：站立值班员抬臂确认 / 拉起对讲
  if (reactWho && reactT > 0) {
    const parts = reactWho.userData.parts;
    if (parts) {
      if (parts.armR) parts.armR.rotation.x = -1.15 + Math.sin(t * 7) * 0.28;
      if (parts.armL) parts.armL.rotation.x = -1.0 + Math.cos(t * 7) * 0.28;
      if (parts.head) parts.head.rotation.x = -0.12;
    }
  }
}

/* ---------- 渲染循环 ---------- */
const clock = new THREE.Clock();
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;

  controls.update();
  walker.update(dt);
  updateDoor(dt);
  animatePeople(t, dt);
  if (reactT > 0) reactT = Math.max(0, reactT - dt);
  if (wall.ledTexture) wall.ledTexture.offset.x = (wall.ledTexture.offset.x - dt * 0.035) % 1;

  if (alarmOn) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
    alarmPlane.material.opacity = 0.14 + pulse * 0.22;
    alarmLight.intensity = 4 + pulse * 6;
  }

  renderer.render(scene, camera);
}
animate();
