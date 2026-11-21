import * as THREE from '../vendor/three.module.min.js';
import { mosaicTexture, dashTexture, ledTexture } from './textures.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function texture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function infoBarTexture() {
  const c = canvas(1024, 128), x = c.getContext('2d');
  x.fillStyle = '#061019'; x.fillRect(0, 0, 1024, 128);
  x.strokeStyle = 'rgba(63,208,255,.35)'; x.lineWidth = 2;
  x.strokeRect(3, 3, 1018, 122);
  x.fillStyle = '#3fd0ff'; x.font = 'bold 30px "Microsoft YaHei",sans-serif';
  x.fillText('全市末端 386 个  ·  在线率 100%  ·  信源 12 路  ·  今日计划操作 2 项', 26, 56);
  x.fillStyle = 'rgba(150,185,210,.75)'; x.font = '22px "Microsoft YaHei",sans-serif';
  x.fillText('数字电视平台 / 高清互动平台 / 镇街节目  ·  监测正常', 26, 98);
  return texture(c);
}

export function buildScreens(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const wallZ = -5.38;
  const W = 13.0, H = 2.45, yc = 1.85;

  // 大屏背板与边框
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.34, H + 0.34, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x0b0e11, roughness: 0.55, metalness: 0.3 })
  );
  back.position.set(0, yc, wallZ - 0.03);
  back.castShadow = true;
  group.add(back);

  // 拼接屏内容
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: mosaicTexture() })
  );
  screen.position.set(0, yc, wallZ + 0.05);
  group.add(screen);

  // LED 条
  const led = ledTexture();
  const ledMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(13.0, 0.2),
    new THREE.MeshBasicMaterial({ map: led })
  );
  ledMesh.position.set(0, 3.19, wallZ + 0.06);
  group.add(ledMesh);

  // 中部三块可交互业务屏
  const dashboards = [];
  const defs = [
    { kind: 'bc', x: 1.9, title: '安全播出' },
    { kind: 'sec', x: 3.1, title: '网络安全' },
    { kind: 'net', x: 4.3, title: '网络拓扑' }
  ];
  defs.forEach((d, i) => {
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x0a1118 });
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.66), frameMat);
    frame.position.set(d.x, 2.52, wallZ + 0.075);
    group.add(frame);

    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 0.62),
      new THREE.MeshBasicMaterial({ map: dashTexture(d.kind) })
    );
    m.position.set(d.x, 2.52, wallZ + 0.085);
    m.userData.info = { key: d.kind, title: d.title + ' · 大屏分区' };
    m.userData.frame = frame;
    group.add(m);
    dashboards.push(m);
  });

  // 大屏下方信息条
  const bar = new THREE.Mesh(
    new THREE.PlaneGeometry(3.66, 0.46),
    new THREE.MeshBasicMaterial({ map: infoBarTexture() })
  );
  bar.position.set(3.1, 1.52, wallZ + 0.075);
  bar.userData.info = { key: 'wall', title: '视频墙 · 全市监测' };
  group.add(bar);
  dashboards.push(bar);

  // 整墙也可点击
  screen.userData.info = { key: 'wall', title: '视频墙 · 全市监测' };
  screen.userData.isWall = true;

  return { group, screen, dashboards, ledTexture: led, wallZ };
}
