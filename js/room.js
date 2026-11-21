import * as THREE from '../vendor/three.module.min.js';
import { floorTexture, ceilingTexture, plateTexture, perfPanelTexture, glassBandTexture } from './textures.js';

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
  for (let i = 0; i < 5; i++) {
    const arm = box(0.06, 0.035, 0.34, M.frame, 0, 0.1, 0.14, g);
    arm.rotation.y = (Math.PI * 2 / 5) * i;
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M.frame);
    wheel.position.set(Math.sin(arm.rotation.y) * 0.32, 0.045, Math.cos(arm.rotation.y) * 0.32);
    wheel.castShadow = true;
    g.add(wheel);
  }
  const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.26, 10), M.metal);
  lift.position.y = 0.24; lift.castShadow = true; g.add(lift);

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

/* ---------- 高级猫工：戴卡其帽、背红书包的橘白猫 NPC ---------- */
function catWorker() {
  const g = new THREE.Group();
  const parts = {};
  const fur = new THREE.MeshStandardMaterial({ color: 0xe0a052, roughness: 0.9 });
  const furLight = new THREE.MeshStandardMaterial({ color: 0xf3e3cd, roughness: 0.92 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xe08a92, roughness: 0.7 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x8b7c58, roughness: 0.85 });
  const capDark = new THREE.MeshStandardMaterial({ color: 0x74663f, roughness: 0.85 });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.7 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.8 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x201a14, roughness: 0.4 });

  // 双腿 + 猫爪（补全下半身）
  [-1, 1].forEach(s => {
    const leg = new THREE.Group();
    leg.position.set(s * 0.085, 0.42, 0);
    g.add(leg);
    box(0.09, 0.22, 0.1, furLight, 0, -0.1, 0, leg);
    box(0.085, 0.2, 0.095, fur, 0, -0.3, 0, leg);
    box(0.105, 0.055, 0.155, furLight, 0, -0.41, 0.03, leg);
    if (s < 0) parts.legL = leg; else parts.legR = leg;
  });

  // 身体 + 白肚皮
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 14), fur);
  body.position.y = 0.57;
  body.scale.set(1, 1.18, 0.86);
  body.castShadow = true;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), furLight);
  belly.position.set(0, 0.55, 0.08);
  belly.scale.set(0.84, 1.05, 0.6);
  g.add(belly);

  // 头（可左右张望）
  const head = new THREE.Group();
  head.position.set(0, 0.86, 0);
  g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 16), fur);
  skull.scale.set(1, 0.94, 0.96);
  skull.castShadow = true;
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 10), furLight);
  muzzle.position.set(0, -0.03, 0.115);
  muzzle.scale.set(1.15, 0.8, 0.7);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 6), noseMat);
  nose.position.set(0, 0.008, 0.185);
  head.add(nose);
  [-1, 1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.027, 10, 8), eyeMat);
    eye.position.set(s * 0.062, 0.032, 0.132);
    head.add(eye);
    // 耳朵
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.12, 6), fur);
    ear.position.set(s * 0.1, 0.13, -0.005);
    ear.rotation.z = -s * 0.22;
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 6), noseMat);
    inner.position.set(s * 0.1, 0.125, 0.022);
    inner.rotation.z = -s * 0.22;
    head.add(inner);
    // 胡须
    [0.02, -0.012].forEach((y, i) => {
      const w = box(0.09, 0.006, 0.006, furLight, s * 0.1, -0.01 + y, 0.15, head, false);
      w.rotation.z = s * (i ? -0.16 : 0.1);
    });
  });

  // 卡其帽
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.163, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    capMat
  );
  crown.position.y = 0.1;
  head.add(crown);
  const brim = box(0.3, 0.02, 0.145, capDark, 0, 0.1, 0.13, head, false);
  brim.rotation.x = 0.1;
  parts.head = head;

  // 红书包 + 双肩带
  box(0.24, 0.29, 0.15, bagMat, 0, 0.6, -0.19, g);
  box(0.245, 0.06, 0.16, capDark, 0, 0.745, -0.19, g, false);
  box(0.07, 0.045, 0.02, strapMat, 0, 0.66, -0.27, g, false);
  [-1, 1].forEach(s => {
    box(0.035, 0.3, 0.03, strapMat, s * 0.1, 0.67, -0.055, g, false);
    box(0.035, 0.16, 0.03, strapMat, s * 0.115, 0.6, 0.1, g, false);
  });

  // 两只前爪抓着书包带
  [-1, 1].forEach(s => {
    const arm = new THREE.Group();
    arm.position.set(s * 0.185, 0.68, 0.02);
    g.add(arm);
    box(0.07, 0.22, 0.08, fur, 0, -0.1, 0.03, arm);
    box(0.085, 0.075, 0.09, furLight, 0, -0.225, 0.075, arm);
    if (s < 0) parts.armL = arm; else parts.armR = arm;
  });

  // 尾巴（三节上翘）
  const tail = new THREE.Group();
  tail.position.set(0, 0.52, -0.15);
  g.add(tail);
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.2, 8), fur);
  t1.position.set(0, 0.02, -0.1); t1.rotation.x = 1.0;
  tail.add(t1);
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.18, 8), fur);
  t2.position.set(0, 0.14, -0.21); t2.rotation.x = 0.55;
  tail.add(t2);
  const t3 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), furLight);
  t3.position.set(0, 0.23, -0.24);
  tail.add(t3);
  parts.tail = tail;

  g.userData.parts = parts;
  g.userData.kind = 'cat';
  g.userData.wander = {
    speed: 0.72,
    wait: 1.2,
    target: new THREE.Vector3(-3.6, 0, 4.2),
    points: [[-7.0, 3.3], [-3.6, 4.2], [0.4, 4.25], [3.6, 4.0], [5.9, 3.0],
      [6.4, 1.0], [4.6, -0.3], [1.0, -1.0], [-1.6, 1.2], [-4.6, 1.9],
      [-6.8, -0.3], [-7.4, 1.8]]
  };
  return g;
}

/* 绿植（机房门口） */
function pottedPlant(group, x, z) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.34, 14), new THREE.MeshStandardMaterial({ color: 0x8d8f90, roughness: 0.85 }));
  pot.position.set(x, 0.17, z);
  pot.castShadow = true;
  group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b3f, roughness: 0.9 });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.62, 6), leafMat);
    const a = (Math.PI * 2 / 7) * i;
    leaf.position.set(x + Math.cos(a) * 0.1, 0.62, z + Math.sin(a) * 0.1);
    leaf.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
    leaf.castShadow = true;
    group.add(leaf);
  }
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), leafMat);
  bush.position.set(x, 0.52, z);
  group.add(bush);
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

  // 席位牌
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.21),
    new THREE.MeshBasicMaterial({
      map: plateTexture(label, engineers ? '#ffb547' : '#3fd0ff'),
      transparent: true
    })
  );
  plate.rotation.x = -Math.PI / 2 + 0.2;
  plate.position.set(cx, h + 0.115, cz + 0.28);
  group.add(plate);

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
  }
}

/* ---------- 前墙左侧：机房门（白色穿孔板墙面 + 双开白钢门） ---------- */
function machineDoor(group) {
  const x = -7.6, z = ROOM.wallZ + 0.02;

  // 穿孔金属吸音板墙面
  box(2.2, 3.02, 0.08, M.perf, x, 1.52, z - 0.03, group, false);

  // 白色门套
  box(2.06, 2.38, 0.15, M.whiteSteel, x, 1.19, z + 0.02, group);
  box(1.96, 2.28, 0.03, M.wallDim, x, 1.16, z + 0.1, group, false);

  // 双开门扇（现场为整片白钢板门，无观察窗）
  [-0.47, 0.47].forEach((ox, i) => {
    box(0.94, 2.24, 0.055, M.whiteSteel, x + ox, 1.14, z + 0.135, group);
    box(0.9, 0.02, 0.02, M.deskDark, x + ox, 0.06, z + 0.165, group, false);
    box(0.9, 0.02, 0.02, M.deskDark, x + ox, 2.26, z + 0.165, group, false);
    if (i === 0) {
      // 左扇合页
      [0.55, 1.35, 2.05].forEach(h => {
        box(0.1, 0.16, 0.09, M.steel, x - 0.93, h, z + 0.15, group, false);
      });
    }
  });

  // 两个蓝色圆形拉手
  [[0.12, 1.02], [0.3, 1.0]].forEach(([ox, oy]) => {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 16), M.knob);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x + ox, oy, z + 0.18);
    knob.castShadow = true;
    group.add(knob);
  });

  // 顶部闭门器
  box(0.46, 0.055, 0.09, M.metal, x - 0.54, 2.3, z + 0.18, group, false);
}

/* ---------- 后墙：玻璃隔断 + 中间双扇自动门 ---------- */
function glassDoors(group) {
  const z = 5.42, W = 7.4, H = 2.5, base = 0.05;

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
  [-3.7, -1.85, 0, 1.85, 3.7].forEach(x => box(0.08, H, 0.15, M.steel, x, base + H / 2, z, group, false));
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

/* ---------- 右侧：应急值班工位区（保留区域，避免大厅空荡） ---------- */
function emergencyArea(group) {
  const x = 8.0, zc = 2.25, len = 3.7;

  // 靠右墙通长操作台
  box(0.95, 0.07, len, M.desk, x, 0.74, zc, group);
  box(0.06, 0.7, len - 0.12, M.deskDark, x + 0.43, 0.35, zc, group);
  box(0.86, 0.05, len - 0.1, M.black, x, 0.7, zc, group, false);

  // 席位牌
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.24),
    new THREE.MeshBasicMaterial({ map: plateTexture('应急值班工位', '#ffb547'), transparent: true })
  );
  plate.rotation.y = -Math.PI / 2;
  plate.position.set(x - 0.5, 0.84, zc + 1.45);
  group.add(plate);

  // 三席：显示器 + 键盘 + 网椅（面向 +x）
  [-1.15, 0, 1.15].forEach((oz, i) => {
    const m = new THREE.Group();
    m.position.set(x - 0.3, 0.74 + 0.13 + 0.19, zc + oz);
    m.rotation.y = -Math.PI / 2;
    box(0.66, 0.38, 0.04, M.frame, 0, 0, 0, m);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.61, 0.33),
      new THREE.MeshBasicMaterial({ color: 0x0d1a26 })
    );
    face.position.z = 0.022;
    face.userData.monitorIndex = 12 + i;
    m.add(face);
    box(0.05, 0.1, 0.05, M.metal, 0, -0.24, -0.01, m);
    group.add(m);

    box(0.15, 0.02, 0.42, M.black, x - 0.16, 0.785, zc + oz, group, false);

    const c = meshChair();
    c.position.set(x - 0.68, 0, zc + oz);
    c.rotation.y = -Math.PI / 2;
    group.add(c);
  });

  // 右墙挂装监控板
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.2), new THREE.MeshBasicMaterial({ color: 0x0b1620 }));
  board.rotation.y = -Math.PI / 2;
  board.position.set(8.9, 1.95, zc - 0.2);
  board.userData.monitorIndex = 15;
  group.add(board);
  box(2.24, 1.34, 0.06, M.frame, 8.95, 1.95, zc - 0.2, group, false);

  // 机柜 / 打印机
  box(0.62, 1.55, 0.62, M.paint, x + 0.05, 0.775, zc + 2.5, group);
  box(0.5, 0.05, 0.5, M.metal, x + 0.05, 1.57, zc + 2.5, group, false);
  box(0.52, 0.42, 0.46, M.desk, x - 0.25, 0.95, zc - 2.45, group);
  box(0.24, 0.03, 0.34, M.black, x - 0.25, 1.17, zc - 2.45, group, false);
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
  box(ROOM.w, ROOM.h, 0.18, M.wall, 0, ROOM.h / 2, ROOM.wallZ - 0.09, g, false);
  box(0.18, ROOM.h, ROOM.d, M.wall, -ROOM.w / 2, ROOM.h / 2, 0, g, false);
  box(0.18, ROOM.h, ROOM.d, M.wall, ROOM.w / 2, ROOM.h / 2, 0, g, false);

  // 后墙：中间开洞给玻璃隔断（宽 7.4）
  box(5.3, ROOM.h, 0.18, M.wallDim, -6.35, ROOM.h / 2, 5.5, g, false);
  box(5.3, ROOM.h, 0.18, M.wallDim, 6.35, ROOM.h / 2, 5.5, g, false);
  box(7.4, 0.79, 0.18, M.wallDim, 0, 2.955, 5.5, g, false);

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

  // 消防器材、扬声器
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.46, 14), M.red);
  ext.position.set(8.75, 0.72, -3.2); ext.castShadow = true; g.add(ext);
  box(0.03, 0.3, 0.12, M.black, 8.86, 1.55, -3.2, g, false);
  box(0.26, 0.2, 0.16, M.black, 8.85, 2.62, -3.0, g, false);

  // 机房门 / 玻璃门
  machineDoor(g);
  glassDoors(g);

  // 绿植（机房门旁、后门旁）
  pottedPlant(g, -8.35, -4.5);
  pottedPlant(g, 8.35, 4.55);

  // 地台与三台控制台（左 / 中 / 右，各 3 席）
  const people = [];
  screenPlinth(g);
  consoleDesk(g, -5.0, { label: '指挥控制台 A', monitors: 3, people });
  consoleDesk(g, 0, { label: '指挥控制台 B', monitors: 3, people });
  consoleDesk(g, 5.0, { label: '主控台 · 值班长', monitors: 4, engineers: true, people });

  // 右侧应急值班工位区
  emergencyArea(g);

  // 高级猫工：在大厅不定位置走动
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
  hit(2.2, 2.5, 0.5, -7.6, 1.25, -5.1, { key: 'door', title: '机房门 · 核心设备区' });
  hit(7.2, 2.5, 0.5, 0, 1.3, 5.15, { key: 'glassdoor', title: '玻璃隔断 · 自动感应门' });

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
