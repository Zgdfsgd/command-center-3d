import * as THREE from '../vendor/three.module.min.js';
import { floorTexture, ceilingTexture, plateTexture, perfPanelTexture, glassBandTexture, attackScreen, inspectionCard, evacSign } from './textures.js';

export const ROOM = { w: 18, d: 11, h: 3.35, wallZ: -5.5 };

const M = {
  wall: new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.92, metalness: 0.0 }),
  wallDim: new THREE.MeshStandardMaterial({ color: 0xe3e7ea, roughness: 0.95 }),
  black: new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.7 }),
  desk: new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.45, metalness: 0.15 }),
  deskDark: new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.55, metalness: 0.3 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xb9c0c6, roughness: 0.35, metalness: 0.75 }),
  mesh: new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.85 }),
  frame: new THREE.MeshStandardMaterial({ color: 0x101215, roughness: 0.5, metalness: 0.4 }),
  door: new THREE.MeshStandardMaterial({ color: 0x333c44, roughness: 0.45, metalness: 0.45 }),
  whiteSteel: new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 0.34, metalness: 0.32 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xc4cacf, roughness: 0.28, metalness: 0.85 }),
  knob: new THREE.MeshStandardMaterial({ color: 0x1f4f9c, roughness: 0.35, metalness: 0.5 }),
  mat: new THREE.MeshStandardMaterial({ color: 0x8d2026, roughness: 0.95 }),
  perf: new THREE.MeshStandardMaterial({ map: perfPanelTexture(), roughness: 0.88, metalness: 0.12 }),
  paint: new THREE.MeshStandardMaterial({ color: 0x39424a, roughness: 0.55, metalness: 0.3 }),
  screenOff: new THREE.MeshStandardMaterial({ color: 0x0a0d10, roughness: 0.25, metalness: 0.2 }),
  light: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.4 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.45 }),
  green: new THREE.MeshStandardMaterial({ color: 0x2f8f5b, emissive: 0x2f8f5b, emissiveIntensity: 1.6 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xdcefff, roughness: 0.06, metalness: 0.0,
    transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false
  })
};

function box(w, h, d, mat, x, y, z, parent, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
}

/* ---------- 操作席网椅（可升降、带五星脚） ---------- */
function meshChair() {
  const g = new THREE.Group();
  // 五星脚：每条脚绕立柱旋转，脚末端装万向轮，保证轮子与支柱同一中心
  for (let i = 0; i < 5; i++) {
    const leg = new THREE.Group();
    leg.rotation.y = (Math.PI * 2 / 5) * i;
    g.add(leg);

    box(0.062, 0.032, 0.34, M.frame, 0, 0.082, 0.17, leg);
    box(0.045, 0.05, 0.05, M.metal, 0, 0.07, 0.325, leg, false);

    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), M.frame);
    wheel.position.set(0, 0.038, 0.335);
    wheel.scale.set(1, 1, 1.15);
    wheel.castShadow = true;
    leg.add(wheel);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.055, 14), M.frame);
  hub.position.y = 0.1; hub.castShadow = true; g.add(hub);

  const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.27, 10), M.metal);
  lift.position.y = 0.25; lift.castShadow = true; g.add(lift);

  box(0.52, 0.09, 0.5, M.mesh, 0, 0.44, 0.02, g);
  const back = box(0.48, 0.6, 0.08, M.mesh, 0, 0.82, -0.24, g);
  back.rotation.x = 0.08;
  [-1, 1].forEach(s => {
    box(0.05, 0.035, 0.4, M.frame, s * 0.29, 0.62, 0.0, g);
    box(0.04, 0.16, 0.04, M.frame, s * 0.29, 0.54, 0.12, g);
  });
  return g;
}

/* ---------- 值班人员：低多边形写实卡通（GTA 风格），关节可动 ---------- */
const skinMat = new THREE.MeshStandardMaterial({ color: 0xd8ab85, roughness: 0.72 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.9 });
const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1d21, roughness: 0.85 });
const hairMat = new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.95 });

function personHead(parent, capColor) {
  const head = new THREE.Group();
  head.position.set(0, 1.2, 0.01);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.128, 18, 14), skinMat);
  face.scale.set(1, 1.1, 1.02);
  face.position.y = 0.09;
  face.castShadow = true;
  head.add(face);

  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), skinMat);
    ear.position.set(s * 0.124, 0.09, 0);
    head.add(ear);
  });

  if (capColor) {
    const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.82 });
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.134, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
    crown.position.y = 0.14;
    head.add(crown);
    const brim = box(0.2, 0.018, 0.12, capMat, 0, 0.155, 0.1, head);
    brim.rotation.x = 0.07;
  } else {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.133, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hairMat
    );
    hair.position.y = 0.1;
    head.add(hair);
  }
  parent.add(head);
  return head;
}

function personTorso(parent, shirt, { vest = null, y = 0.86 } = {}) {
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.86 });
  box(0.42, 0.54, 0.25, shirtMat, 0, y, 0, parent);
  box(0.2, 0.14, 0.26, shirtMat, 0, y + 0.34, 0, parent);
  if (vest) {
    const v = new THREE.MeshStandardMaterial({ color: vest, roughness: 0.75, emissive: vest, emissiveIntensity: 0.12 });
    box(0.44, 0.4, 0.27, v, 0, y + 0.05, 0, parent);
    const strip = new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.5, emissive: 0x8fa8b8, emissiveIntensity: 0.25 });
    box(0.45, 0.035, 0.28, strip, 0, y + 0.17, 0, parent, false);
    box(0.45, 0.035, 0.28, strip, 0, y - 0.06, 0, parent, false);
  }
}

/* 坐姿值班工程师 */
function seatedEngineer(shirt, capColor = null, vest = null) {
  const g = new THREE.Group();
  const parts = {};

  box(0.4, 0.14, 0.36, pantsMat, 0, 0.52, 0.02, g);
  box(0.14, 0.1, 0.42, pantsMat, -0.13, 0.49, 0.2, g);
  box(0.14, 0.1, 0.42, pantsMat, 0.13, 0.49, 0.2, g);
  box(0.12, 0.42, 0.13, pantsMat, -0.13, 0.26, 0.4, g);
  box(0.12, 0.42, 0.13, pantsMat, 0.13, 0.26, 0.4, g);
  box(0.14, 0.07, 0.2, shoeMat, -0.13, 0.04, 0.42, g);
  box(0.14, 0.07, 0.2, shoeMat, 0.13, 0.04, 0.42, g);

  personTorso(g, shirt, { vest, y: 0.86 });
  parts.head = personHead(g, capColor);

  [-1, 1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.235, 1.05, 0.02);
    g.add(arm);
    box(0.085, 0.3, 0.09, new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.86 }), 0, -0.14, 0.02, arm);
    box(0.08, 0.28, 0.085, skinMat, 0, -0.38, 0.1, arm).rotation.x = -0.55;
    if (s < 0) parts.armL = arm; else parts.armR = arm;
  });

  g.userData.parts = parts;
  g.userData.kind = 'seated';
  return g;
}

/* ---------- 坐姿派大星（中间值班工程师） ---------- */
function patrickSeated() {
  const g = new THREE.Group();
  const parts = {};
  const pink = new THREE.MeshStandardMaterial({ color: 0xf5a2b4, roughness: 0.74 });
  const pinkDark = new THREE.MeshStandardMaterial({ color: 0xe98fa4, roughness: 0.78 });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x74c14d, roughness: 0.85 });
  const flower = new THREE.MeshStandardMaterial({ color: 0x7b5cb0, roughness: 0.85 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.42 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.5 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8e2230, roughness: 0.7 });
  const tooth = new THREE.MeshStandardMaterial({ color: 0xf6f2e8, roughness: 0.5 });

  // 绿短裤 + 紫花 + 双腿（坐姿）
  box(0.4, 0.16, 0.32, shorts, 0, 0.56, 0.02, g);
  [-0.1, 0.1].forEach(x => {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), flower);
    spot.position.set(x, 0.585, 0.19);
    g.add(spot);
  });
  [-1, 1].forEach(s => {
    box(0.13, 0.11, 0.36, pink, s * 0.11, 0.54, 0.16, g);
    box(0.115, 0.36, 0.12, pink, s * 0.11, 0.34, 0.32, g);
    box(0.12, 0.07, 0.18, pinkDark, s * 0.11, 0.11, 0.4, g);
  });

  // 星形身体（下宽上窄）
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), pink);
  body.position.y = 0.99;
  body.scale.set(1, 1.3, 0.84);
  body.castShadow = true;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), pinkDark);
  belly.position.set(0, 0.86, 0.16);
  belly.scale.set(0.9, 1.15, 0.55);
  g.add(belly);

  // 五官（可随 head 组轻转）
  const head = new THREE.Group();
  head.position.set(0, 1.2, 0.12);
  g.add(head);
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 12), white);
    eye.position.set(s * 0.088, 0.02, 0.232);
    head.add(eye);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), pupil);
    p.position.set(s * 0.098, 0.024, 0.286);
    head.add(p);
    box(0.085, 0.016, 0.02, pupil, s * 0.1, 0.115, 0.25, head, false).rotation.z = s * 0.18;
  });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), mouthMat);
  mouth.position.set(0, -0.15, 0.212);
  mouth.scale.set(1.12, 0.86, 0.42);
  head.add(mouth);
  box(0.11, 0.05, 0.02, tooth, 0, -0.095, 0.286, head, false);
  parts.head = head;

  // 两条手臂撑在键盘上
  [-1, 1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.3, 1.08, 0.04);
    g.add(arm);
    box(0.1, 0.26, 0.1, pink, 0, -0.13, 0.02, arm);
    box(0.09, 0.26, 0.09, pink, 0, -0.33, 0.15, arm).rotation.x = -0.6;
    box(0.1, 0.07, 0.1, pinkDark, 0, -0.44, 0.27, arm);
    if (s < 0) parts.armL = arm; else parts.armR = arm;
  });

  g.userData.parts = parts;
  g.userData.kind = 'seated';
  g.userData.patrick = true;
  return g;
}

/* ---------- 特级保镖猫：黑西装 + 领带 + 警棍，爬行 / 站立 / 直立行走循环 ---------- */
function catWorker() {
  const g = new THREE.Group();
  const parts = {};
  const fur = new THREE.MeshStandardMaterial({ color: 0xe0a052, roughness: 0.9 });
  const furLight = new THREE.MeshStandardMaterial({ color: 0xf3e3cd, roughness: 0.92 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xe08a92, roughness: 0.7 });
  const suit = new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.62, metalness: 0.12 });
  const suitHi = new THREE.MeshStandardMaterial({ color: 0x252d36, roughness: 0.5, metalness: 0.2 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.5 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0x8e1b26, roughness: 0.45 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: 0.22, metalness: 0.65 });
  const batonMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.35, metalness: 0.72 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xc9d2da, roughness: 0.25, metalness: 0.9 });

  // 髋部：双腿、躯干、尾巴都挂在这里，整体升降即可切换爬行 / 直立
  const hips = new THREE.Group();
  hips.position.y = 0.44;
  g.add(hips);
  parts.hips = hips;

  // 双腿（深色西裤 + 皮鞋）
  [-1, 1].forEach(s => {
    const leg = new THREE.Group();
    leg.position.set(s * 0.085, 0, 0);
    hips.add(leg);
    box(0.095, 0.23, 0.105, suit, 0, -0.115, 0, leg);
    box(0.085, 0.2, 0.095, fur, 0, -0.33, 0.005, leg);
    box(0.11, 0.06, 0.17, suitHi, 0, -0.41, 0.035, leg);
    if (s < 0) parts.legL = leg; else parts.legR = leg;
  });

  // 躯干：西装外套 + 白衬衫 + 领带
  const torso = new THREE.Group();
  torso.position.y = 0.02;
  hips.add(torso);
  parts.torso = torso;
  box(0.34, 0.38, 0.22, suit, 0, 0.19, 0, torso);
  box(0.12, 0.3, 0.02, shirt, 0, 0.21, 0.113, torso, false);
  [-1, 1].forEach(s => {
    const lapel = box(0.12, 0.18, 0.014, suitHi, s * 0.072, 0.31, 0.122, torso, false);
    lapel.rotation.z = s * 0.22;
  });
  box(0.055, 0.05, 0.024, tieMat, 0, 0.365, 0.132, torso, false);
  box(0.06, 0.22, 0.02, tieMat, 0, 0.245, 0.134, torso, false);
  box(0.066, 0.018, 0.026, steel, 0, 0.29, 0.14, torso, false);
  // 肩线
  box(0.4, 0.07, 0.24, suit, 0, 0.365, 0, torso);

  // 双臂（西装袖 + 猫爪）
  [-1, 1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.205, 0.33, 0);
    torso.add(arm);
    box(0.09, 0.26, 0.1, suit, 0, -0.13, 0, arm);
    box(0.075, 0.2, 0.085, fur, 0, -0.345, 0.01, arm);
    box(0.09, 0.075, 0.095, furLight, 0, -0.455, 0.02, arm);
    if (s < 0) parts.armL = arm; else parts.armR = arm;
  });

  // 右手警棍：握在爪中，向前下方斜持
  const baton = new THREE.Group();
  baton.position.set(0, -0.46, 0.04);
  baton.rotation.x = 1.15;
  baton.rotation.z = -0.1;
  parts.armR.add(baton);
  baton.add(new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.017, 0.12, 8), batonMat));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.26, 8), batonMat);
  rod.position.y = 0.17;
  baton.add(rod);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), steel);
  tip.position.y = 0.3;
  baton.add(tip);
  parts.baton = baton;

  // 头：墨镜 + 耳麦
  const head = new THREE.Group();
  head.position.set(0, 0.44, 0.01);
  torso.add(head);
  parts.head = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.148, 20, 16), fur);
  skull.scale.set(1, 0.94, 0.96);
  skull.castShadow = true;
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 10), furLight);
  muzzle.position.set(0, -0.035, 0.113);
  muzzle.scale.set(1.15, 0.8, 0.7);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), noseMat);
  nose.position.set(0, 0.002, 0.182);
  head.add(nose);
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 6), fur);
    ear.position.set(s * 0.098, 0.135, -0.005);
    ear.rotation.z = -s * 0.22;
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 6), noseMat);
    inner.position.set(s * 0.098, 0.128, 0.02);
    inner.rotation.z = -s * 0.22;
    head.add(inner);
    [0.02, -0.012].forEach((y, i) => {
      const w = box(0.09, 0.006, 0.006, furLight, s * 0.1, -0.005 + y, 0.15, head, false);
      w.rotation.z = s * (i ? -0.16 : 0.1);
    });
  });
  // 一体式黑色墨镜
  box(0.225, 0.052, 0.02, glass, 0, 0.048, 0.132, head, false);
  // 耳麦与线
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8), glass);
  mic.position.set(0.143, 0.045, 0);
  mic.rotation.z = Math.PI / 2;
  head.add(mic);
  box(0.012, 0.2, 0.012, glass, 0.14, -0.07, 0.02, head, false);

  // 尾巴（挂髋部，行走时上翘摆动）
  const tail = new THREE.Group();
  tail.position.set(0, 0.02, -0.11);
  hips.add(tail);
  parts.tail = tail;
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.2, 8), fur);
  t1.position.set(0, 0.1, -0.08); t1.rotation.x = -0.7;
  tail.add(t1);
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.18, 8), fur);
  t2.position.set(0, 0.24, -0.15); t2.rotation.x = -0.35;
  tail.add(t2);
  const t3 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), furLight);
  t3.position.set(0, 0.33, -0.17);
  tail.add(t3);

  g.userData.parts = parts;
  g.userData.kind = 'cat';
  // 姿态缓存：main.js 每帧向爬行 / 直立目标插值
  g.userData.pose = { hip: 0.44, torso: 0, head: 0, arm: 0, leg: 0, scale: 1 };
  g.userData.cat = { state: 'crawl', timer: 3.4 };
  g.userData.wander = {
    target: new THREE.Vector3(-3.6, 0, 4.2),
    points: [[-7.0, 3.3], [-3.6, 4.2], [0.4, 4.25], [3.6, 4.0], [5.9, 3.0],
      [6.4, 1.0], [4.6, -0.3], [1.0, -1.0], [-1.6, 1.2], [-4.6, 1.9],
      [-6.8, -0.3], [-7.4, 1.8]]
  };
  return g;
}

/* 圣诞树（机房门口，约 1.7m，矮一点不挡视线，带小彩灯） */
function christmasTree(group, x, z) {
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.16, 0.3, 14),
    new THREE.MeshStandardMaterial({ color: 0x9a6a45, roughness: 0.85 })
  );
  pot.position.set(x, 0.15, z);
  pot.castShadow = true;
  group.add(pot);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.4, 10), M.frame);
  trunk.position.set(x, 0.44, z);
  group.add(trunk);

  const needle = new THREE.MeshStandardMaterial({ color: 0x1f5c3a, roughness: 0.9 });
  [[0.38, 0.55, 0.62], [0.3, 0.5, 0.98], [0.21, 0.42, 1.3]].forEach(([r, h, y]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), needle);
    cone.position.set(x, y + h / 2, z);
    cone.castShadow = true;
    group.add(cone);
  });

  const bulbs = [0xffcf5a, 0xff6b6b, 0x5ad1ff, 0x8affa0];
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 / 12) * i;
    const y = 0.66 + (i % 4) * 0.19;
    const r = 0.33 - (y - 0.62) * 0.3;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.027, 8, 6),
      new THREE.MeshStandardMaterial({
        color: bulbs[i % 4], emissive: bulbs[i % 4], emissiveIntensity: 1.2, roughness: 0.4
      })
    );
    m.position.set(x + Math.cos(a) * r, y, z + Math.sin(a) * r);
    group.add(m);
  }

  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.08),
    new THREE.MeshStandardMaterial({ color: 0xffd86b, emissive: 0xffcf4a, emissiveIntensity: 1.5, roughness: 0.35 })
  );
  star.position.set(x, 1.7, z);
  group.add(star);
}

/* ---------- 防暴器材架：防暴叉 / 盾牌 / 警棍 / 防弹衣（左墙后侧整齐挂放） ---------- */
function riotGear(group, x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  group.add(g);

  const board = new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.92 });
  const strap = new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.88 });
  const shell = new THREE.MeshPhysicalMaterial({
    color: 0xb6e2ff, roughness: 0.12, metalness: 0.05,
    transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false
  });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x1b2a38, roughness: 0.82 });
  const vestPlate = new THREE.MeshStandardMaterial({ color: 0x2f465c, roughness: 0.7, metalness: 0.15 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.5, metalness: 0.25 });

  // 背板 + 上下钢框
  box(0.06, 2.0, 2.6, board, 0.03, 1.3, 0, g, false);
  box(0.08, 0.05, 2.66, M.steel, 0.05, 2.32, 0, g, false);
  box(0.08, 0.05, 2.66, M.steel, 0.05, 0.28, 0, g, false);
  box(0.1, 0.06, 2.4, M.steel, 0.07, 0.31, 0, g, false);

  // 盾牌 ×2：透明盾面 + 金属包边 + 内侧握把
  [-1.02, -0.66].forEach(oz => {
    const sh = box(0.05, 0.86, 0.32, shell, 0.14, 1.42, oz, g, false);
    sh.material = shell;
    box(0.07, 0.05, 0.34, M.steel, 0.15, 1.85, oz, g, false);
    box(0.07, 0.05, 0.34, M.steel, 0.15, 0.99, oz, g, false);
    box(0.05, 0.26, 0.04, strap, 0.09, 1.42, oz, g, false);
    box(0.02, 0.16, 0.16, M.frame, 0.2, 1.42, oz, g, false);
  });

  // 防暴叉：长杆 + U 形叉头
  const fork = cyl(0.024, 0.024, 1.9, M.steel, 0.2, 1.12, -0.26, g, 8);
  box(0.05, 0.05, 0.34, M.frame, 0.2, 2.08, -0.26, g, false);
  [-1, 1].forEach(s => {
    const prong = cyl(0.018, 0.018, 0.3, M.frame, 0.2, 2.22, -0.26 + s * 0.17, g, 8);
    prong.rotation.x = s * 0.22;
  });
  box(0.06, 0.16, 0.06, M.frame, 0.2, 0.24, -0.26, g, false);

  // 防弹衣 ×2：前片 + 侧围 + 反光条
  [0.28, 0.78].forEach(oz => {
    box(0.12, 0.58, 0.42, vestMat, 0.14, 1.45, oz, g, false);
    box(0.03, 0.24, 0.3, vestPlate, 0.21, 1.5, oz, g, false);
    box(0.13, 0.04, 0.44, strap, 0.14, 1.24, oz, g, false);
    box(0.13, 0.04, 0.44, strap, 0.14, 1.66, oz, g, false);
  });

  // 警棍 ×3（横向卡箍）+ 头盔 ×2（下层踏板）
  [0.86, 1.05, 1.24].forEach(y => {
    const baton = cyl(0.017, 0.017, 0.62, M.black, 0.18, y, 1.0, g, 8);
    baton.rotation.x = Math.PI / 2;
    [-0.2, 0.2].forEach(oz => box(0.06, 0.05, 0.03, M.steel, 0.16, y, 1.0 - oz, g, false));
  });
  [0.28, 0.78].forEach(oz => {
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), helmetMat
    );
    h.position.set(0.18, 0.46, oz);
    g.add(h);
    box(0.03, 0.1, 0.14, shell, 0.3, 0.46, oz, g, false);
  });

  // 顶部标识牌（朝 +x，即朝大厅内侧）
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.24),
    new THREE.MeshBasicMaterial({ map: plateTexture('防暴器材 · RIOT GEAR', '#3fd0ff'), transparent: true })
  );
  plate.rotation.y = Math.PI / 2;
  plate.position.set(0.1, 2.5, 0);
  g.add(plate);
  return g;
}

/* ---------- 大屏下方设备地台 ---------- */
function screenPlinth(group) {
  const z = -4.78, w = 12.9, h = 0.6;
  box(w, h - 0.05, 0.62, M.deskDark, 0, (h - 0.05) / 2, z, group);
  box(w + 0.06, 0.05, 0.7, M.desk, 0, h - 0.025, z, group);
  box(w - 0.2, 0.06, 0.02, M.black, 0, 0.05, z + 0.32, group, false);
}

/* ---------- 桌面横屏显示器 ---------- */
function monitor(parent, x, z, w, h, index) {
  const deskTop = 0.775;
  const g = new THREE.Group();
  g.position.set(x, deskTop + 0.13 + h / 2, z);
  g.rotation.x = -0.06;

  box(w, h, 0.045, M.frame, 0, 0, 0, g);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.05, h - 0.05),
    new THREE.MeshBasicMaterial({ color: 0x0d1a26 })
  );
  face.position.z = 0.024;
  face.userData.monitorIndex = index;
  g.add(face);

  box(0.05, 0.14, 0.05, M.metal, 0, -h / 2 - 0.07, -0.01, g);
  box(0.24, 0.02, 0.15, M.metal, 0, -h / 2 - 0.135, 0, g);
  parent.add(g);
}

/* ---------- 指挥控制台（每台 3 席） ---------- */
function consoleDesk(group, cx, { label, monitors = 3, engineers = false, people = [] }) {
  const cz = -2.35, w = 4.4, d = 0.95, h = 0.74;
  const seats = [-1.32, 0, 1.32];

  box(w, 0.07, d, M.desk, cx, h, cz, group);
  box(w - 0.18, 0.44, 0.04, M.deskDark, cx, h - 0.27, cz + d / 2 - 0.03, group);
  box(w - 0.18, 0.08, 0.04, M.deskDark, cx, h + 0.05, cz - d / 2 + 0.03, group);
  [-2.0, 0, 2.0].forEach(off => box(0.12, h, 0.66, M.deskDark, cx + off, h / 2, cz, group));

  // 桌前线槽
  box(w - 0.3, 0.05, 0.06, M.black, cx, h - 0.03, cz + d / 2 - 0.02, group, false);

  // 席位牌：置于台面左上角，前缘抬高加大倾角；不设 roll，左右保持水平
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.15),
    new THREE.MeshBasicMaterial({
      map: plateTexture(label, engineers ? '#ffb547' : '#3fd0ff'),
      transparent: true
    })
  );
  plate.rotation.x = -Math.PI / 2 + 0.34;
  plate.position.set(cx - 1.85, h + 0.072, cz - 0.12);
  // 只有主控台席位牌是“岗位职责”入口
  if (engineers) {
    plate.userData.info = { key: 'duty', title: '主控台 · 在岗值班与岗位职责' };
    plate.userData.pickPriority = 2;
  }
  group.add(plate);

  // 处置状态灯带：操作值守台时整条亮起，2.8s 后回落
  if (engineers) {
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0x0d1519, emissive: 0x2f9fc9, emissiveIntensity: 0.5, roughness: 0.35
    });
    box(w - 0.7, 0.028, 0.045, lampMat, cx, h + 0.049, cz + d / 2 + 0.02, group, false);
    group.userData.mainLamp = lampMat;
  }

  // 三席：键盘 + 网椅
  seats.forEach(off => {
    box(0.42, 0.02, 0.15, M.black, cx + off, h + 0.045, cz + 0.26, group);
    const c = meshChair();
    c.position.set(cx + off, 0, -1.42);
    c.rotation.y = Math.PI;
    group.add(c);
  });

  // 显示器：主控台 4 块横屏，其余 3 块
  if (monitors === 4) {
    [-1.6, -0.53, 0.53, 1.6].forEach((off, i) => monitor(group, cx + off, cz - 0.28, 0.8, 0.46, 6 + i));
  } else {
    const base = cx < 0 ? 0 : 3;
    seats.forEach((off, i) => monitor(group, cx + off, cz - 0.3, 0.62, 0.36, base + i));
  }

  // 主控台：3 名值班工程师（处理故障 / 渗透测试 / 网络配置）
  if (engineers) {
    const crew = [
      [0x3d6d96, 0x1c2b3a, null],
      [0x8a5a3c, null, 0xd8c02a],
      [0x4a6072, 0x24282d, null]
    ];
    crew.forEach(([shirt, cap, vest], i) => {
      const p = i === 1 ? patrickSeated() : seatedEngineer(shirt, cap, vest);
      p.position.set(cx + seats[i], 0, -1.5);
      p.rotation.y = Math.PI;
      p.userData.seat = { x: cx + seats[i], z: -1.5 };
      group.add(p);
      people.push(p);
    });
    // 台面固定电话：由最右侧（第三位）值班工程师负责接听
    group.userData.phone = deskPhone(group, cx + 1.95, cz + 0.23, people[people.length - 1]);
  }
}

/* ---------- 台面固定电话：来电 / 接听时第三位工程师拿起话筒贴耳，挂断放回 ---------- */
function deskPhone(group, x, z, operator) {
  const root = new THREE.Group();
  root.position.set(x, 0.775, z);
  group.add(root);

  const shell = new THREE.MeshStandardMaterial({ color: 0x191d21, roughness: 0.58, metalness: 0.14 });
  const shell2 = new THREE.MeshStandardMaterial({ color: 0x2b3238, roughness: 0.5, metalness: 0.18 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0e1114, roughness: 0.9 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xc9d2d8, roughness: 0.55 });

  // 话机底座 + 前低后高的操作面板
  box(0.24, 0.042, 0.19, shell, 0, 0.021, 0, root);
  box(0.205, 0.03, 0.135, shell2, 0, 0.052, 0.008, root).rotation.x = -0.14;

  // 3×3 拨号键 + 免提键
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      box(0.03, 0.009, 0.022, keyMat, (c - 1) * 0.048, 0.066, 0.028 + (r - 1) * 0.03, root, false).rotation.x = -0.14;
    }
  }
  box(0.09, 0.009, 0.02, keyMat, 0, 0.066, 0.074, root, false).rotation.x = -0.14;

  // 通话指示灯
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0c1410, emissive: 0x2a6f47, emissiveIntensity: 0.3, roughness: 0.4
  });
  box(0.024, 0.01, 0.012, ledMat, -0.088, 0.069, 0.062, root, false);

  // 叉簧托架
  [-0.098, 0.098].forEach(ox => box(0.026, 0.03, 0.048, shell, ox, 0.057, 0, root, false));

  // 听筒：挂机平放 → 拿起竖贴在耳边
  const handset = new THREE.Group();
  handset.position.set(0, 0.098, 0);
  root.add(handset);
  box(0.2, 0.03, 0.045, shell2, 0, 0, 0, handset);
  [-0.088, 0.088].forEach(ox => {
    box(0.042, 0.044, 0.052, shell, ox, 0.006, 0, handset);
    box(0.034, 0.006, 0.03, rubber, ox, -0.02, 0, handset, false);
  });

  const seat = operator?.userData?.seat || { x, z };
  const restPos = new THREE.Vector3(0, 0.098, 0);
  const earPos = new THREE.Vector3(seat.x + 0.155 - x, 1.3 - 0.775, seat.z - z);
  const restQuat = new THREE.Quaternion();
  const earQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));

  return {
    call: { on: false, p: 0 },
    root,
    handset,
    update(t, dt) {
      const c = this.call;
      const rate = c.on ? 2.4 : 1.9;
      c.p = THREE.MathUtils.clamp(c.p + (c.on ? 1 : -1) * dt * rate, 0, 1);
      const p = c.p;
      const e = p * p * (3 - 2 * p);

      handset.position.lerpVectors(restPos, earPos, e);
      handset.position.y += Math.sin(Math.PI * e) * 0.05;
      handset.quaternion.slerpQuaternions(restQuat, earQuat, e);

      ledMat.emissive.setHex(e > 0.02 ? 0x35e07a : 0x2a6f47);
      ledMat.emissiveIntensity = 0.3 + 2.4 * e;

      // 第三位工程师左臂抬起扶话筒，通话期间保持贴耳
      const arm = operator?.userData?.parts?.armL;
      if (arm) {
        arm.rotation.z = Math.PI * e;
        arm.scale.y = 1 - 0.42 * e;
        arm.rotation.y = 0.18 * e;
        arm.rotation.x = arm.rotation.x * (1 - e) - 0.25 * e;
      }
    }
  };
}

/* ---------- 前墙左侧：机房门（门套 + 双开感应门，取消门禁） ---------- */
function machineDoor(group) {
  const cx = -7.6, zFace = ROOM.wallZ + 0.02, zDoor = ROOM.wallZ - 0.05;

  // 穿孔板只围绕门洞收边，不再整片遮挡
  box(0.22, 3.02, 0.07, M.perf, -8.78, 1.52, zFace, group, false);
  box(0.44, 3.02, 0.07, M.perf, -6.32, 1.52, zFace, group, false);
  box(2.24, 0.76, 0.07, M.perf, cx, 2.94, zFace, group, false);

  // 门洞内基层（开门后能看出墙体厚度）
  box(2.08, 2.4, 0.02, M.mesh, cx, 1.2, ROOM.wallZ - 0.165, group, false);

  // 白色门套：侧框 + 上框 + 门槛
  box(0.12, 2.46, 0.2, M.whiteSteel, -8.66, 1.23, zDoor, group);
  box(0.12, 2.46, 0.2, M.whiteSteel, -6.54, 1.23, zDoor, group);
  box(2.26, 0.12, 0.2, M.whiteSteel, cx, 2.48, zDoor, group);
  box(2.12, 0.025, 0.22, M.steel, cx, 0.012, zDoor, group, false);

  // 双开门扇：铰链在门洞两侧，向健身房内开启
  const leafW = 1.03, leafH = 2.36;
  const leaves = [];
  [-1, 1].forEach(s => {
    const hinge = new THREE.Group();
    hinge.position.set(cx + s * 1.05, 0, zDoor);
    group.add(hinge);
    box(leafW, leafH, 0.05, M.whiteSteel, -s * leafW / 2, leafH / 2, 0, hinge);
    box(leafW - 0.06, 0.03, 0.06, M.deskDark, -s * leafW / 2, 0.06, 0.02, hinge, false);
    box(leafW - 0.06, 0.03, 0.06, M.deskDark, -s * leafW / 2, leafH - 0.06, 0.02, hinge, false);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12), M.knob);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-s * (leafW - 0.12), 1.05, 0.06);
    handle.castShadow = true;
    hinge.add(handle);
    leaves.push(hinge);
  });

  // 顶部闭门器
  box(0.34, 0.05, 0.08, M.metal, cx + 0.72, 2.42, zDoor + 0.06, group, false);

  // 门顶自动感应器：人走近就开，不再刷卡
  box(0.3, 0.08, 0.1, M.black, cx, 2.56, zDoor + 0.07, group, false);
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x37d67a, emissive: 0x1f9d55, emissiveIntensity: 1.4, roughness: 0.4
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), ledMat);
  led.position.set(cx + 0.1, 2.56, zDoor + 0.13);
  group.add(led);

  // 门状态：靠近自动开，离开自动合
  const door = {
    open: 0,
    target: 0,
    toggle() { this.target = this.target > 0.5 ? 0 : 1; },
    update(dt, camPos) {
      if (camPos) {
        const near = Math.abs(camPos.x - cx) < 2.7 &&
          camPos.z > ROOM.wallZ - 4.4 && camPos.z < ROOM.wallZ + 3.4;
        this.target = near ? 1 : 0;
      }
      this.open += (this.target - this.open) * Math.min(1, dt * 3.2);
      leaves[0].rotation.y = 1.18 * this.open;
      leaves[1].rotation.y = -1.18 * this.open;
      ledMat.emissiveIntensity = this.open > 0.5 ? 1.9 : 0.7;
    }
  };
  group.userData.door = door;
}

/* ---------- 健身房：外壳（橡胶地垫 / 镜面墙 / 轨道灯 / 送风管） ---------- */
const GYM = { x0: -8.91, x1: 8.0, z0: -26.0, z1: -5.68, h: 6.0 };

function cyl(rt, rb, h, mat, x, y, z, parent, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

function rubberTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#5b6167'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    x.fillStyle = `rgba(255,255,255,${Math.random() * 0.09})`;
    x.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 3;
  x.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(11, 13);
  return t;
}

/* ---------- 健身房外壳：旗舰店尺度 / 落地玻璃海景 / 白天自然光 ---------- */
function gymShell(group) {
  const g = new THREE.Group();
  group.add(g);
  const w = GYM.x1 - GYM.x0, d = GYM.z1 - GYM.z0;
  const cx = (GYM.x0 + GYM.x1) / 2, cz = (GYM.z0 + GYM.z1) / 2;

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.95 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0xecebe6, roughness: 0.96 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0xc7cbce, roughness: 0.62, metalness: 0.35 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a5, roughness: 0.7, metalness: 0.3 });
  const mirror = new THREE.MeshStandardMaterial({ color: 0xb8cbd6, roughness: 0.08, metalness: 0.72 });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ map: rubberTexture(), roughness: 0.96 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0.002, cz);
  floor.receiveShadow = true;
  g.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, GYM.h, cz);
  g.add(ceil);

  // 左墙：整面镜子 + 上部白墙，镜面分缝
  const mirrorWall = new THREE.Mesh(new THREE.PlaneGeometry(d - 0.2, 3.2), mirror);
  mirrorWall.rotation.y = Math.PI / 2;
  mirrorWall.position.set(GYM.x0 + 0.012, 1.6, cz);
  g.add(mirrorWall);
  box(0.16, GYM.h - 3.2, d, wallMat, GYM.x0 - 0.07, (GYM.h + 3.2) / 2, cz, g, false);
  box(0.06, 0.08, d, M.steel, GYM.x0 + 0.03, 3.22, cz, g, false);
  box(0.06, 0.06, d, M.steel, GYM.x0 + 0.03, 0.08, cz, g, false);
  for (let i = 0; i <= 6; i++) {
    box(0.05, 3.2, 0.035, M.steel, GYM.x0 + 0.03, 1.6, GYM.z0 + 0.7 + i * ((d - 1.4) / 6), g, false);
  }

  // 右墙：白墙 + 电竞区灯带 + 品牌灯箱
  box(0.16, GYM.h, d, wallMat, GYM.x1, GYM.h / 2, cz, g, false);
  const rgbStripMat = new THREE.MeshStandardMaterial({
    color: 0x1b0f2a, emissive: 0xff4d9e, emissiveIntensity: 1.7, roughness: 0.4
  });
  box(0.05, 0.06, 7.8, rgbStripMat, GYM.x1 - 0.09, 3.28, -11.6, g, false);
  box(0.05, 0.05, d - 3.4, rgbStripMat, GYM.x1 - 0.09, 0.09, cz, g, false);

  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.4),
    new THREE.MeshBasicMaterial({ map: plateTexture('FITNESS CLUB · 24H', '#ff9a4d'), transparent: true })
  );
  brand.rotation.y = -Math.PI / 2;
  brand.position.set(GYM.x1 - 0.1, 4.35, -17.6);
  g.add(brand);

  // 远墙：整面落地玻璃幕墙（正对海边）
  const glassH = 5.5;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, glassH), M.glass);
  glass.position.set(cx, glassH / 2 + 0.08, GYM.z0 + 0.02);
  g.add(glass);
  for (let i = 0; i <= 8; i++) {
    const x = GYM.x0 + 0.15 + i * ((w - 0.3) / 8);
    box(0.075, glassH, 0.12, M.frame, x, glassH / 2 + 0.08, GYM.z0 + 0.04, g, false);
  }
  box(w - 0.1, 0.12, 0.14, M.frame, cx, 0.08, GYM.z0 + 0.04, g, false);
  box(w - 0.1, 0.14, 0.14, M.frame, cx, glassH + 0.1, GYM.z0 + 0.04, g, false);
  box(w - 0.3, 0.08, 0.12, M.frame, cx, 3.0, GYM.z0 + 0.05, g, false);
  box(w, GYM.h - glassH - 0.1, 0.16, wallMat, cx, (GYM.h + glassH + 0.1) / 2, GYM.z0, g, false);

  // 入口侧墙：保留 2.1m 门洞，其余白墙到 6m
  box(0.26, GYM.h, 0.05, wallMat, -8.78, GYM.h / 2, GYM.z1 - 0.02, g, false);
  box(GYM.x1 + 6.52, GYM.h, 0.05, wallMat, (GYM.x1 - 6.52) / 2, GYM.h / 2, GYM.z1 - 0.02, g, false);
  box(2.1, GYM.h - 2.42, 0.05, wallMat, -7.6, (GYM.h + 2.42) / 2, GYM.z1 - 0.02, g, false);

  // 顶面：裸露钢梁 + 送风管 + 轨道灯
  for (let i = 0; i < 7; i++) {
    box(w - 0.24, 0.26, 0.18, beamMat, cx, GYM.h - 0.18, GYM.z0 + 1.4 + i * ((d - 2.8) / 6), g, false);
  }
  [-4.6, 4.4].forEach(x => {
    const duct = cyl(0.3, 0.3, d - 1.4, deckMat, x, GYM.h - 0.95, cz, g, 14);
    duct.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const grate = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 14), M.frame);
      grate.position.set(x, GYM.h - 0.95, GYM.z0 + 2.6 + i * ((d - 4.4) / 4));
      grate.rotation.x = Math.PI / 2;
      g.add(grate);
    }
  });
  [GYM.x0 + 2.3, -1.7, GYM.x1 - 2.3].forEach(x => {
    box(0.09, 0.06, d - 2.4, M.frame, x, GYM.h - 1.12, cz, g, false);
    for (let k = 0; k < 6; k++) {
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.16, 12), M.light);
      head.position.set(x, GYM.h - 1.26, GYM.z0 + 2.2 + k * ((d - 4.4) / 5));
      g.add(head);
    }
  });

  // 白天自然光：阳光从海面方向斜射 + 顶部补光
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.0);
  sun.position.set(-8, 11, GYM.z0 - 10);
  sun.target.position.set(1, 0.4, -14);
  g.add(sun);
  g.add(sun.target);
  const fills = [
    [0xffffff, 44, -3.2, 5.0, -10.5],
    [0xfff4e2, 44, 2.6, 5.0, -18.5],
    [0xdfeaff, 28, -3.0, 4.4, -24.0]
  ];
  fills.forEach(([color, power, x, y, z]) => {
    const l = new THREE.PointLight(color, power, 34, 2);
    l.position.set(x, y, z);
    g.add(l);
  });

  // 地面阳光光斑
  const patchMat = new THREE.MeshBasicMaterial({
    color: 0xfff0cc, transparent: true, opacity: 0.17, depthWrite: false, blending: THREE.AdditiveBlending
  });
  [[-4.8, -20.6, 3.4, 1.9], [-0.2, -22.6, 3.0, 1.7], [3.8, -19.2, 2.6, 1.5], [-6.6, -17.2, 2.2, 1.2]]
    .forEach(([x, z, rx, rz]) => {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 24), patchMat);
      patch.rotation.x = -Math.PI / 2;
      patch.scale.set(rx, rz, 1);
      patch.position.set(x, 0.006, z);
      g.add(patch);
    });

  return g;
}

/* ---------- 健身房电竞位：电竞桌 / 高背椅 / 主机 / 屏幕 ---------- */
function gymStation(group, z, rgbMat, screenMats) {
  const g = new THREE.Group();
  g.position.set(0, 0, z);
  group.add(g);

  box(0.66, 0.05, 1.2, M.black, 2.14, 0.74, 0, g);
  box(0.05, 0.72, 1.14, M.frame, 2.45, 0.36, 0, g, false);
  [-0.56, 0.56].forEach(oz => box(0.5, 0.7, 0.05, M.frame, 2.16, 0.35, oz, g, false));
  box(0.6, 0.02, 1.12, rgbMat, 2.15, 0.7, 0, g, false);

  box(0.05, 0.42, 0.72, M.frame, 2.4, 1.42, 0, g, false);
  const scr = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x0b1016, emissive: 0x1c5f8a, emissiveIntensity: 1.1 })
  );
  scr.rotation.y = -Math.PI / 2;
  scr.position.set(2.37, 1.42, 0);
  g.add(scr);
  screenMats.push(scr.material);
  box(0.2, 0.03, 0.18, M.frame, 2.32, 1.2, 0, g, false);
  box(0.04, 0.22, 0.06, M.metal, 2.4, 1.08, 0, g, false);

  box(0.3, 0.015, 0.5, M.frame, 2.02, 0.77, 0.02, g, false);
  box(0.07, 0.03, 0.11, M.black, 2.0, 0.78, 0.32, g, false);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), M.black);
  cup.rotation.z = Math.PI / 2;
  cup.position.set(2.4, 1.66, -0.44);
  g.add(cup);

  box(0.24, 0.46, 0.2, M.black, 2.34, 0.23, 0.42, g);
  box(0.02, 0.4, 0.15, rgbMat, 2.21, 0.24, 0.42, g, false);
  box(0.24, 0.02, 0.2, M.metal, 2.34, 0.47, 0.42, g, false);

  const chair = meshChair();
  chair.position.set(1.6, 0, 0);
  chair.rotation.y = Math.PI / 2;
  g.add(chair);
  const head = box(0.44, 0.3, 0.09, M.black, 0, 1.2, -0.27, chair, false);
  head.rotation.x = 0.05;
  box(0.3, 0.08, 0.1, rgbMat, 0, 1.36, -0.28, chair, false);

  box(0.2, 0.05, 0.9, M.frame, 2.3, 0.42, 0, g, false);
  return g;
}

/* ---------- 自由力量：深蹲架 / 卧推凳 ---------- */
function gymSquatRack(group) {
  const g = new THREE.Group();
  g.position.set(-4.5, 0, -12.4);
  group.add(g);
  [-0.62, 0.62].forEach(x => {
    [-0.58, 0.58].forEach(z => box(0.07, 2.3, 0.07, M.steel, x, 1.15, z, g, false));
    box(0.07, 0.07, 1.24, M.steel, x, 2.28, 0, g, false);
    box(0.07, 0.06, 1.1, M.steel, x, 0.56, 0, g, false);
    box(0.12, 0.1, 0.14, M.frame, x, 1.32, 0.46, g, false);
  });
  box(1.32, 0.07, 0.07, M.steel, 0, 2.28, 0, g, false);
  const bar = cyl(0.022, 0.022, 2.0, M.steel, 0, 1.38, 0.5, g, 10);
  bar.rotation.z = Math.PI / 2;
  [-0.86, 0.86].forEach(x => {
    const p = cyl(0.17, 0.17, 0.06, M.frame, x, 1.38, 0.5, g, 18);
    p.rotation.z = Math.PI / 2;
  });
  return g;
}

function gymBench(group) {
  const g = new THREE.Group();
  g.position.set(-2.85, 0, -11.1);
  g.rotation.y = 0.16;
  group.add(g);
  [-0.32, 0.32].forEach(x => box(0.08, 0.5, 0.1, M.frame, x, 0.25, 0.34, g, false));
  box(0.54, 0.09, 1.15, M.mat, 0, 0.52, 0, g);
  box(0.5, 0.03, 0.28, M.frame, 0, 0.47, -0.62, g, false);
  [-1, 1].forEach(s => {
    box(0.08, 1.15, 0.08, M.steel, s * 0.5, 0.58, -0.5, g, false);
    box(0.1, 0.08, 0.3, M.frame, s * 0.4, 1.1, -0.5, g, false);
  });
  const bar = cyl(0.022, 0.022, 1.9, M.steel, 0, 1.16, -0.5, g, 10);
  bar.rotation.z = Math.PI / 2;
  [-0.78, 0.78].forEach(x => {
    const p = cyl(0.16, 0.16, 0.06, M.frame, x, 1.16, -0.5, g, 16);
    p.rotation.z = Math.PI / 2;
  });
  return g;
}

/* ---------- 自由力量：哑铃架 / 杠铃片树 / 龙门架 / 史密斯机 ---------- */
function gymDumbbellRack(group) {
  const g = new THREE.Group();
  g.position.set(-6.9, 0, -13.08);
  group.add(g);
  [0.34, 0.62, 0.9].forEach(baseY => {
    box(1.7, 0.04, 0.32, M.frame, 0, baseY, 0, g, false);
    for (let k = 0; k < 7; k++) {
      const x = -0.66 + k * 0.22;
      const r = 0.05 + k * 0.003;
      [-0.04, 0.04].forEach(z => {
        const p = cyl(r, r, 0.05, M.black, x, baseY + 0.07, z, g, 12);
        p.rotation.x = Math.PI / 2;
      });
      const h = cyl(0.016, 0.016, 0.1, M.steel, x, baseY + 0.07, 0, g, 8);
      h.rotation.x = Math.PI / 2;
    }
  });
  [-0.85, 0.85].forEach(x => box(0.06, 0.98, 0.42, M.steel, x, 0.49, 0, g, false));
  return g;
}

function gymPlateTree(group) {
  const g = new THREE.Group();
  g.position.set(-8.32, 0, -12.55);
  group.add(g);
  cyl(0.05, 0.07, 1.4, M.steel, 0, 0.7, 0, g, 10);
  box(0.66, 0.06, 0.66, M.frame, 0, 0.05, 0, g, false);
  [[0.45, 0], [0.45, Math.PI / 2], [0.98, 0], [0.98, Math.PI / 2]].forEach(([y, rot]) => {
    const peg = new THREE.Group();
    peg.position.y = y;
    peg.rotation.y = rot;
    g.add(peg);
    const rod = cyl(0.024, 0.024, 0.4, M.steel, 0, 0, 0.2, peg, 8);
    rod.rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) {
      const p = cyl(0.19 - k * 0.03, 0.19 - k * 0.03, 0.05, M.frame, 0, 0, 0.09 + k * 0.11, peg, 16);
      p.rotation.x = Math.PI / 2;
    }
  });
  return g;
}

function gymCable(group) {
  const g = new THREE.Group();
  g.position.set(-1.0, 0, -12.85);
  group.add(g);
  [-1, 1].forEach(s => {
    box(0.14, 2.4, 0.3, M.frame, s * 1.0, 1.2, 0, g);
    box(0.22, 0.14, 0.42, M.frame, s * 1.0, 0.07, 0, g, false);
    [0.85, 1.75].forEach(y => {
      const pul = cyl(0.085, 0.085, 0.06, M.metal, s * 1.0, y, 0.12, g, 14);
      pul.rotation.x = Math.PI / 2;
    });
    box(0.5, 0.9, 0.16, M.frame, s * 1.0, 1.15, -0.14, g, false);
    [0.92, 1.1, 1.28, 1.46].forEach(y => box(0.42, 0.1, 0.2, M.black, s * 1.0, y, -0.14, g, false));
    const cab = cyl(0.012, 0.012, 1.45, M.steel, s * 0.97, 1.06, 0.16, g, 6);
    cab.rotation.z = s * 0.05;
    box(0.16, 0.06, 0.06, M.black, s * 0.6, 0.33, 0.16, g, false);
  });
  box(2.14, 0.12, 0.3, M.frame, 0, 2.4, 0, g, false);
  return g;
}

function gymSmith(group) {
  const g = new THREE.Group();
  g.position.set(0.8, 0, -12.7);
  group.add(g);
  [-0.68, 0.68].forEach(x => {
    box(0.09, 2.35, 0.09, M.steel, x, 1.18, 0, g, false);
    box(0.18, 0.1, 0.44, M.frame, x, 0.05, 0, g, false);
    box(0.045, 2.2, 0.045, M.metal, x, 1.2, 0.16, g, false);
  });
  box(1.45, 0.09, 0.09, M.steel, 0, 2.32, 0, g, false);
  const bar = cyl(0.022, 0.022, 1.8, M.steel, 0, 1.05, 0.18, g, 10);
  bar.rotation.z = Math.PI / 2;
  [-0.72, 0.72].forEach(x => {
    const p = cyl(0.15, 0.15, 0.06, M.frame, x, 1.05, 0.18, g, 16);
    p.rotation.z = Math.PI / 2;
  });
  box(0.5, 0.08, 1.0, M.mat, 0, 0.45, 0.15, g, false);
  box(0.08, 0.36, 0.1, M.frame, 0, 0.22, -0.3, g, false);
  return g;
}

/* ---------- 固定器械：腿举 / 蝴蝶机 / 高位下拉 ---------- */
function gymLegPress(group) {
  const g = new THREE.Group();
  g.position.set(-2.3, 0, -8.7);
  group.add(g);
  box(1.7, 0.12, 0.55, M.frame, 0, 0.18, 0, g);
  box(0.5, 0.12, 0.7, M.mat, -0.4, 0.5, -0.05, g, false);
  const back = box(0.5, 0.62, 0.12, M.mat, -0.4, 0.78, -0.36, g, false);
  back.rotation.x = -0.22;
  const rail = new THREE.Group();
  rail.position.set(0.4, 0.56, 0.1);
  rail.rotation.x = -0.45;
  g.add(rail);
  [-0.34, 0.34].forEach(x => box(0.08, 0.08, 1.2, M.steel, x, 0, 0, rail, false));
  box(0.95, 0.06, 0.6, M.frame, 0, 0.05, 0.55, rail, false);
  box(0.9, 0.42, 0.06, M.frame, 0, 0.24, 0.85, rail, false);
  [0.32, 0.62, 0.92].forEach((y, i) => box(0.86, 0.1, 0.26, M.black, 0, y, -0.28 - i * 0.22, g, false));
  return g;
}

function gymPecDeck(group) {
  const g = new THREE.Group();
  g.position.set(-4.7, 0, -8.65);
  group.add(g);
  box(0.56, 0.1, 0.56, M.frame, 0, 0.05, 0, g);
  box(0.44, 0.1, 0.44, M.mat, 0, 0.48, -0.02, g, false);
  box(0.44, 0.62, 0.12, M.mat, 0, 0.82, -0.26, g, false);
  [-1, 1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.3, 1.08, 0);
    arm.rotation.z = s * 0.35;
    g.add(arm);
    box(0.08, 0.72, 0.08, M.steel, 0, -0.3, 0, arm, false);
    box(0.22, 0.56, 0.12, M.mat, 0, -0.56, 0.12, arm, false);
  });
  box(0.62, 0.92, 0.14, M.frame, 0, 1.02, -0.4, g, false);
  box(0.5, 0.2, 0.16, M.black, 0, 1.3, -0.4, g, false);
  return g;
}

function gymLatPulldown(group) {
  const g = new THREE.Group();
  g.position.set(-0.55, 0, -8.7);
  group.add(g);
  box(0.14, 2.35, 0.2, M.frame, 0, 1.18, -0.36, g);
  box(1.2, 0.14, 0.2, M.frame, 0, 2.3, -0.16, g, false);
  box(0.56, 0.1, 0.56, M.mat, 0, 0.55, 0, g, false);
  box(0.5, 0.12, 0.1, M.frame, 0, 0.92, -0.28, g, false);
  cyl(0.012, 0.012, 1.1, M.steel, 0.42, 1.74, 0.12, g, 6);
  box(0.55, 0.04, 0.04, M.steel, 0.42, 1.16, 0.12, g, false);
  [0.98, 1.16, 1.34, 1.52].forEach(y => box(0.45, 0.09, 0.24, M.black, 0, y, -0.44, g, false));
  return g;
}

/* ---------- 有氧：跑步机 / 划船机 / 动感单车 ---------- */
function gymTreadmill(group, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  group.add(g);
  box(1.5, 0.16, 0.72, M.frame, 0, 0.22, 0, g);
  box(1.24, 0.05, 0.46, M.black, 0, 0.32, 0, g, false);
  [-0.32, 0.32].forEach(s => box(1.4, 0.06, 0.07, M.steel, 0, 0.38, s, g, false));
  [-1, 1].forEach(s => box(0.07, 0.9, 0.07, M.steel, 0.56, 0.75, s * 0.3, g, false));
  box(0.22, 0.56, 0.62, M.black, 0.6, 1.18, 0, g, false);
  box(0.02, 0.36, 0.5, new THREE.MeshStandardMaterial({
    color: 0x0b1016, emissive: 0x1c5f8a, emissiveIntensity: 0.9
  }), 0.715, 1.2, 0, g, false);
  return g;
}

function gymRower(group, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  group.add(g);
  box(1.5, 0.1, 0.28, M.steel, 0, 0.18, 0, g, false);
  box(0.4, 0.1, 0.4, M.black, 0, 0.26, 0, g, false);
  box(0.14, 0.06, 0.38, M.metal, 0.62, 0.3, 0, g, false);
  const wheel = cyl(0.24, 0.24, 0.16, M.frame, 0.72, 0.42, 0, g, 16);
  wheel.rotation.x = Math.PI / 2;
  const cable = cyl(0.012, 0.012, 1.0, M.steel, 0.12, 0.42, 0, g, 6);
  cable.rotation.z = Math.PI / 2;
  box(0.16, 0.04, 0.38, M.black, -0.3, 0.34, 0, g, false);
  return g;
}

function gymSpinBike(group, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  group.add(g);
  box(1.0, 0.1, 0.4, M.frame, 0, 0.05, 0, g, false);
  box(0.14, 0.9, 0.16, M.steel, -0.05, 0.5, 0, g, false);
  const wheel = cyl(0.3, 0.3, 0.1, M.frame, 0.4, 0.46, 0, g, 18);
  wheel.rotation.x = Math.PI / 2;
  box(0.34, 0.08, 0.24, M.mat, -0.22, 0.82, 0, g, false);
  box(0.1, 0.55, 0.1, M.steel, -0.42, 0.56, 0, g, false);
  box(0.1, 0.06, 0.5, M.steel, -0.4, 1.02, 0, g, false);
  box(0.09, 0.09, 0.09, M.metal, 0.08, 0.95, 0, g, false);
  return g;
}

/* ---------- 功能训练与收纳：壶铃架 / 瑜伽垫 / TRX / 储物柜 / 饮水机 ---------- */
function gymKettlebellRack(group) {
  const g = new THREE.Group();
  g.position.set(-5.6, 0, -6.35);
  group.add(g);
  [0.55, 0.95].forEach(y => {
    box(1.5, 0.05, 0.5, M.frame, 0, y, 0, g, false);
    for (let k = 0; k < 5; k++) {
      const x = -0.56 + k * 0.28;
      const r = 0.07 + k * 0.004;
      const body = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), M.black);
      body.position.set(x, y + 0.09, 0);
      body.castShadow = true;
      g.add(body);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(r * 0.62, 0.014, 6, 12, Math.PI), M.steel);
      handle.position.set(x, y + 0.09 + r, 0);
      g.add(handle);
    }
  });
  [-0.7, 0.7].forEach(x => box(0.06, 1.0, 0.5, M.steel, x, 0.5, 0, g, false));
  return g;
}

function gymMats(group) {
  const g = new THREE.Group();
  g.position.set(-3.6, 0, -6.35);
  group.add(g);
  [0x2b6d8f, 0x8a3a3a, 0x3f7a52].forEach((c, i) => {
    box(0.7, 0.02, 1.7, new THREE.MeshStandardMaterial({ color: c, roughness: 0.96 }),
      (i - 1) * 0.78, 0.03, 0, g, false);
  });
  return g;
}

function gymTrx(group) {
  const g = new THREE.Group();
  g.position.set(-1.2, 0, -6.35);
  group.add(g);
  [-0.55, 0.55].forEach(x => box(0.08, 2.5, 0.08, M.steel, x, 1.25, 0, g, false));
  box(1.3, 0.08, 0.08, M.steel, 0, 2.45, 0, g, false);
  [-0.32, 0.32].forEach(x => {
    box(0.035, 1.5, 0.035, M.black, x, 1.62, 0.02, g, false);
    box(0.18, 0.06, 0.05, M.black, x, 0.85, 0.02, g, false);
  });
  return g;
}

function gymLockers(group) {
  const g = new THREE.Group();
  g.position.set(2.36, 0, -6.75);
  group.add(g);
  const body = new THREE.MeshStandardMaterial({ color: 0x39434c, roughness: 0.7, metalness: 0.25 });
  box(0.42, 1.9, 1.5, body, 0, 0.95, 0, g);
  [-0.5, 0, 0.5].forEach(z => {
    box(0.02, 1.7, 0.46, M.deskDark, -0.22, 0.95, z, g, false);
    box(0.03, 0.1, 0.03, M.metal, -0.24, 1.1, z + 0.18, g, false);
  });
  return g;
}

function gymWater(group) {
  const g = new THREE.Group();
  g.position.set(2.3, 0, -8.2);
  group.add(g);
  box(0.42, 1.05, 0.42, M.whiteSteel, 0, 0.53, 0, g);
  cyl(0.16, 0.16, 0.4, new THREE.MeshPhysicalMaterial({
    color: 0xbfe3f0, roughness: 0.15, transparent: true, opacity: 0.55
  }), 0, 1.25, 0, g, 14).castShadow = false;
  box(0.36, 0.16, 0.06, M.black, -0.05, 0.75, 0.22, g, false);
  return g;
}

/* ---------- 健身房角色：爆炸头 + 耳机 + 哑铃飞鸟 ---------- */
function gymBro() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc08a5f, roughness: 0.6 });
  const vest = new THREE.MeshStandardMaterial({ color: 0x1c242c, roughness: 0.88 });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x27303a, roughness: 0.9 });
  const afro = new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.97 });
  const hpMat = new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.42, metalness: 0.4 });
  const hpGlow = new THREE.MeshStandardMaterial({
    color: 0x0d2634, emissive: 0x35d6ff, emissiveIntensity: 1.5, roughness: 0.45
  });
  const iron = new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.5, metalness: 0.7 });
  const abMat = new THREE.MeshStandardMaterial({ color: 0x9a6a48, roughness: 0.82 });

  // 腿 / 鞋
  [-1, 1].forEach(s => {
    box(0.17, 0.5, 0.19, skin, s * 0.14, 0.38, 0, g);
    box(0.21, 0.14, 0.24, shorts, s * 0.14, 0.68, 0, g);
    box(0.18, 0.09, 0.3, iron, s * 0.14, 0.045, 0.05, g);
  });
  box(0.44, 0.2, 0.27, shorts, 0, 0.8, 0, g);

  // 躯干：背心 + 胸肌 + 腹肌线条
  box(0.46, 0.52, 0.28, skin, 0, 1.08, 0, g);
  box(0.49, 0.36, 0.3, vest, 0, 1.04, 0, g);
  [-1, 1].forEach(s => {
    box(0.17, 0.11, 0.05, skin, s * 0.11, 1.24, 0.16, g, false);
    box(0.09, 0.3, 0.05, skin, s * 0.24, 1.06, 0.06, g, false).rotation.y = s * 0.5;
  });
  [0, 1, 2].forEach(i => box(0.2, 0.03, 0.03, abMat, 0, 1.03 - i * 0.07, 0.16, g, false));

  // 头 + 爆炸头 + 头戴耳机
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  g.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), skin);
  face.scale.set(1, 1.08, 1.02);
  face.position.y = 0.02;
  face.castShadow = true;
  head.add(face);
  [-1, 1].forEach(s => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), afro);
    puff.position.set(s * 0.12, 0.05, -0.02);
    head.add(puff);
  });
  [[0, 0.19, 0], [-0.11, 0.15, 0.03], [0.11, 0.15, 0.03], [0, 0.15, -0.11], [0, 0.12, 0.12], [-0.1, 0.1, -0.09], [0.1, 0.1, -0.09]].forEach(p => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), afro);
    puff.position.set(p[0], p[1], p[2]);
    head.add(puff);
  });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 8, 18, Math.PI), hpMat);
  band.position.y = 0.02;
  head.add(band);
  [-1, 1].forEach(s => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16), hpMat);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.145, 0.0, 0);
    head.add(cup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 16), hpGlow);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * 0.172, 0.0, 0);
    head.add(ring);
  });

  // 双臂：肩关节组绕 z 轴开合，哑铃随手部运动
  const arms = {};
  [-1, 1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.3, 1.27, 0);
    g.add(arm);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), skin);
    shoulder.position.set(0, 0.02, 0);
    shoulder.castShadow = true;
    arm.add(shoulder);
    box(0.11, 0.3, 0.12, skin, 0, -0.17, 0, arm);
    box(0.095, 0.28, 0.1, skin, 0, -0.43, 0.01, arm, false);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
    hand.position.set(0, -0.58, 0.01);
    arm.add(hand);
    const bar = cyl(0.016, 0.016, 0.24, M.steel, 0, -0.59, 0.01, arm, 8);
    bar.rotation.z = Math.PI / 2;
    [-0.1, 0.1].forEach(oz => {
      const w = cyl(0.06, 0.06, 0.05, iron, oz, -0.59, 0.01, arm, 14);
      w.rotation.z = Math.PI / 2;
    });
    if (s < 0) arms.L = arm; else arms.R = arm;
  });

  g.userData.paused = false;
  g.userData.anim = t => {
    if (g.userData.paused) return;
    const a = 0.55 + 0.45 * (0.5 - 0.5 * Math.cos(t * 2.1));
    arms.L.rotation.z = -a;
    arms.R.rotation.z = a;
    arms.L.rotation.x = 0.1;
    arms.R.rotation.x = 0.1;
    head.position.y = 1.5 + Math.sin(t * 2.1) * 0.007;
    g.position.y = Math.sin(t * 2.1) * 0.005;
  };
  return g;
}

/* ---------- MMA 八角笼擂台 ---------- */
function gymMMA(group, cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  group.add(g);

  const matPad = new THREE.MeshStandardMaterial({ color: 0x1e5d8c, roughness: 0.94 });
  const matEdge = new THREE.MeshStandardMaterial({ color: 0x123c5c, roughness: 0.9 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1c2126, roughness: 0.65, metalness: 0.25 });
  const netMat = new THREE.MeshStandardMaterial({
    color: 0xc9d3da, roughness: 0.5, metalness: 0.45,
    transparent: true, opacity: 0.5, side: THREE.DoubleSide
  });
  const R = 3.2;

  // 安全缓冲区地垫 + 八角台面
  const apron = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 1.3, R + 1.3, 0.03, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.95 })
  );
  apron.position.y = 0.015;
  g.add(apron);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.52, 8), matPad);
  deck.position.y = 0.26;
  g.add(deck);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.1, R + 0.1, 0.1, 8), matEdge);
  rim.position.y = 0.52;
  g.add(rim);

  // 八根软包立柱 + 围网 + 上下横杆
  const faceR = R * Math.cos(Math.PI / 8);
  const faceW = 2 * R * Math.sin(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const th = i * Math.PI / 4 + Math.PI / 8;
    const px = Math.cos(th) * R, pz = Math.sin(th) * R;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.0, 10), matEdge);
    post.position.set(px, 1.52, pz);
    g.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), postMat);
    cap.position.set(px, 2.52, pz);
    g.add(cap);
  }
  for (let i = 0; i < 8; i++) {
    const th = i * Math.PI / 4;
    const px = Math.cos(th) * faceR, pz = Math.sin(th) * faceR;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(faceW, 1.8), netMat);
    panel.position.set(px, 1.48, pz);
    panel.rotation.y = Math.PI / 2 - th;
    g.add(panel);
    [2.36, 0.62].forEach(y => {
      const bar = box(faceW, 0.055, 0.055, postMat, px, y, pz, g, false);
      bar.rotation.y = Math.PI / 2 - th;
    });
  }

  // 上下台台阶（+z 侧）
  box(1.5, 0.26, 0.62, matEdge, 0, 0.13, R + 0.78, g, false);
  box(1.5, 0.26, 0.62, matEdge, 0, 0.39, R + 0.34, g, false);

  // 沙袋
  const bag = new THREE.Group();
  bag.position.set(R + 2.0, 0, 1.8);
  g.add(bag);
  box(0.08, 3.0, 0.08, postMat, 0, 1.5, 0, bag);
  box(1.05, 0.08, 0.08, postMat, 0.5, 2.94, 0, bag, false);
  const sack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.2, 1.0, 14),
    new THREE.MeshStandardMaterial({ color: 0x25292d, roughness: 0.9 })
  );
  sack.position.set(0.96, 2.14, 0);
  bag.add(sack);

  // 拳套 / 护具架
  const rack = new THREE.Group();
  rack.position.set(-R - 1.5, 0, -1.4);
  g.add(rack);
  box(1.0, 0.05, 0.42, M.steel, 0, 1.62, 0, rack, false);
  box(1.0, 0.05, 0.42, M.steel, 0, 1.0, 0, rack, false);
  [-0.44, 0.44].forEach(x => box(0.05, 1.62, 0.05, M.steel, x, 0.81, 0, rack, false));
  [[-0.28, 0xff4d4d], [-0.02, 0x3fd0ff], [0.26, 0xffcf5a]].forEach(([x, c]) => {
    const glove = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 10, 8),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.72 })
    );
    glove.position.set(x, 1.52, 0);
    rack.add(glove);
  });
  return g;
}

/* ---------- 水吧：旗舰店自助补给台（咖啡 / 轻食 / 补剂） ---------- */
function gymHydrationBar(group, cx, cz) {
  const g = new THREE.Group();
  g.position.set(cx, 0, cz);
  g.rotation.y = Math.PI;
  group.add(g);
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xf3efe8, roughness: 0.42, metalness: 0.08 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x353a3f, roughness: 0.26, metalness: 0.28 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb9855a, roughness: 0.62 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.55 });
  const darkGlass = new THREE.MeshStandardMaterial({ color: 0x232a31, roughness: 0.18, metalness: 0.4 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.72 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xd3dade, roughness: 0.24, metalness: 0.82 });

  // 台体：白色柜身 + 石材台面 + 木纹腰线 + 橙色灯带
  box(3.2, 0.98, 0.78, counterMat, 0, 0.49, 0, g);
  box(3.3, 0.07, 0.88, stoneMat, 0, 1.01, 0, g, false);
  box(3.2, 0.34, 0.03, woodMat, 0, 0.72, 0.4, g, false);
  box(3.2, 0.05, 0.04, accent, 0, 0.53, 0.4, g, false);

  // 背柜：两层置物架
  box(3.0, 2.05, 0.16, cream, 0, 1.02, -0.62, g, false);
  box(2.9, 0.05, 0.34, woodMat, 0, 1.26, -0.5, g, false);
  box(2.9, 0.05, 0.34, woodMat, 0, 1.74, -0.5, g, false);

  // 自助咖啡机
  box(0.42, 0.34, 0.34, steelMat, -0.95, 1.215, 0.02, g);
  box(0.44, 0.05, 0.36, stoneMat, -0.95, 1.41, 0.02, g, false);
  box(0.3, 0.1, 0.03, darkGlass, -0.95, 1.36, 0.185, g, false);
  box(0.03, 0.05, 0.03, M.black, -0.95, 1.31, 0.19, g, false);
  [-1.02, -0.88].forEach(x => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.06, 10), counterMat);
    cup.position.set(x, 1.08, 0.12);
    g.add(cup);
  });

  // 香蕉果盘
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.07, 16), woodMat);
  bowl.position.set(0.5, 1.08, 0.06);
  g.add(bowl);
  for (let i = 0; i < 4; i++) {
    const banana = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.021, 6, 10, Math.PI * 0.9),
      new THREE.MeshStandardMaterial({ color: 0xf2cb4a, roughness: 0.72 })
    );
    banana.position.set(0.5 + (i - 1.5) * 0.055, 1.13 + (i % 2) * 0.025, 0.06);
    banana.rotation.set(Math.PI / 2, 0, 0.4 + i * 0.3);
    g.add(banana);
  }

  // 蛋白粉罐（台面 + 背柜）
  [-0.3, -0.1].forEach((x, i) => {
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.3, 12), counterMat);
    tub.position.set(x, 1.195, 0.16);
    g.add(tub);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 12), accent);
    lid.position.set(x, 1.36, 0.16);
    g.add(lid);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.12), new THREE.MeshBasicMaterial({ color: i ? 0x2f6fb5 : 0xff8a3d }));
    label.position.set(x, 1.2, 0.246);
    g.add(label);
  });
  [1.0, 1.2, 1.4].forEach(x => {
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 12), counterMat);
    tub.position.set(x, 1.42, -0.44);
    g.add(tub);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12), accent);
    lid.position.set(x, 1.56, -0.44);
    g.add(lid);
  });

  // 微波炉（上层背柜）
  box(0.5, 0.3, 0.4, steelMat, -0.95, 1.9, -0.44, g);
  box(0.34, 0.2, 0.02, darkGlass, -0.99, 1.9, -0.235, g, false);
  box(0.03, 0.22, 0.03, M.frame, -0.63, 1.9, -0.24, g, false);

  // 零食罐（背柜两排）
  const snackColors = [0xd98b4a, 0x8fbf6a, 0xe0b64a, 0xc86b6b, 0x7f9fc4, 0xd9c9a2];
  [-0.6, -0.35, -0.1, 0.15].forEach((x, i) => {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: 0xdfe9ef, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.55 })
    );
    jar.position.set(x, 1.36, -0.44);
    g.add(jar);
    const fill = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: snackColors[i], roughness: 0.9 })
    );
    fill.position.set(x, 1.335, -0.44);
    g.add(fill);
    const jar2 = jar.clone();
    jar2.position.y = 1.84;
    g.add(jar2);
    const fill2 = fill.clone();
    fill2.position.y = 1.815;
    g.add(fill2);
  });

  // 顶部灯箱
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.32),
    new THREE.MeshBasicMaterial({ map: plateTexture('HYDRATION BAR · 水吧', '#ff9a4d'), transparent: true })
  );
  sign.position.set(0, 2.34, -0.52);
  g.add(sign);
  return g;
}

/* ---------- 窗外：海边公路 / 公园 / 低多边形车流与人流 ---------- */
function buildSeascape(group) {
  const g = new THREE.Group();
  /* 健身房位于 5 层：窗外地面整体下沉 15m，视线是俯看海边公路与公园 */
  g.position.y = -15;
  group.add(g);
  const ze = GYM.z0 - 0.2;

  // 天空渐变背板
  const sc = document.createElement('canvas');
  sc.width = 8; sc.height = 128;
  const sx = sc.getContext('2d');
  const grad = sx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#59a3da');
  grad.addColorStop(0.45, '#9fcdec');
  grad.addColorStop(0.78, '#d9ecf6');
  grad.addColorStop(1, '#f2f7f2');
  sx.fillStyle = grad; sx.fillRect(0, 0, 8, 128);
  const skyTex = new THREE.CanvasTexture(sc);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 62),
    new THREE.MeshBasicMaterial({ map: skyTex })
  );
  sky.position.set(0, 12, ze - 46);
  g.add(sky);

  const plane = (w, d, color, y, z, rough = 0.94) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color, roughness: rough })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, y, z);
    g.add(m);
    return m;
  };

  // 近处公园草地 / 步道 / 人行道 / 公路 / 海滨长廊 / 沙滩 / 海面
  plane(120, 4.8, 0x7ea864, 0.01, ze - 2.4);
  plane(120, 1.1, 0xd6cfc0, 0.012, ze - 3.7);
  plane(120, 1.4, 0xc9c4bb, 0.014, ze - 5.5);
  plane(120, 3.2, 0x4c5157, 0.016, ze - 7.8, 0.8);
  plane(120, 1.7, 0xd8d2c6, 0.014, ze - 10.2);
  plane(120, 3.0, 0xe4d9b8, 0.01, ze - 12.5);

  const seaMat = new THREE.MeshStandardMaterial({
    color: 0x2f86b0, roughness: 0.32, metalness: 0.15,
    emissive: 0x0d3550, emissiveIntensity: 0.25
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 38), seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.3, ze - 33);
  g.add(sea);

  const glintMat = new THREE.MeshBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.32 });
  for (let i = 0; i < 10; i++) {
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(2.5 + Math.random() * 5, 0.1), glintMat);
    glint.rotation.x = -Math.PI / 2;
    glint.position.set(-26 + Math.random() * 52, -0.28, ze - 15 - Math.random() * 12);
    g.add(glint);
  }

  // 公路虚线
  for (let i = 0; i < 15; i++) {
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xf2f2ec })
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-56 + i * 8, 0.03, ze - 7.8);
    g.add(dash);
  }

  // 公园树（随风轻摆）
  const trees = [];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b503a, roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7f45, roughness: 0.92 });
  for (let i = 0; i < 8; i++) {
    const tr = new THREE.Group();
    tr.position.set(-28 + i * 8 + (i % 3) * 1.2, 0, ze - 1.6 - (i % 3) * 0.9);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.0, 8), trunkMat);
    trunk.position.y = 1.0;
    tr.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), leafMat);
    crown.position.y = 2.7;
    crown.scale.set(1, 1.1, 1);
    tr.add(crown);
    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), leafMat);
    crown2.position.set(0.5, 2.2, 0.35);
    tr.add(crown2);
    g.add(tr);
    trees.push(tr);
  }

  // 长椅与路灯
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x8b6b4c, roughness: 0.9 });
  [-18, -6, 7, 19].forEach(x => {
    const b = new THREE.Group();
    b.position.set(x, 0, ze - 4.6);
    box(1.5, 0.08, 0.42, benchMat, 0, 0.44, 0, b, false);
    box(1.5, 0.3, 0.07, benchMat, 0, 0.7, -0.2, b, false);
    [-0.6, 0.6].forEach(s => box(0.08, 0.44, 0.36, M.frame, s, 0.22, 0, b, false));
    g.add(b);
  });
  for (let i = 0; i < 5; i++) {
    box(0.1, 4.2, 0.1, M.steel, -24 + i * 12, 2.1, ze - 5.9, g, false);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff8e6, emissive: 0xfff1cf, emissiveIntensity: 0.9 })
    );
    lamp.position.set(-24 + i * 12, 4.2, ze - 5.9);
    g.add(lamp);
  }

  // 低多边形车辆（沿公路循环）
  const cars = [];
  const carColors = [0xf2f2f2, 0x2f6fb5, 0xc8452f, 0x2f7a55, 0xe8b23a, 0x3b3f45];
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: carColors[i], roughness: 0.45, metalness: 0.35 });
    box(2.6, 0.62, 1.22, bodyMat, 0, 0.55, 0, c, false);
    box(1.35, 0.46, 1.1, bodyMat, -0.05, 1.03, 0, c, false);
    box(1.05, 0.28, 1.12, M.frame, -0.05, 1.05, 0, c, false);
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 10), M.frame);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(sx * 0.86, 0.26, sz * 0.58);
      c.add(wheel);
    }));
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.14, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xfff6cf, emissive: 0xffe9a8, emissiveIntensity: 1.2 })
    );
    head.position.set(-1.32, 0.6, 0);
    c.add(head);
    const dir = i % 2 === 0 ? 1 : -1;
    c.position.set(-50 + i * 17, 0, ze - 7.8 + (i % 2 === 0 ? 0.75 : -0.75));
    c.rotation.y = dir > 0 ? 0 : Math.PI;
    g.add(c);
    cars.push({ obj: c, offset: i * 17, dir, speed: 5 + (i % 3) * 1.6 });
  }

  // 低多边形行人（公园步道来回散步）
  const people = [];
  const shirtColors = [0xe86a5a, 0x4c86c6, 0xf0c04a, 0x6bbf7a, 0xb07ac8, 0xdedede];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Group();
    const shirt = new THREE.MeshStandardMaterial({ color: shirtColors[i], roughness: 0.85 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd8ab85, roughness: 0.8 });
    box(0.34, 0.52, 0.22, shirt, 0, 1.06, 0, p, false);
    [-0.09, 0.09].forEach(x => box(0.12, 0.5, 0.14, M.frame, x, 0.55, 0, p, false));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skin);
    head.position.y = 1.48;
    p.add(head);
    const dir = i % 2 === 0 ? 1 : -1;
    p.position.set(-26 + i * 9, 0, ze - 3.7 + (i % 2 === 0 ? 0.28 : -0.28));
    p.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(p);
    people.push({ obj: p, offset: i * 9, dir, speed: 0.9 + (i % 3) * 0.25, z: p.position.z });
  }

  return {
    update(t) {
      cars.forEach(c => {
        let p = (c.offset + c.dir * t * c.speed) % 112;
        if (p < 0) p += 112;
        c.obj.position.x = -56 + p;
      });
      people.forEach(p => {
        let q = (p.offset + p.dir * t * p.speed) % 56;
        if (q < 0) q += 56;
        p.obj.position.x = -28 + q;
        p.obj.position.y = Math.abs(Math.sin(t * 3.4 + p.offset)) * 0.035;
        p.obj.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      });
      trees.forEach((tr, i) => {
        tr.rotation.z = Math.sin(t * 0.55 + i * 1.27) * 0.022;
      });
      seaMat.emissiveIntensity = 0.22 + 0.06 * Math.sin(t * 0.7);
    }
  };
}

/* ---------- 健身房总装：外壳 + 海景 + 电竞区 + MMA + 器材 + 角色 ---------- */
function buildGym(group, hit) {
  // 健身房是封闭房间：单独挂 root，便于统一关闭平行光投影、控制阴影开销
  const root = new THREE.Group();
  group.add(root);
  gymShell(root);
  const sea = buildSeascape(root);

  const rgbMat = new THREE.MeshStandardMaterial({
    color: 0x1a1030, emissive: 0xff2f8e, emissiveIntensity: 1.6, roughness: 0.4
  });
  const screenMats = [];
  // 电竞区只占右墙一条：整体右移 5.36m，椅子朝房间内侧
  const esp = new THREE.Group();
  esp.position.x = 5.36;
  root.add(esp);
  [-10.4, -11.9, -13.4].forEach(z => gymStation(esp, z, rgbMat, screenMats));

  gymSquatRack(root);
  gymBench(root);
  gymDumbbellRack(root);
  gymPlateTree(root);
  gymCable(root);
  gymSmith(root);
  gymLegPress(root);
  gymPecDeck(root);
  gymLatPulldown(root);
  gymKettlebellRack(root);
  gymMats(root);
  gymTrx(root);
  gymLockers(root);
  gymWater(root);

  // 有氧区：沿落地窗一排放，全部正对海景
  const FACE = Math.PI / 2;
  gymTreadmill(root, -6.6, -24.9, FACE);
  gymTreadmill(root, -4.2, -24.9, FACE);
  gymRower(root, -1.8, -24.9, FACE);
  gymRower(root, 0.6, -24.9, FACE);
  gymSpinBike(root, 3.0, -24.9, FACE);
  gymTreadmill(root, 5.4, -24.9, FACE);
  gymTreadmill(root, 6.9, -24.9, FACE);

  // MMA 擂台区独立成区 + 入口内侧水吧
  gymMMA(root, -0.6, -18.6);
  gymHydrationBar(root, 5.0, -6.9);

  const bro = gymBro();
  bro.position.set(-2.4, 0, -10.05);
  root.add(bro);
  root.traverse(o => { if (o.isMesh) o.castShadow = false; });

  const gear = (w, h, d, x, y, z, title, muscle, load, area, how) => hit(w, h, d, x, y, z, {
    key: 'gymgear',
    tag: 'GYM EQUIPMENT',
    title,
    rows: [
      ['器材名称', title],
      ['目标肌群', muscle],
      ['配重范围', load],
      ['所在区域', area],
      ['使用说明', how],
      ['安全提示', '确认插销与卡扣到位，全程控制速度，勿在疲劳时硬拉']
    ],
    note: '健身房演示数据：点击角色可暂停/继续飞鸟动作，开馆后请以现场铭牌与教练指导为准。'
  });

  gear(1.6, 2.4, 1.5, -4.5, 1.2, -12.4, '深蹲架 · Squat Rack', '股四头肌 / 臀大肌 / 核心', '20–200 kg（杠铃）', '自由力量区', '调整 J 钩至肩下，保护杠略低于最低点，起杠后退两步完成深蹲。');
  gear(1.0, 1.3, 1.8, -2.85, 0.65, -11.1, '卧推凳 · Bench Press', '胸大肌 / 三角肌前束 / 肱三头肌', '20–120 kg', '自由力量区', '肩胛后收下沉，杠铃触胸后垂直推起，建议有人保护。');
  gear(1.8, 1.1, 0.6, -6.9, 0.55, -13.05, '可调哑铃架', '全身（按动作选择）', '2.5–40 kg × 7 对', '自由力量区', '按重量递增取放，取放后回位，避免哑铃滚落。');
  gear(0.8, 1.5, 0.8, -8.32, 0.75, -12.55, '杠铃片树', '—（配重配件）', '1.25–25 kg', '自由力量区', '对称取片，单次搬运不超过两片，挂杆朝内放置。');
  gear(2.3, 2.5, 0.9, -1.0, 1.25, -12.85, '龙门架 · Cable Crossover', '胸 / 背 / 肩 / 手臂', '5–90 kg 双侧', '自由力量区', '选择滑轮高度与把手，双脚前后站立保持躯干稳定。');
  gear(1.6, 2.4, 0.9, 0.8, 1.2, -12.7, '史密斯机 · Smith Machine', '胸 / 腿 / 肩', '20–160 kg', '自由力量区', '先解锁安全挂钩，确认导轨顺畅后再加载配重。');
  gear(1.8, 1.4, 1.6, -2.3, 0.7, -8.7, '腿举机 · Leg Press', '股四头肌 / 臀大肌', '20–180 kg', '固定器械区', '腰背贴紧靠垫，膝盖不锁死，下放至 90° 即止。');
  gear(1.0, 1.6, 1.0, -4.7, 0.8, -8.65, '蝴蝶机 · Pec Deck', '胸大肌 / 三角肌前束', '10–80 kg', '固定器械区', '调整座椅使把手与肩同高，回收时控制 2 秒。');
  gear(1.4, 2.4, 1.0, -0.55, 1.2, -8.7, '高位下拉 · Lat Pulldown', '背阔肌 / 肱二头肌', '10–90 kg', '固定器械区', '宽握下拉至锁骨上方，避免身体后仰借力。');
  gear(0.9, 1.5, 1.7, -6.6, 0.75, -24.9, '跑步机 A · Treadmill', '心肺 / 下肢', '0–18 km/h · 0–12% 坡度', '有氧区（落地窗一线）', '先夹好安全夹，起步 4 km/h 热身 3 分钟再提速。');
  gear(0.9, 1.5, 1.7, -4.2, 0.75, -24.9, '跑步机 B · Treadmill', '心肺 / 下肢', '0–18 km/h · 0–12% 坡度', '有氧区（落地窗一线）', '先夹好安全夹，起步 4 km/h 热身 3 分钟再提速。');
  gear(0.6, 0.7, 1.7, -1.8, 0.35, -24.9, '划船机 A · Rower', '心肺 / 背部 / 核心', '磁阻 1–10 档', '有氧区（落地窗一线）', '腿—核心—手臂顺序发力，回桨时手臂先回。');
  gear(0.6, 0.7, 1.7, 0.6, 0.35, -24.9, '划船机 B · Rower', '心肺 / 背部 / 核心', '磁阻 1–10 档', '有氧区（落地窗一线）', '腿—核心—手臂顺序发力，回桨时手臂先回。');
  gear(0.6, 1.2, 1.2, 3.0, 0.6, -24.9, '动感单车 · Spin Bike', '心肺 / 股四头肌', '磁阻 1–10 档', '有氧区（落地窗一线）', '调节座椅至髋部高度，骑行时膝盖对准脚尖。');
  gear(0.9, 1.5, 1.7, 5.4, 0.75, -24.9, '跑步机 C · Treadmill', '心肺 / 下肢', '0–18 km/h · 0–12% 坡度', '有氧区（落地窗一线）', '先夹好安全夹，起步 4 km/h 热身 3 分钟再提速。');
  gear(0.9, 1.5, 1.7, 6.9, 0.75, -24.9, '跑步机 D · Treadmill', '心肺 / 下肢', '0–18 km/h · 0–12% 坡度', '有氧区（落地窗一线）', '先夹好安全夹，起步 4 km/h 热身 3 分钟再提速。');
  gear(1.2, 1.1, 0.6, -5.6, 0.55, -6.35, '壶铃架', '全身 / 核心', '4–32 kg', '功能训练区', '单臂摆荡时保持背部中立，壶铃不超过肩高。');
  gear(1.8, 0.35, 0.9, -3.6, 0.16, -6.35, '瑜伽垫区', '核心 / 柔韧', '—', '功能训练区', '垫面平整防滑，卷起后归位到收纳架。');
  gear(0.9, 2.2, 0.5, -1.2, 1.1, -6.35, 'TRX 悬挂架', '核心 / 背部 / 肩', '自重调节', '功能训练区', '检查锚点与织带，身体倾斜角度控制难度。');
  gear(0.6, 2.0, 1.6, 2.36, 1.0, -6.75, '储物柜', '—', '12 格 · 电子锁', '收纳区', '贵重物品随身携带，离场确认柜门锁闭。');
  gear(0.6, 1.5, 0.6, 2.3, 0.75, -8.2, '饮水机', '—', '冷 / 热双温', '收纳区', '接水时杯口对准出水口，避免烫伤。');

  [-10.4, -11.9, -13.4].forEach((z, i) => hit(1.0, 1.8, 1.5, 7.32, 0.9, z, {
    key: 'gymgear',
    tag: 'ESPORTS STATION',
    title: `电竞位 ${i + 1} · 高配主机`,
    rows: [
      ['电竞椅', '高背可躺 · 4D 扶手 · RGB 头枕'],
      ['主机', 'i9 / 64G / RTX 5080 · 水冷'],
      ['屏幕', '27" 2K 240Hz · 1ms'],
      ['外设', '机械键盘 · 轻量鼠标 · 耳机挂架'],
      ['灯效', 'RGB 同步 · 与右墙灯带联动'],
      ['理线', '桌下理线槽 + 磁吸束线扣']
    ],
    note: '电竞区仅占右侧墙边一条，不侵占健身区域；灯效随场景时间缓慢变换。'
  }));

  hit(7.0, 2.6, 7.2, -0.6, 1.3, -18.6, {
    key: 'gymgear',
    tag: 'MMA ARENA',
    title: 'MMA 八角笼 · 格斗擂台',
    rows: [
      ['规格', '八角笼 · 对边 6.4m · 台高 0.52m'],
      ['地面', '8mm 专业格斗地垫 + 缓冲外圈'],
      ['围护', '软包立柱 + 高强度围网 + 上下横杆'],
      ['配套', '沙袋 · 速度球 · 拳套架 · 护具架'],
      ['安全缓冲', '外圈 1.3m 缓冲区，观赛区独立'],
      ['使用规则', '需佩戴护齿与拳套，禁止摔投至围网易受伤'],
      ['预约状态', '今日 19:00–20:30 已约 · 其余时段空闲']
    ],
    note: '擂台区独立成区，不与器械混放；教学或对练需教练在场。'
  });

  hit(3.4, 1.2, 1.0, 5.0, 0.6, -6.9, {
    key: 'gymgear',
    tag: 'HYDRATION BAR',
    title: '水吧 · 自助补给台',
    rows: [
      ['供应', '意式咖啡 · 冷萃 · 电解质水 · 蛋白奶昔'],
      ['自助', '咖啡机 1 台 · 微波炉 1 台 · 制冰机'],
      ['轻食', '蛋白棒 · 坚果 · 香蕉 · 全麦贝果'],
      ['补剂', '乳清蛋白 / 分离蛋白 / 肌酸（会员价）'],
      ['开放', '06:00 – 24:00 · VVIP 会员 24H 自助']
    ],
    note: 'VVIP 会员专属补给区，咖啡与轻食全天自助，赛后补剂由营养师配比。'
  });

  hit(15.6, 3.2, 0.6, -0.4, 2.6, -25.9, {
    key: 'gymgear',
    tag: 'SEA VIEW',
    title: '落地玻璃幕墙 · 海边公路与公园',
    rows: [
      ['楼层', '位于 5 层 · 俯看约 15m 下的海边公路'],
      ['朝向', '整面南向落地玻璃 · 层高 5.5m 通透'],
      ['近景', '公园草坪 · 步道 · 长椅 · 行道树'],
      ['中景', '海边公路 · 车流循环 · 游客散步骑行'],
      ['远景', '海面波光 · 天空云层'],
      ['氛围', '微风 · 树木不定时轻摆 · 白天自然光'],
      ['节能', 'Low-E 中空玻璃，日照得热降低 42%']
    ],
    note: '窗外为低多边形动效，车辆与行人循环复用，不加载外部模型与贴图。'
  });

  hit(1.0, 2.0, 0.8, -2.4, 1.0, -10.05, {
    key: 'gymgear',
    tag: 'GYM BRO',
    title: '爆炸头 · 耳机训练者',
    rows: [
      ['昵称', '阿飞（Afro Bro）'],
      ['训练动作', '哑铃侧平举 / 飞鸟'],
      ['当前组数', '第 4 组 · 12 次'],
      ['耳机状态', '播放中 · 160 BPM 训练歌单'],
      ['目标肌群', '三角肌中束 / 斜方肌'],
      ['提示', '点击角色可暂停 / 继续动作']
    ],
    note: '角色用几何体组合构建，动作循环由场景时间驱动，不依赖外部模型。',
    onClick: () => { bro.userData.paused = !bro.userData.paused; }
  });

  group.userData.gym = {
    update(t) {
      rgbMat.emissive.setHSL((t * 0.06) % 1, 0.92, 0.55);
      rgbMat.emissiveIntensity = 1.2 + 0.45 * Math.sin(t * 3);
      screenMats.forEach((m, i) => {
        m.emissive.setHSL((t * 0.05 + i * 0.13) % 1, 0.7, 0.5);
        m.emissiveIntensity = 0.9 + 0.3 * Math.sin(t * 1.7 + i);
      });
      bro.userData.anim(t);
      sea.update(t);
    }
  };
}

/* ---------- 后墙：玻璃隔断 + 中间双扇自动门 ---------- */
function glassDoors(group) {
  const z = 5.42, W = 11.4, H = 2.5, base = 0.05;

  const pane = (parent, x, w, zz, h = H, y = base + h / 2) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
    p.position.set(x, y, zz);
    parent.add(p);
  };

  // 磨砂标识腰线（双面）
  const bandTex = glassBandTexture();
  const bandMat = new THREE.MeshBasicMaterial({
    map: bandTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false
  });
  const band = (parent, x, w, zz) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.2), bandMat);
    b.position.set(x, 1.02, zz);
    parent.add(b);
  };

  // 不锈钢立柱与上下轨
  [-5.7, -3.7, -1.85, 0, 1.85, 3.7, 5.7].forEach(x => box(0.08, H, 0.15, M.steel, x, base + H / 2, z, group, false));
  box(W, 0.1, 0.18, M.steel, 0, base + H + 0.05, z, group, false);
  box(W, 0.05, 0.2, M.steel, 0, 0.025, z, group, false);

  // 顶部自动门机箱 + 传感器
  box(3.1, 0.34, 0.22, M.steel, 0, base + H + 0.28, z, group, false);
  box(2.5, 0.05, 0.06, M.frame, 0, base + H + 0.16, z + 0.11, group, false);

  // 两侧固定扇
  [-2.775, 2.775].forEach(x => {
    pane(group, x, 1.85, z + 0.015);
    band(group, x, 1.7, z + 0.03);
  });

  // 左右两端各一扇玻璃平开门（与中间自动门连成整片隔断）
  const hingedLeaf = dir => {
    const w = 1.94;
    const leaf = new THREE.Group();
    leaf.position.set(dir * 5.66, 0, z + 0.015);
    pane(leaf, -dir * w / 2, w - 0.06, 0);
    band(leaf, -dir * w / 2, w - 0.24, 0.006);
    box(w, 0.05, 0.055, M.steel, -dir * w / 2, base + H - 0.02, 0, leaf, false);
    box(w, 0.05, 0.055, M.steel, -dir * w / 2, base + 0.02, 0, leaf, false);
    box(0.055, H, 0.055, M.steel, 0, base + H / 2, 0, leaf, false);
    box(0.055, H, 0.055, M.steel, -dir * w, base + H / 2, 0, leaf, false);
    // 合页
    [0.5, 1.3, 2.1].forEach(hy => box(0.055, 0.16, 0.1, M.steel, 0, hy, 0.05, leaf, false));
    // 长条门把（靠内侧竖装，双面可握）
    const hx = -dir * (w - 0.18);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.72, 10), M.steel);
    bar.position.set(hx, 1.2, 0.075);
    bar.castShadow = true;
    leaf.add(bar);
    [0.96, 1.44].forEach(hy => box(0.05, 0.03, 0.07, M.steel, hx, hy, 0.04, leaf, false));
    // 顶部闭门器
    box(0.34, 0.055, 0.08, M.metal, -dir * 0.9, base + H - 0.14, 0.06, leaf, false);
    group.add(leaf);
    return leaf;
  };
  hingedLeaf(-1);
  hingedLeaf(1);

  // 中间双扇自动平移门
  const makeLeaf = dir => {
    const leaf = new THREE.Group();
    leaf.position.set(dir * 0.925, 0, z + 0.09);
    pane(leaf, 0, 1.83, 0);
    band(leaf, 0, 1.7, 0.015);
    box(1.88, 0.05, 0.055, M.steel, 0, base + H - 0.02, 0, leaf, false);
    box(1.88, 0.05, 0.055, M.steel, 0, base + 0.02, 0, leaf, false);
    box(0.055, H, 0.055, M.steel, -0.915, base + H / 2, 0, leaf, false);
    box(0.055, H, 0.055, M.steel, 0.915, base + H / 2, 0, leaf, false);
    group.add(leaf);
    return leaf;
  };
  const slideL = makeLeaf(-1);
  const slideR = makeLeaf(1);
  group.userData.slideDoors = [
    { obj: slideL, dir: -1 },
    { obj: slideR, dir: 1 }
  ];

  // 门口红色地垫
  box(1.9, 0.016, 0.92, M.mat, 0, 0.008, 4.7, group, false);

  // 左侧安全出口指示灯
  box(0.36, 0.16, 0.05, M.green, -3.25, 2.62, z + 0.1, group, false);
  box(0.2, 0.1, 0.03, M.light, -3.25, 2.62, z + 0.13, group, false);
}

/* ---------- 墙面消防器材（仅大屏右下角保留一处） ---------- */
function fireExtinguisher(group) {
  const x = 8.42, z = ROOM.wallZ + 0.18;

  // 墙面背板 + 消防标识
  box(0.5, 0.96, 0.03, M.wallDim, x, 0.52, z - 0.09, group, false);
  box(0.34, 0.34, 0.02, M.red, x, 1.2, z - 0.07, group, false);
  box(0.2, 0.06, 0.015, M.whiteSteel, x, 1.23, z - 0.055, group, false);
  box(0.06, 0.2, 0.015, M.whiteSteel, x, 1.23, z - 0.055, group, false);

  // 瓶体 / 底座
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.44, 18), M.red);
  body.position.set(x, 0.45, z);
  body.castShadow = true;
  group.add(body);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.04, 18), M.black);
  base.position.set(x, 0.24, z);
  group.add(base);

  // 瓶颈 / 阀门 / 压力表 / 提把
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.09, 14), M.black);
  neck.position.set(x, 0.7, z);
  group.add(neck);
  box(0.1, 0.055, 0.1, M.black, x, 0.76, z, group, false);
  box(0.15, 0.022, 0.03, M.black, x, 0.8, z, group, false);

  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 14), M.whiteSteel);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(x + 0.07, 0.73, z + 0.04);
  group.add(gauge);

  // 黄色反光带
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.087, 0.087, 0.05, 18),
    new THREE.MeshStandardMaterial({ color: 0xe8c45a, roughness: 0.5 })
  );
  band.position.set(x, 0.6, z);
  group.add(band);

  // 软管
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x + 0.06, 0.7, z + 0.03),
    new THREE.Vector3(x + 0.11, 0.62, z + 0.07),
    new THREE.Vector3(x + 0.1, 0.42, z + 0.08),
    new THREE.Vector3(x + 0.06, 0.34, z + 0.06)
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 20, 0.014, 6, false), M.black));
}

/* ---------- 大屏两侧墙角挂墙音响 ---------- */
function wallSpeaker(group, x) {
  const z = ROOM.wallZ + 0.08;

  box(0.2, 0.16, 0.06, M.black, x, 3.02, z, group, false);        // 挂板
  box(0.08, 0.06, 0.16, M.frame, x, 2.98, z + 0.1, group, false); // 支架臂

  const cab = new THREE.Group();
  cab.position.set(x, 2.92, z + 0.2);
  cab.rotation.x = 0.28;   // 略微俯向地面
  group.add(cab);

  box(0.3, 0.42, 0.22, M.frame, 0, -0.13, 0, cab);
  box(0.26, 0.36, 0.02, M.mesh, 0, -0.13, 0.115, cab, false);

  const woofer = new THREE.Mesh(new THREE.CircleGeometry(0.082, 22), M.black);
  woofer.position.set(0, -0.17, 0.127);
  cab.add(woofer);
  const tweeter = new THREE.Mesh(new THREE.CircleGeometry(0.035, 18), M.metal);
  tweeter.position.set(0, 0.01, 0.127);
  cab.add(tweeter);
}

/* ---------- 运维细节：灭火器检查卡 / 应急照明 / 疏散指示 ---------- */
function emergencySigns(group) {
  // 灭火器旁的月度检查卡
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(0.19, 0.26),
    new THREE.MeshBasicMaterial({ map: inspectionCard() })
  );
  card.position.set(8.05, 1.15, ROOM.wallZ + 0.1);
  group.add(card);
  box(0.014, 0.03, 0.012, M.metal, 8.05, 1.29, ROOM.wallZ + 0.095, group, false);

  // 右墙顶部双头应急照明灯
  box(0.06, 0.1, 0.3, M.whiteSteel, 8.88, 2.72, 0.55, group, false);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xdff3ff, emissiveIntensity: 1.4, roughness: 0.4
  });
  [-1, 1].forEach(s => {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 14), lampMat);
    head.rotation.z = Math.PI / 2;
    head.rotation.x = s * 0.45;
    head.position.set(8.84, 2.66, 0.55 + s * 0.1);
    group.add(head);
  });
  box(0.02, 0.02, 0.05, M.green, 8.85, 2.685, 0.55, group, false);

  // 右墙脚疏散指示（绿底白字，朝房间内）
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.17),
    new THREE.MeshBasicMaterial({ map: evacSign() })
  );
  sign.rotation.y = -Math.PI / 2;
  sign.position.set(8.9, 0.42, -0.75);
  group.add(sign);
}

/* ---------- 右侧小机柜：测试用交换机 / 路由器 + 规范布线 ---------- */
function networkRack(group, cx, cz) {
  const H = 1.5, w = 0.62, d = 0.5;
  const front = cx - d / 2;                        // 正面朝 -x
  const postX = [cx - d / 2 + 0.035, cx + d / 2 - 0.035];
  const postZ = [cz - w / 2 + 0.035, cz + w / 2 - 0.035];

  // 底座 / 顶盖 / 四立柱
  box(d + 0.02, 0.05, w + 0.02, M.paint, cx, 0.025, cz, group);
  box(d + 0.02, 0.05, w + 0.02, M.paint, cx, H - 0.025, cz, group);
  postX.forEach(px => postZ.forEach(pz => box(0.045, H, 0.045, M.frame, px, H / 2, pz, group, false)));

  // 靠墙侧封板
  box(0.02, H - 0.12, w - 0.06, M.paint, cx + d / 2 - 0.03, H / 2, cz, group, false);

  // 设备：路由器 / 交换机 ×2 / 配线架 / PDU
  const faceX = front + 0.02;
  const devDefs = [
    [1.33, 'router'], [1.16, 'switch'], [0.99, 'switch'], [0.82, 'patch'], [0.65, 'pdu']
  ];
  const ledMats = [
    new THREE.MeshBasicMaterial({ color: 0x62f59a }),
    new THREE.MeshBasicMaterial({ color: 0x4fd2ff }),
    new THREE.MeshBasicMaterial({ color: 0xffb547 })
  ];
  const leds = [];

  devDefs.forEach(([y, kind], di) => {
    const dw = kind === 'pdu' ? 0.38 : 0.5;
    const dh = kind === 'pdu' ? 0.06 : 0.08;
    box(0.36, dh, dw, M.paint, cx - 0.06, y, cz, group);
    box(0.012, dh - 0.018, dw - 0.03, M.black, faceX - 0.004, y, cz, group, false);

    const ports = kind === 'pdu' ? 5 : 8;
    for (let i = 0; i < ports; i++) {
      const pz = cz - dw / 2 + 0.055 + i * ((dw - 0.11) / (ports - 1));
      box(0.008, dh * 0.42, 0.032, M.frame, faceX - 0.012, y - dh * 0.12, pz, group, false);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.012), ledMats[i % 3]);
      led.position.set(faceX - 0.02, y + dh * 0.24, pz);
      led.userData.phase = (i * 0.37 + di * 0.51) % 1;
      led.userData.rate = 1.1 + ((i + di) % 4) * 0.7;
      group.add(led);
      leds.push(led);
    }
  });

  // 左右垂直理线环（走线固定于此）
  [-1, 1].forEach(s => {
    for (let k = 0; k < 6; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 6, 12), M.frame);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(front + 0.045, 0.66 + k * 0.15, cz + s * (w / 2 - 0.05));
      group.add(ring);
    }
  });

  const cat6 = new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.65 });
  const fiberMat = new THREE.MeshStandardMaterial({
    color: 0xe6b93b, roughness: 0.45, emissive: 0x3a2a00, emissiveIntensity: 0.7
  });
  const flows = [];

  const cable = (pts, mat, r = 0.0055) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, r, 5, false), mat);
    tube.castShadow = false;
    group.add(tube);
    return curve;
  };

  // 配线架 → 交换机：左侧理线环内垂直走线，弯半径统一
  for (let i = 0; i < 5; i++) {
    const ty = i < 3 ? 1.16 : 0.99;
    cable([
      [faceX - 0.02, 0.84, cz - 0.16 + i * 0.08],
      [front + 0.01, 0.855, cz - 0.19 + i * 0.04],
      [front + 0.05, 0.9, cz - 0.26],
      [front + 0.05, ty + 0.02, cz - 0.26],
      [front + 0.02, ty, cz - 0.18 + i * 0.02],
      [faceX - 0.03, ty, cz - 0.13 + i * 0.045]
    ], cat6);
  }

  // 路由器 ↔ 交换机：右侧走黄色光纤跳线，带数据流光点
  for (let i = 0; i < 3; i++) {
    const ty = i === 2 ? 0.99 : 1.16;
    const curve = cable([
      [faceX - 0.02, 1.33, cz + 0.16 + i * 0.03],
      [front + 0.01, 1.345, cz + 0.19 + i * 0.02],
      [front + 0.05, 1.31, cz + 0.26],
      [front + 0.05, (1.33 + ty) / 2, cz + 0.285],
      [front + 0.05, ty + 0.02, cz + 0.26],
      [front + 0.02, ty, cz + 0.19 + i * 0.03],
      [faceX - 0.03, ty, cz + 0.16 + i * 0.03]
    ], fiberMat, 0.0045);

    for (let k = 0; k < 2; k++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 6, 5),
        new THREE.MeshBasicMaterial({ color: 0xaef0ff })
      );
      group.add(dot);
      flows.push({ dot, curve, offset: (k * 0.5 + i * 0.17) % 1, speed: 0.16 + i * 0.03 });
    }
  }

  // 告警端口：右上交换机第 6 口，点击机柜时高亮闪烁
  const alarmMat = new THREE.MeshBasicMaterial({ color: 0xb0231c });
  const alarmPort = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.034, 0.034), alarmMat);
  alarmPort.position.set(faceX - 0.018, 1.165, cz + 0.14);
  group.add(alarmPort);

  const alarmHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.11),
    new THREE.MeshBasicMaterial({
      color: 0xff3b30, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    })
  );
  alarmHalo.rotation.y = -Math.PI / 2;
  alarmHalo.position.set(faceX - 0.03, 1.165, cz + 0.14);
  group.add(alarmHalo);

  let alarmT = 0;
  function highlightAlarm() { alarmT = 4.5; }

  function update(t, dt = 0.016) {
    for (let i = 0; i < leds.length; i++) {
      const l = leds[i];
      l.visible = Math.sin(t * l.userData.rate * 3.4 + l.userData.phase * 12) > -0.35;
    }
    flows.forEach(f => {
      f.dot.position.copy(f.curve.getPointAt((t * f.speed + f.offset) % 1));
    });

    // 告警端口：常态暗红，触发后红白闪烁 4.5s
    alarmT = Math.max(0, alarmT - dt);
    const blink = Math.sin(t * 16) > -0.1;
    alarmMat.color.setHex(alarmT > 0 ? (blink ? 0xff5a5a : 0x3a0d0d) : 0xb0231c);
    alarmHalo.material.opacity = alarmT > 0 ? (blink ? 0.55 : 0.1) : 0;
    alarmHalo.scale.setScalar(1 + (alarmT > 0 ? Math.abs(Math.sin(t * 8)) * 0.25 : 0));
  }

  return { update, highlightAlarm };
}

/* ---------- 右侧：应急值班工位区 ---------- */
function emergencyArea(group) {
  const x = 8.0, zc = 2.25, len = 3.7;

  // 靠右墙通长操作台
  box(0.95, 0.07, len, M.desk, x, 0.74, zc, group);
  box(0.06, 0.7, len - 0.12, M.deskDark, x + 0.43, 0.35, zc, group);
  box(0.86, 0.05, len - 0.1, M.black, x, 0.7, zc, group, false);

  // 三席：键盘 + 网椅（椅背朝外、面向操作台）
  [-1.15, 0, 1.15].forEach(oz => {
    box(0.15, 0.02, 0.42, M.black, x - 0.16, 0.785, zc + oz, group, false);

    const c = meshChair();
    c.position.set(x - 0.68, 0, zc + oz);
    c.rotation.y = Math.PI / 2;
    group.add(c);
  });

  // 台面小水牌：置于台面左上角（靠墙一侧），微微倾斜，文字朝房间内侧
  const plateG = new THREE.Group();
  plateG.position.set(x + 0.14, 0.816, zc - 1.42);
  plateG.rotation.y = -Math.PI / 2;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.19),
    new THREE.MeshBasicMaterial({ map: plateTexture('应急值班工位', '#ffb547'), transparent: true })
  );
  plate.rotation.x = -Math.PI / 2 + 0.34;
  plateG.add(plate);
  group.add(plateG);

  // 右墙：单块横屏网络安全攻击态势（16:9，实时动效）
  const scr = attackScreen();
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(2.42, 1.36),
    new THREE.MeshBasicMaterial({ map: scr.texture })
  );
  board.rotation.y = -Math.PI / 2;
  board.position.set(8.83, 2.02, zc);
  board.userData.info = { key: 'secwall', title: '网络安全攻击态势 · 实时大屏', full: true };
  group.add(board);
  box(0.06, 1.46, 2.52, M.frame, 8.87, 2.02, zc, group, false);

  // 右侧小机柜（测试用交换机 / 路由器）
  const rack = networkRack(group, 8.62, 4.48);

  // 机柜点击区：高亮告警端口并弹出端口面板
  const rackHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 1.7, 0.72),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  rackHit.position.set(8.58, 0.85, 4.48);
  rackHit.userData.info = {
    key: 'rack', title: '网络机柜 · 端口状态',
    onClick: () => rack.highlightAlarm()
  };
  group.add(rackHit);

  group.userData.updateWallScreen = scr.update;
  group.userData.updateNet = rack.update;
}


/* ---------- 房间主体 ---------- */
export function buildRoom(scene) {
  const g = new THREE.Group();
  scene.add(g);

  // 地面
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w, ROOM.d),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.32, metalness: 0.06 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // 吊顶
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w, ROOM.d),
    new THREE.MeshStandardMaterial({ map: ceilingTexture(), roughness: 0.9, side: THREE.DoubleSide })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = ROOM.h;
  g.add(ceil);

  // 墙体
  // 前墙：左侧留出机房门洞（门后接健身房），其余为整墙
  box(0.35, ROOM.h, 0.18, M.wall, -8.825, ROOM.h / 2, ROOM.wallZ - 0.09, g, false);
  box(15.55, ROOM.h, 0.18, M.wall, 1.225, ROOM.h / 2, ROOM.wallZ - 0.09, g, false);
  box(2.1, 0.93, 0.18, M.wall, -7.6, 2.885, ROOM.wallZ - 0.09, g, false);
  box(0.18, ROOM.h, ROOM.d, M.wall, -ROOM.w / 2, ROOM.h / 2, 0, g, false);
  box(0.18, ROOM.h, ROOM.d, M.wall, ROOM.w / 2, ROOM.h / 2, 0, g, false);

  // 后墙：中间开洞给玻璃隔断（宽 11.4，左右各延伸一扇平开门）
  box(3.3, ROOM.h, 0.18, M.wallDim, -7.35, ROOM.h / 2, 5.5, g, false);
  box(3.3, ROOM.h, 0.18, M.wallDim, 7.35, ROOM.h / 2, 5.5, g, false);
  box(11.4, 0.79, 0.18, M.wallDim, 0, 2.955, 5.5, g, false);

  // 白梁
  [-2.4, 1.0, 4.0].forEach(z => box(ROOM.w, 0.16, 0.34, M.wallDim, 0, ROOM.h - 0.08, z, g, false));

  // 线性灯
  [-3.75, -1.55, 0.65, 2.85, 4.6].forEach(z => {
    box(13.6, 0.035, 0.14, M.light, 0, ROOM.h - 0.05, z, g, false);
  });
  // 筒灯
  for (let i = -3; i <= 3; i++) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), M.light);
    d.position.set(i * 2.4, ROOM.h - 0.02, 4.9);
    g.add(d);
  }

  // 消防器材（仅大屏右下角一处）、大屏两侧墙角挂墙音响
  fireExtinguisher(g);
  wallSpeaker(g, -7.9);
  wallSpeaker(g, 7.9);
  emergencySigns(g);

  // 机房门 / 玻璃门
  machineDoor(g);
  glassDoors(g);

  // 门前圣诞树（不高，仅作点缀）
  christmasTree(g, -8.4, -4.4);

  // 左墙后侧：防暴器材整齐挂放
  riotGear(g, -8.9, 3.9);

  // 地台与三台控制台（左 / 中 / 右，各 3 席）
  const people = [];
  screenPlinth(g);
  consoleDesk(g, -5.0, { label: '指挥控制台 A', monitors: 3, people });
  consoleDesk(g, 0, { label: '指挥控制台 B', monitors: 3, people });
  consoleDesk(g, 5.0, { label: '主控台 · 值班长', monitors: 4, engineers: true, people });

  // 右侧应急值班工位区
  emergencyArea(g);

  // 特级保镖猫：在大厅不定位置爬行 / 站立 / 走动
  const cat = catWorker();
  cat.position.set(-6.6, 0, 3.5);
  g.add(cat);
  people.push(cat);

  g.userData.people = people;

  // 透明点击区（不参与渲染，仅用于射线拾取）
  const hit = (w, h, d, x, y, z, info) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    m.position.set(x, y, z);
    m.userData.info = info;
    g.add(m);
  };
  hit(4.6, 1.1, 1.7, -5.0, 0.55, -1.9, { key: 'desk', title: '左侧控制台 · 值班监控' });
  hit(4.6, 1.1, 1.7, 0, 0.55, -1.9, { key: 'desk', title: '中间控制台 · 安播与网络安全' });
  hit(4.6, 1.1, 1.7, 5.0, 0.55, -1.9, { key: 'desk', title: '主控台 · 值班长席（4 屏）' });
  hit(1.8, 1.2, 3.9, 7.5, 0.6, 2.25, { key: 'side', title: '应急值班工位 · 机动处置' });
  hit(1.8, 2.5, 0.4, -7.65, 1.25, -5.1, { key: 'door', title: '机房门 · 健身房' });
  hit(0.9, 2.4, 2.7, -8.6, 1.2, 3.9, {
    key: 'riotgear',
    tag: 'RIOT GEAR',
    title: '防暴器材架 · 应急处置',
    rows: [
      ['防暴盾牌', '2 面 · 透明 PC 板 · 双握把', 'ok'],
      ['防暴叉', '1 支 · 不锈钢杆 · U 形叉头', 'ok'],
      ['警棍', '3 支 · 伸缩式 · 带卡箍', 'ok'],
      ['防弹衣', '2 件 · IIIA 级 · 前后插板', 'ok'],
      ['防暴头盔', '2 顶 · 面罩可翻起', 'ok'],
      ['检查周期', '每月 1 日清点 · 值班长签字'],
      ['取用规则', '突发处置时取用，事后 24h 内归位登记']
    ],
    note: '器材靠左墙后侧整齐挂放，取用通道保持畅通；缺失或损坏须当班上报。'
  });
  hit(11.2, 2.5, 0.5, 0, 1.3, 5.15, {
    key: 'glassdoor',
    tag: 'GLASS DOOR',
    title: '玻璃隔断 · 自动感应门',
    rows: [
      ['类型', '12mm 钢化玻璃双扇平移门 · 无框点支'],
      ['开洞', '净宽 7.4m · 净高 2.6m'],
      ['感应', '人体靠近 1.2m 内自动开启，延时 4s 关闭'],
      ['防夹', '光幕防夹 + 断电自动释放，可手动推开'],
      ['标识', '腰线磨砂带 · 人民监控为人民'],
      ['提示', '玻璃隔断后为健身房区域，非工作人员请勿入内']
    ],
    note: '门体由场景内感应逻辑驱动，靠近自动开合，不需要刷卡或按按钮。'
  });

  // 门后健身房：器材 / 电竞区 / 训练角色
  buildGym(g, hit);

  /* 处置反馈总线：主控台灯带 + 主控台屏幕，由模拟处置动作驱动 */
  const mainLamp = g.userData.mainLamp || null;
  const mainFaces = [];
  g.traverse(o => {
    if (o.userData.monitorIndex >= 6 && o.userData.monitorIndex <= 9) mainFaces.push(o);
  });
  const feedback = {
    t: 0,
    type: '',
    pulse(type) {
      this.type = type || 'ack';
      this.t = 2.8;
    },
    update(t, dt) {
      this.t = Math.max(0, this.t - dt);
      const busy = this.t > 0;
      const k = 0.5 + 0.5 * Math.sin(t * 11);
      if (mainLamp) {
        mainLamp.emissive.setHex(busy ? 0xffb547 : 0x2f9fc9);
        mainLamp.emissiveIntensity = busy ? 1.1 + k * 1.7 : 0.5;
      }
      // 处置期间主控台桌面屏整体转冷青色调，等同切换到处置画面
      mainFaces.forEach(f => {
        if (f.material) f.material.color.setHex(busy ? 0xa8e4ff : 0xffffff);
      });
    }
  };
  g.userData.feedback = feedback;

  return g;
}

/* ---------- 显示器贴图绑定 ---------- */
export function applyMonitorTextures(group, textures) {
  const faces = [];
  group.traverse(o => { if (o.userData.monitorIndex !== undefined) faces.push(o); });
  faces.sort((a, b) => a.userData.monitorIndex - b.userData.monitorIndex);
  faces.forEach((f, i) => {
    f.material = new THREE.MeshBasicMaterial({ map: textures[i % textures.length] });
  });
}
