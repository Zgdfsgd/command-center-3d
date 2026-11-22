import * as THREE from '../vendor/three.module.min.js';
import { buildRoom, applyMonitorTextures } from './room.js';
import { buildScreens } from './screens.js';
import { monitorTexture } from './textures.js';
import { Orbit, Walker } from './controls.js';
import { initUI, openPanel, closePanel, showTip, hideTip } from './ui.js';
import { initSim } from './sim.js';

/* ---------- WebGL2 探测 ----------
   three r163+ 已移除 WebGL1，这里只认 webgl2，与引擎实际要求一致。
   getContext 本身可能抛异常（沙箱 iframe / 上下文耗尽），同样视为不可用。
   任何失败都向上抛出，由 index.html 的 loader 统一降级 2D。
   注意：探测用的上下文**不能**在这里销毁，否则部分浏览器（尤其 Safari / 集显）
   会把随后的正式上下文一并判为丢失，表现为画布不创建、整页黑屏。 */
const probe = document.createElement('canvas');
let probeGL = null;
try { probeGL = probe.getContext('webgl2'); } catch (e) { probeGL = null; }
if (!probeGL) throw new Error('WebGL2 unavailable');
probe.width = probe.height = 1;

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
/* 上下文创建失败（沙箱 iframe / 显存不足 / 探测后名额被占）必须明确抛错，
   否则 canvas 静默不渲染，页面一片黑且没有任何提示 */
if (!renderer.getContext()) throw new Error('WebGL2 unavailable: renderer context creation failed');
renderer.setSize(window.innerWidth, window.innerHeight);
/* 低配设备降载：4 核以下或内存 ≤4G，像素比压到 1.25 */
const lowSpec = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpec ? 1.25 : 2));
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

/* 业务屏分区反馈：处置哪一类业务，对应分区闪一下 */
const partOverlays = [
  { kind: 'bc', x: 1.9 },
  { kind: 'sec', x: 3.1 },
  { kind: 'net', x: 4.3 }
].map(d => {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.18, 0.62),
    new THREE.MeshBasicMaterial({ color: 0x3fd0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  mesh.position.set(d.x, 2.52, wall.wallZ + 0.1);
  scene.add(mesh);
  return { kind: d.kind, mesh, t: 0 };
});

/* 右墙攻击态势大屏：安全处置时整屏泛红 */
const secWallOverlay = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 1.34),
  new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
);
secWallOverlay.rotation.y = -Math.PI / 2;
secWallOverlay.position.set(8.8, 2.02, 2.25);
scene.add(secWallOverlay);
let secFlashT = 0;

/* ---------- 交互 ---------- */
const controls = new Orbit(camera, renderer.domElement);
/* 轨道活动范围：大厅与健身房各一套，退出第一人称时按所在区域切换 */
const HALL_BOUNDS = { x0: -7.5, x1: 7.5, y0: 0.4, y1: 3.0, z0: -5.2, z1: 5.0, maxR: 17 };
const GYM_BOUNDS = { x0: -7.9, x1: 7.3, y0: 0.4, y1: 4.8, z0: -24.9, z1: -6.2, maxR: 13 };
controls.bounds = HALL_BOUNDS;
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
  /* 5 左后视点：从指挥中心左后角看全厅 */
  { pos: [-8.15, 1.75, 4.75], target: [2.6, 1.45, -3.6] },
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
  // 大厅与健身房被前墙隔开：只允许命中相机同侧的对象，避免“隔墙点器材”
  const inGym = camera.position.z < -5.4;
  const hits = ray.intersectObjects(clickTargets, false)
    .filter(h => inGym ? h.point.z < -5.2 : h.point.z > -5.5);
  if (!hits.length) return null;
  const first = hits[0];
  // 席位牌被台面隐形点击盒挡住时，若先命中指挥台则让位给席位牌
  if (first.object.userData.info?.key === 'desk') {
    const plate = hits.find(h => h.object.userData.pickPriority);
    if (plate) return plate.object;
  }
  return first.object;
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
  if (obj) {
    obj.userData.info.onClick?.();
    openPanel(obj.userData.info.key, obj.userData.info);
    return;
  }
  // 点空地：按点击的地面位置进入第一人称
  const gp = groundAt(e);
  if (gp && gp.z < 5.2) setWalk(true, { x: gp.x, z: gp.z, yaw: walker.yaw });
});

/* ---------- 第一人称行走 ---------- */
const WALK = { xMin: -8.15, xMax: 8.15, zMin: -4.15, zMax: 4.85 };

/* 台面 + 座椅的俯视 footprint：按矩形避让，保留台间与两侧通道 */
const DESK_BLOCKS = [
  { x0: -7.2, x1: -2.8, z0: -2.85, z1: -1.0 },
  { x0: -2.2, x1: 2.2, z0: -2.85, z1: -1.0 },
  { x0: 2.8, x1: 7.2, z0: -2.85, z1: -1.0 }
];

function clampWalk(p) {
  // 机房门开启且人正对门洞时才允许穿行到健身房
  const inDoorX = Math.abs(p.x + 7.6) < 0.78;
  const pass = inDoorX && (room.userData.door?.open || 0) > 0.5;

  if (p.z < -5.5) {
    // 健身房内：器材不做逐件碰撞，仅限制房间边界（旗舰店尺度）
    p.x = THREE.MathUtils.clamp(p.x, -8.6, 7.7);
    p.z = THREE.MathUtils.clamp(p.z, -25.4, -5.5);
    // 不在门洞内时贴近前墙就停住；在门洞内允许继续朝大厅走
    if (!pass && p.z > -5.9) p.z = -5.9;
    return p;
  }

  p.x = THREE.MathUtils.clamp(p.x, WALK.xMin, WALK.xMax);
  // 门洞内允许一直走到健身房，出了门洞立刻被前墙挡住
  p.z = THREE.MathUtils.clamp(p.z, pass ? -6.4 : WALK.zMin, WALK.zMax);
  DESK_BLOCKS.forEach(d => {
    if (p.x <= d.x0 || p.x >= d.x1 || p.z <= d.z0 || p.z >= d.z1) return;
    // 从最近的一侧推出，台间与台两侧的通道保持可通行
    const dl = p.x - d.x0, dr = d.x1 - p.x, db = p.z - d.z0, df = d.z1 - p.z;
    const m = Math.min(dl, dr, db, df);
    if (m === dl) p.x = d.x0;
    else if (m === dr) p.x = d.x1;
    else if (m === db) p.z = d.z0;
    else p.z = d.z1;
  });
  // 右侧应急值班工位操作台
  if (p.z > 0.3 && p.z < 4.15 && p.x > 6.75) p.x = 6.75;
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

function setWalk(on, spawn) {
  if (on && walker.enabled) {
    // 已在行走中：直接传送到新位置
    if (spawn) walker.enter({ pos: [spawn.x, spawn.z], yaw: spawn.yaw ?? 0, pitch: -0.02 });
    return;
  }
  if (on === walker.enabled) return;
  if (on) {
    closePanel();
    const dirV = new THREE.Vector3();
    camera.getWorldDirection(dirV);
    const start = spawn || clampWalk(new THREE.Vector3(camera.position.x, 0, camera.position.z));
    walker.enter({
      pos: [start.x, start.z],
      yaw: spawn ? (spawn.yaw ?? 0) : Math.atan2(-dirV.x, -dirV.z),
      pitch: -0.02
    });
    controls.enabled = false;
    walkBtn.classList.add('active');
    walkBtn.textContent = '退出行走';
  } else {
    walker.exit();
    controls.enabled = true;
    // 先同步按钮状态，避免后续相机计算出问题时按钮卡在“退出行走”
    walkBtn.classList.remove('active');
    walkBtn.textContent = '自由行走';
    // 退出第一人称时镜头留在原地：在健身房内继续用轨道模式看器材、点面板，不跳回大厅
    const inGym = camera.position.z < -5.4;
    controls.bounds = inGym ? GYM_BOUNDS : HALL_BOUNDS;
    const dirV = new THREE.Vector3();
    camera.getWorldDirection(dirV);
    const focus = camera.position.clone().addScaledVector(dirV, inGym ? 4.0 : 4.6);
    focus.y = inGym ? 1.25 : 1.5;
    if (typeof controls.syncToCamera === 'function') controls.syncToCamera(focus);
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

/* 下班了：一键传送到健身房内部（第一人称），门保持开启 */
function enterGym() {
  closePanel();
  const d = room.userData.door;
  if (d) { d.open = 1; d.target = 1; }
  /* 入场视角：站在健身房左侧墙角、贴着左下角，朝对角的远右角看全景 */
  setWalk(true, { x: -8.2, z: -7.2, yaw: -0.72 });
  document.querySelectorAll('#views .btn').forEach(x => x.classList.remove('active'));
}

initUI({
  onView: i => {
    if (walker.enabled) setWalk(false);
    const v = VIEWS[i] || VIEWS[0];
    // 数字视点都是大厅机位，先把轨道范围切回大厅
    controls.bounds = HALL_BOUNDS;
    controls.flyTo(v.pos, v.target);
    closePanel();
  },
  onGym: enterGym,
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

/* 处置台操作 → 场景反馈：应急台灯组、主控台灯带、业务屏分区、右墙大屏 */
const ACTION_PART = { switch: 'bc', ack: 'sec', fix: 'sec', dispatch: 'sec' };
let reactT = 0;

window.addEventListener('sim:action', e => {
  const type = e.detail?.type || '';
  reactT = 3.2;
  room.userData.feedback?.pulse(type);
  const part = ACTION_PART[type];
  partOverlays.forEach(o => { if (o.kind === part) o.t = 2.4; });
  if (type === 'ack' || type === 'fix') secFlashT = 2;
  // 电话动作：来电 / 接听 / 对讲拿起话筒，挂断后放回叉簧
  const phone = room.userData.phone;
  if (phone) {
    if (type === 'ring' || type === 'answer' || type === 'radio') phone.call.on = true;
    else if (type === 'hangup') phone.call.on = false;
  }
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

    // 特级保镖猫：爬行几步 → 站立警戒几秒 → 直立行走几步，循环往复
    if (p.userData.kind === 'cat') {
      const w = p.userData.wander;
      const c = p.userData.cat;
      const pose = p.userData.pose;
      if (!w || !c || !pose) return;

      c.timer -= dt;
      if (c.timer <= 0) {
        if (c.state === 'crawl') {
          c.state = 'stand';
          c.timer = 2.4 + Math.random() * 1.8;
        } else if (c.state === 'stand') {
          c.state = 'walk';
          c.timer = 2.6 + Math.random() * 1.8;
        } else {
          c.state = 'crawl';
          c.timer = 3.4 + Math.random() * 2.2;
        }
      }

      const crawling = c.state === 'crawl';
      const moving = c.state !== 'stand';
      const speed = crawling ? 0.58 : 0.78;

      if (moving) {
        const dx = w.target.x - p.position.x;
        const dz = w.target.z - p.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.14) {
          const n = w.points[(Math.random() * w.points.length) | 0];
          w.target.set(n[0], 0, n[1]);
        } else {
          const step = Math.min(speed * dt, dist);
          p.position.x += (dx / dist) * step;
          p.position.z += (dz / dist) * step;
          p.rotation.y = Math.atan2(dx, dz);
        }
      }

      // 姿态插值：爬行时压低躯干、前爪着地；直立时恢复人形站姿
      const k = Math.min(1, dt * 4.2);
      const T = crawling
        ? { hip: 0.33, torso: 1.15, head: -0.98, arm: -1.11, leg: -0.35, scale: 0.8 }
        : { hip: 0.44, torso: 0.02, head: 0, arm: 0.04, leg: 0, scale: 1 };
      pose.hip += (T.hip - pose.hip) * k;
      pose.torso += (T.torso - pose.torso) * k;
      pose.head += (T.head - pose.head) * k;
      pose.arm += (T.arm - pose.arm) * k;
      pose.leg += (T.leg - pose.leg) * k;
      pose.scale += (T.scale - pose.scale) * k;

      parts.hips.position.y = pose.hip;
      parts.torso.rotation.x = pose.torso;
      parts.head.rotation.x = pose.head;
      parts.legL.scale.y = pose.scale;
      parts.legR.scale.y = pose.scale;
      parts.legL.rotation.x = pose.leg;
      parts.legR.rotation.x = pose.leg;

      if (moving) {
        const gait = Math.sin(t * (crawling ? 9.5 : 7.5)) * (crawling ? 0.32 : 0.5);
        parts.legL.rotation.x = pose.leg + gait;
        parts.legR.rotation.x = pose.leg - gait;
        parts.armL.rotation.x = pose.arm - gait * (crawling ? 0.7 : 0.65);
        parts.armR.rotation.x = pose.arm + gait * (crawling ? 0.7 : 0.65);
        if (crawling) parts.hips.position.y = pose.hip + Math.abs(Math.sin(t * 9.5)) * 0.012;
      } else {
        // 站立警戒：持棍手略抬，头部左右扫视
        parts.armL.rotation.x = pose.arm + Math.sin(t * 1.3) * 0.05;
        parts.armR.rotation.x = pose.arm - 0.16 + Math.sin(t * 1.1) * 0.04;
        parts.hips.position.y = pose.hip + Math.sin(t * 1.6) * 0.006;
      }

      if (parts.tail) {
        parts.tail.rotation.y = Math.sin(t * 2.6) * 0.4;
        parts.tail.rotation.x = crawling ? -0.3 : 0;
      }
      parts.head.rotation.y = Math.sin(t * (moving ? 1.2 : 1.6)) * (moving ? 0.2 : 0.42);
      if (parts.baton) parts.baton.rotation.x = 1.15 + Math.sin(t * 1.4) * 0.05;
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

  // 处置动作：主控台三名值班工程师同时抬头看大屏、抬臂确认
  if (reactT > 0) {
    const k = Math.min(1, reactT / 0.4);
    people.forEach(p => {
      if (p.userData.kind !== 'seated' || !p.userData.seat || p.userData.seat.x < 3) return;
      const parts = p.userData.parts;
      if (!parts) return;
      if (parts.head) {
        parts.head.rotation.y = 0;
        parts.head.rotation.x = (-0.22 + Math.sin(t * 9) * 0.03) * k;
      }
      if (parts.armR) parts.armR.rotation.x = -0.95 * k + Math.sin(t * 7) * 0.22;
      if (parts.armL) parts.armL.rotation.x = -0.78 * k + Math.cos(t * 7) * 0.2;
    });
  }
}

/* ---------- 渲染循环 ---------- */
const clock = new THREE.Clock();
let t = 0;
let rafId = 0;
let frameChecked = false;
function animate() {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;

  controls.update();
  walker.update(dt);
  // 行走按钮文字/高亮每帧跟随真实模式，避免任何路径下停留在“退出行走”
  const walkLabel = walker.enabled ? '退出行走' : '自由行走';
  if (walkBtn.textContent !== walkLabel) walkBtn.textContent = walkLabel;
  walkBtn.classList.toggle('active', walker.enabled);
  updateDoor(dt);
  room.userData.door?.update(dt, camera.position);
  room.userData.gym?.update(t);
  animatePeople(t, dt);
  // 电话动作放在人物动画之后，持机姿态覆盖打字与处置抬臂
  room.userData.phone?.update(t, dt);
  room.userData.updateWallScreen?.(t);
  room.userData.updateNet?.(t);
  room.userData.feedback?.update(t, dt);
  partOverlays.forEach(o => {
    o.t = Math.max(0, o.t - dt);
    o.mesh.material.opacity = o.t > 0 ? 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(t * 12)) : 0;
  });
  secFlashT = Math.max(0, secFlashT - dt);
  secWallOverlay.material.opacity = secFlashT > 0 ? 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(t * 10)) : 0;
  if (reactT > 0) reactT = Math.max(0, reactT - dt);
  if (wall.ledTexture) wall.ledTexture.offset.x = (wall.ledTexture.offset.x - dt * 0.035) % 1;

  if (alarmOn) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
    alarmPlane.material.opacity = 0.14 + pulse * 0.22;
    alarmLight.intensity = 4 + pulse * 6;
  } else if (alarmLight.intensity !== 0) {
    alarmPlane.material.opacity = 0;
    alarmLight.intensity = 0;
  }

  renderer.render(scene, camera);
  // 自我巡检：首帧渲染完仍拿不到绘图上下文（驱动异常 / 名额耗尽）就主动降级，避免黑屏无提示
  if (!frameChecked) {
    frameChecked = true;
    if (!renderer.getContext()) throw new Error('WebGL2 unavailable: context lost before first frame');
    // 首帧成功，告知启动脚本 3D 已正常起来
    window.dispatchEvent(new CustomEvent('cc:ready'));
  }
}

/* 显卡重置 / 驱动崩溃：暂停渲染并交给启动兜底脚本切 2D 看板，避免黑屏无提示 */
const canvasEl = renderer.domElement;
canvasEl.addEventListener('webglcontextlost', e => {
  e.preventDefault();
  cancelAnimationFrame(rafId);
  rafId = 0;
  window.dispatchEvent(new CustomEvent('cc:contextlost', { detail: 'webglcontextlost' }));
});
canvasEl.addEventListener('webglcontextrestored', () => {
  clock.getDelta();
  if (!rafId) animate();
});

animate();
