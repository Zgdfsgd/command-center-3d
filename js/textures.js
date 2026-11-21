import * as THREE from '../vendor/three.module.min.js';

/* ---------- 基础工具 ---------- */
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function tex(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeatX !== 1 || repeatY !== 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
  }
  return t;
}
function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const FONT = '"Microsoft YaHei","PingFang SC",sans-serif';

/* ---------- 地面：浅色地砖 ---------- */
export function floorTexture() {
  const c = canvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#eef1f3'; x.fillRect(0, 0, 512, 512);
  const r = rnd(7);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const g = 238 + Math.floor(r() * 10);
    x.fillStyle = `rgb(${g},${g + 1},${g + 3})`;
    x.fillRect(i * 256 + 2, j * 256 + 2, 252, 252);
    for (let k = 0; k < 60; k++) {
      x.fillStyle = `rgba(180,190,198,${r() * .10})`;
      x.fillRect(i * 256 + r() * 252, j * 256 + r() * 252, r() * 12 + 2, 1.2);
    }
  }
  x.strokeStyle = '#d3d9de'; x.lineWidth = 3;
  x.strokeRect(0, 0, 512, 512);
  x.beginPath(); x.moveTo(256, 0); x.lineTo(256, 512); x.moveTo(0, 256); x.lineTo(512, 256); x.stroke();
  return tex(c, 9, 5.5);
}

/* ---------- 吊顶：格栅 ---------- */
export function ceilingTexture() {
  const c = canvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#c9ced3'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 512; i += 16) {
    x.fillStyle = '#9aa2aa'; x.fillRect(i, 0, 5, 512);
    x.fillStyle = '#e2e6e9'; x.fillRect(i + 5, 0, 2, 512);
  }
  return tex(c, 6, 4);
}

/* ---------- 拼接大屏：左密排监控矩阵 + 中值班监视区 + 右白底业务页 ---------- */
function feed(ctx, x, y, w, h, r) {
  const bases = ['#131a20', '#161d23', '#1a2229', '#0f151a', '#1d242a'];
  const blocks = ['#2c3a45', '#3b4b57', '#54646f', '#6b7a84', '#89939a'];
  const accents = ['#c99a52', '#6fa8c4', '#c26b5e', '#7fb08c', '#b3b9bd'];
  ctx.fillStyle = bases[Math.floor(r() * bases.length)];
  ctx.fillRect(x, y, w, h);

  // 地面/背景块
  ctx.globalAlpha = .22 + r() * .2;
  ctx.fillStyle = blocks[Math.floor(r() * blocks.length)];
  ctx.fillRect(x, y + h * (.5 + r() * .2), w, h * .5);

  // 画面中的主体轮廓
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = .18 + r() * .42;
    ctx.fillStyle = r() < .25 ? accents[Math.floor(r() * accents.length)] : blocks[Math.floor(r() * blocks.length)];
    ctx.fillRect(x + r() * w * .7, y + r() * h * .7, w * (.12 + r() * .42), h * (.1 + r() * .45));
  }

  // 少量高光，模拟灯具/车灯/屏幕
  if (r() < .2) {
    ctx.globalAlpha = .55;
    ctx.fillStyle = accents[Math.floor(r() * accents.length)];
    ctx.fillRect(x + r() * w * .8, y + r() * h * .8, w * .08, h * .07);
  }
  ctx.globalAlpha = 1;
  if (r() < .05) {
    ctx.fillStyle = 'rgba(255,60,60,.9)';
    ctx.fillRect(x + 2, y + 2, 3, 3);
  }
}

export function mosaicTexture() {
  const W = 4096, H = 1024;
  const c = canvas(W, H), x = c.getContext('2d');
  const r = rnd(21);
  x.fillStyle = '#05080b'; x.fillRect(0, 0, W, H);

  // 左侧：密排监控矩阵（每格约 0.1m 宽，贴近实景密度）
  // 顶部预留固定标语带，矩阵从 y=116 开始
  const leftW = 2380, cw = 30, ch = 22, gap = 3, top = 116;
  for (let row = 0; top + row * (ch + gap) + ch <= H; row++) {
    for (let col = 0; col * (cw + gap) + cw <= leftW; col++) {
      feed(x, col * (cw + gap) + 2, top + row * (ch + gap) + 2, cw, ch, r);
    }
  }

  // 中部：值班监视区
  const mx = 2404, mw = 1188;
  x.fillStyle = '#070d13'; x.fillRect(mx, 0, mw, H);
  x.strokeStyle = 'rgba(70,120,160,.10)'; x.lineWidth = 1;
  for (let i = 0; i < mw; i += 40) { x.beginPath(); x.moveTo(mx + i, 0); x.lineTo(mx + i, H); x.stroke(); }
  for (let i = 0; i < H; i += 40) { x.beginPath(); x.moveTo(mx, i); x.lineTo(mx + mw, i); x.stroke(); }

  // 顶部红色信息横幅
  x.fillStyle = '#7d1616'; x.fillRect(mx + 4, 8, mw - 8, 66);
  x.fillStyle = '#ffd9d9'; x.font = `bold 27px ${FONT}`;
  x.fillText('【安全播出】信源 12 路正常  ·  末端 386 个在线  ·  计划操作 22:00', mx + 18, 50);

  // 中部 KPI 卡片（位于三块业务屏与信息条之间）
  const kpis = [
    ['可用率', '99.99%', '#37d67a'], ['末端在线', '386 / 386', '#4fd2ff'],
    ['今日拦截', '1,284', '#ffb547'], ['待处置', '2 起', '#ff5a5a']
  ];
  kpis.forEach((k, i) => {
    const kx = mx + 10 + i * 296, ky = 382, kw = 288, kh = 138;
    x.fillStyle = 'rgba(12,24,34,.95)'; rr(x, kx, ky, kw, kh, 8); x.fill();
    x.strokeStyle = 'rgba(63,208,255,.22)'; x.lineWidth = 1.4; x.stroke();
    x.fillStyle = '#7e9cb2'; x.font = `16px ${FONT}`; x.fillText(k[0], kx + 18, ky + 34);
    x.fillStyle = k[2]; x.font = `bold 40px ${FONT}`; x.fillText(k[1], kx + 18, ky + 92);
    x.fillStyle = 'rgba(120,160,190,.55)'; x.font = `14px ${FONT}`; x.fillText('实时 · 正常', kx + 18, ky + 120);
  });

  // 下部告警流水（信息条下方）
  x.fillStyle = '#9fc2d8'; x.font = `bold 18px ${FONT}`;
  x.fillText('近期告警  /  处置状态', mx + 16, 786);
  const rows = [
    ['10:24:08', '南海 DS-03 光机', '光功率 -3.2dBm 低于门限', '已派单', '#ffb547'],
    ['10:23:51', '核心 CR-01', '出口流量突增 82%', '观察中', '#4fd2ff'],
    ['10:22:36', '高新 IDC 出口', '疑似端口扫描 203.0.113.44', '已封禁', '#37d67a'],
    ['10:21:02', '互动平台', 'EPG 响应 1.8s 超时', '已恢复', '#37d67a']
  ];
  rows.forEach((row, i) => {
    const ry = 800 + i * 52;
    x.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)';
    x.fillRect(mx + 10, ry, mw - 20, 44);
    x.font = `16px ${FONT}`;
    x.fillStyle = '#8fb0c6'; x.fillText(row[0], mx + 20, ry + 29);
    x.fillStyle = '#c2d6e4'; x.fillText(row[1], mx + 120, ry + 29);
    x.fillStyle = '#8ba4b6'; x.fillText(row[2], mx + 350, ry + 29);
    x.fillStyle = row[4]; x.fillText(row[3], mx + 1000, ry + 29);
  });

  // 右侧：白底业务页（2 列 × 3 行）
  const rx = 3628;
  const titles = ['传输网管', '动环监控', '信源监测', '互动平台', 'IDC 业务', '态势感知'];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const px = rx + col * 236, py = 6 + row * 340, pw = 228, ph = 330;
      x.fillStyle = '#f4f7fa'; x.fillRect(px, py, pw, ph);
      x.fillStyle = '#2a6fa8'; x.fillRect(px, py, pw, 28);
      x.fillStyle = '#fff'; x.font = `bold 15px ${FONT}`;
      x.fillText(titles[row * 2 + col], px + 10, py + 20);
      // 列表行
      for (let i = 0; i < 5; i++) {
        const ly = py + 38 + i * 34;
        x.fillStyle = i % 2 ? '#eef3f7' : '#e5edf3';
        x.fillRect(px + 6, ly, pw - 12, 28);
        x.fillStyle = i === 2 ? '#d9483f' : '#4a5f6e';
        x.fillRect(px + 10, ly + 11, 5, 6);
        x.fillStyle = '#63798a'; x.font = `12px ${FONT}`;
        x.fillText(['主链路 正常', '备用 正常', '端口 抖动', '温度 21.4℃', '告警 已确认'][i], px + 22, ly + 18);
        x.fillStyle = '#2f8fd0'; x.fillRect(px + pw - 52, ly + 9, 38, 10);
      }
      // 曲线
      x.strokeStyle = '#2f8fd0'; x.lineWidth = 2; x.beginPath();
      for (let i = 0; i <= 36; i++) {
        const vx = px + 8 + (pw - 16) * i / 36;
        const vy = py + 268 - Math.sin(i * .5 + row + col) * 22 - r() * 8;
        i ? x.lineTo(vx, vy) : x.moveTo(vx, vy);
      }
      x.stroke();
      x.fillStyle = '#6d8294'; x.font = `12px ${FONT}`;
      x.fillText('实时值  正常', px + 10, py + 312);
    }
  }

  // 拼接缝
  x.strokeStyle = 'rgba(0,0,0,.32)'; x.lineWidth = 2;
  for (let col = 1; col < 26; col++) {
    x.beginPath(); x.moveTo(col * 158, 0); x.lineTo(col * 158, H); x.stroke();
  }
  x.strokeStyle = 'rgba(0,0,0,.22)';
  for (let row = 1; row < 6; row++) {
    x.beginPath(); x.moveTo(0, row * 168); x.lineTo(W, row * 168); x.stroke();
  }

  // 左侧顶部：固定标语《人民监控为人民》（LED 滚动字幕下方，不随画面滚动）
  const bandH = 108;
  const grad = x.createLinearGradient(0, 0, leftW, 0);
  grad.addColorStop(0, '#4a0b0d');
  grad.addColorStop(0.5, '#7d1616');
  grad.addColorStop(1, '#4a0b0d');
  x.fillStyle = grad; x.fillRect(0, 0, leftW, bandH);
  x.fillStyle = '#c99a52';
  x.fillRect(0, 0, leftW, 2);
  x.fillRect(0, bandH - 2, leftW, 2);
  x.strokeStyle = 'rgba(230,190,120,.45)';
  x.lineWidth = 2;
  [48, 1544].forEach((sx, i) => {
    x.beginPath();
    x.moveTo(sx, bandH / 2);
    x.lineTo(i ? 2332 : 800, bandH / 2);
    x.stroke();
  });
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#ffd98a'; x.font = `30px ${FONT}`;
  x.fillText('★', 846, bandH / 2 + 2);
  x.fillText('★', 1534, bandH / 2 + 2);
  x.fillStyle = '#ffe3a3'; x.font = `bold 58px ${FONT}`;
  x.fillText('人民监控为人民', leftW / 2, bandH / 2 + 3);
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';

  return tex(c);
}

/* ---------- 中部可点击大屏 ---------- */
export function dashTexture(kind) {
  const W = 1024, H = 512;
  const c = canvas(W, H), x = c.getContext('2d');
  const r = rnd(kind === 'bc' ? 3 : kind === 'sec' ? 8 : 15);
  x.fillStyle = kind === 'sec' ? '#120d0b' : '#081018';
  x.fillRect(0, 0, W, H);

  // 网格
  x.strokeStyle = 'rgba(80,140,190,.13)'; x.lineWidth = 1;
  for (let i = 0; i < W; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 0; i < H; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }

  const accent = kind === 'sec' ? '#ff9a4a' : '#41c9ff';
  x.fillStyle = accent; x.font = `bold 24px ${FONT}`;
  const titles = { bc: '安全播出 · 业务链路', sec: '网络安全 · 实时态势', net: '城域数据网 · 链路负载' };
  x.fillText(titles[kind], 24, 40);
  x.fillStyle = 'rgba(160,195,220,.55)'; x.font = `13px ${FONT}`;
  x.fillText('CENTER ROOM  /  REAL-TIME', 24, 62);

  if (kind === 'bc') {
    const cols = ['信源', '数字电视平台', '高清互动', '播出末端'];
    cols.forEach((n, i) => {
      const bx = 34 + i * 240, by = 120;
      x.fillStyle = 'rgba(20,40,56,.9)'; rr(x, bx, by, 210, 280, 8); x.fill();
      x.strokeStyle = 'rgba(63,208,255,.35)'; x.stroke();
      x.fillStyle = '#cfe6f7'; x.font = `bold 17px ${FONT}`; x.fillText(n, bx + 16, by + 32);
      for (let k = 0; k < 4; k++) {
        const ok = !(kind === 'bc' && i === 1 && k === 0);
        x.fillStyle = 'rgba(120,160,190,.2)'; x.fillRect(bx + 16, by + 58 + k * 34, 178, 18);
        x.fillStyle = ok ? '#37d67a' : '#ff5a5a'; x.fillRect(bx + 16, by + 58 + k * 34, 6, 18);
        x.fillStyle = '#9db6ca'; x.font = `12px ${FONT}`;
        x.fillText(['主路 正常', '备路 正常', '端口 正常', '末级 正常'][k], bx + 30, by + 71 + k * 34);
      }
      x.fillStyle = '#37d67a'; x.font = `bold 26px ${FONT}`;
      x.fillText('99.99%', bx + 16, by + 235);
      x.fillStyle = '#7f95a8'; x.font = `12px ${FONT}`; x.fillText('可用率', bx + 16, by + 256);
      if (i < 3) {
        x.strokeStyle = 'rgba(63,208,255,.5)'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(bx + 214, by + 160); x.lineTo(bx + 234, by + 160); x.stroke();
      }
    });
  } else if (kind === 'sec') {
    const items = [['DDoS 攻击', '3.2 Gbps', '#ff5a5a'], ['非法扫描', '842 次', '#ffb547'],
      ['蠕虫病毒', '12 起', '#ffb547'], ['异常外联', '5 起', '#41c9ff']];
    items.forEach((it, i) => {
      const bx = 30 + i * 244;
      x.fillStyle = 'rgba(35,24,18,.9)'; rr(x, bx, 96, 224, 112, 8); x.fill();
      x.strokeStyle = 'rgba(255,154,74,.28)'; x.stroke();
      x.fillStyle = '#a98f7c'; x.font = `13px ${FONT}`; x.fillText(it[0], bx + 14, 122);
      x.fillStyle = it[2]; x.font = `bold 28px ${FONT}`; x.fillText(it[1], bx + 14, 162);
      x.fillStyle = 'rgba(255,154,74,.35)'; x.fillRect(bx + 14, 180, 196, 5);
      x.fillStyle = it[2]; x.fillRect(bx + 14, 180, 60 + i * 28, 5);
    });
    x.fillStyle = '#cfe6f7'; x.font = `bold 16px ${FONT}`;
    x.fillText('实时拦截 / 待处置工单', 30, 258);
    const rows = [['10:24:08', '203.0.113.44', '端口扫描', '已封禁', '#37d67a'],
      ['10:23:51', '198.51.100.7', 'SMB 蠕虫', '已封禁', '#37d67a'],
      ['10:22:36', '192.0.2.88', '异常外联', '处置中', '#ffb547'],
      ['10:21:02', '203.0.113.190', '暴力破解', '已封禁', '#37d67a']];
    rows.forEach((row, i) => {
      const ry = 282 + i * 46;
      x.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.07)';
      x.fillRect(30, ry, 964, 38);
      x.font = `13px ${FONT}`; x.fillStyle = '#9db6ca';
      x.fillText(row[0], 42, ry + 24); x.fillText(row[1], 160, ry + 24);
      x.fillText(row[2], 420, ry + 24);
      x.fillStyle = row[4]; x.fillText(row[3], 700, ry + 24);
      x.fillStyle = 'rgba(160,190,210,.35)'; x.fillText('详情', 900, ry + 24);
    });
  } else {
    // 拓扑
    const nodes = [
      [180, 170, '核心 CR', '#ffb547'], [430, 130, '防火墙', '#41c9ff'],
      [430, 300, 'BRAS', '#41c9ff'], [690, 210, '城域汇聚', '#7de2a2'],
      [880, 120, 'IDC', '#a58bff'], [880, 330, 'OLT', '#a58bff']
    ];
    const links = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]];
    links.forEach(([a, b], i) => {
      const A = nodes[a], B = nodes[b];
      x.strokeStyle = i === 2 ? 'rgba(255,90,90,.7)' : 'rgba(65,201,255,.45)';
      x.lineWidth = i === 2 ? 3 : 2;
      x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke();
      const t = .35 + r() * .3;
      x.fillStyle = i === 2 ? '#ff5a5a' : '#8fe3ff';
      x.beginPath(); x.arc(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, 3, 0, 7); x.fill();
    });
    nodes.forEach(n => {
      x.beginPath(); x.arc(n[0], n[1], 16, 0, 7); x.fillStyle = 'rgba(10,22,32,.95)'; x.fill();
      x.strokeStyle = n[3]; x.lineWidth = 2; x.stroke();
      x.fillStyle = n[3]; x.font = `bold 12px ${FONT}`; x.textAlign = 'center';
      x.fillText(n[2], n[0], n[1] + 40); x.textAlign = 'left';
    });
    x.fillStyle = '#cfe6f7'; x.font = `bold 15px ${FONT}`;
    x.fillText('出口流量 42.6 Gbps   ·   峰值 68.2 Gbps   ·   丢包 0.02%', 30, 452);
    x.fillStyle = 'rgba(120,160,190,.28)'; x.fillRect(30, 468, 964, 8);
    x.fillStyle = '#41c9ff'; x.fillRect(30, 468, 604, 8);
  }
  return tex(c);
}

/* ---------- LED 条 ---------- */
export function ledTexture() {
  const c = canvas(2048, 96), x = c.getContext('2d');
  x.fillStyle = '#0a0202'; x.fillRect(0, 0, 2048, 96);
  x.fillStyle = '#ff2f2f'; x.font = `bold 46px ${FONT}`;
  x.fillText('【安全播出】全市信源正常  ·  【网络安全】今日拦截 1284 次，待处置 2 起  ·  【计划操作】22:00 高清互动平台升级  ·  2026-11-21 10:24:36  ·  ', 10, 63);
  const t = tex(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/* ---------- 桌面标识牌 ---------- */
export function plateTexture(text, color = '#1f6feb') {
  const c = canvas(256, 64), x = c.getContext('2d');
  x.fillStyle = 'rgba(12,26,40,.95)'; rr(x, 0, 0, 256, 64, 6); x.fill();
  x.strokeStyle = color; x.lineWidth = 2; x.stroke();
  x.fillStyle = '#dff0ff'; x.font = `bold 26px ${FONT}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 34);
  return tex(c);
}

/* ---------- 穿孔金属吸音板（机房门所在墙面） ---------- */
export function perfPanelTexture() {
  const c = canvas(512, 512), x = c.getContext('2d');
  x.fillStyle = '#eef1f2'; x.fillRect(0, 0, 512, 512);
  // 板缝
  x.strokeStyle = '#d4d9dd'; x.lineWidth = 3;
  x.strokeRect(0, 0, 256, 256); x.strokeRect(256, 0, 256, 256);
  x.strokeRect(0, 256, 256, 256); x.strokeRect(256, 256, 256, 256);
  // 规则穿孔
  for (let y = 7; y < 512; y += 11) {
    for (let xx = 7; xx < 512; xx += 11) {
      x.fillStyle = 'rgba(122,132,140,.55)';
      x.beginPath(); x.arc(xx, y, 2.1, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.75)';
      x.beginPath(); x.arc(xx - 0.8, y - 0.8, 0.9, 0, Math.PI * 2); x.fill();
    }
  }
  return tex(c, 2, 2);
}

/* ---------- 玻璃门磨砂腰线（人民监控为人民标识带） ---------- */
export function glassBandTexture() {
  const c = canvas(1024, 96), x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,.88)'; x.fillRect(0, 0, 1024, 96);
  x.fillStyle = 'rgba(228,232,236,.9)'; x.fillRect(0, 0, 1024, 3); x.fillRect(0, 93, 1024, 3);
  const cell = 256;
  for (let i = 0; i < 4; i++) {
    const cx = i * cell + 34, cy = 48;
    // 红色圆形标识
    x.fillStyle = '#c8232c';
    x.beginPath(); x.arc(cx, cy, 16, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,.92)';
    x.beginPath(); x.arc(cx, cy, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#7b8087'; x.font = `bold 24px ${FONT}`;
    x.textBaseline = 'middle';
    x.fillText('人民监控为人民', cx + 28, cy - 2);
  }
  x.textBaseline = 'alphabetic';
  return tex(c, 1, 1);
}

/* ---------- 侧工位显示器 ---------- */
export function monitorTexture(kind = 0) {
  const c = canvas(512, 320), x = c.getContext('2d');
  x.fillStyle = '#07101a'; x.fillRect(0, 0, 512, 320);
  x.fillStyle = '#0d1c2a'; x.fillRect(0, 0, 512, 28);
  x.fillStyle = '#5f829c'; x.font = `12px ${FONT}`;
  x.fillText(kind ? '告警处置 · 工单队列' : '网络性能 · 实时曲线', 12, 19);
  const r = rnd(kind ? 4 : 9);
  x.strokeStyle = 'rgba(63,208,255,.16)';
  for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, 60 + i * 60); x.lineTo(512, 60 + i * 60); x.stroke(); }
  x.strokeStyle = kind ? '#ff9a4a' : '#41c9ff'; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i <= 60; i++) {
    const px = i * 8.5, py = 200 - Math.sin(i * .22 + kind) * 45 - r() * 14;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.stroke();
  x.fillStyle = '#9db6ca'; x.font = `12px ${FONT}`;
  x.fillText(kind ? '待处置 2 · 已封禁 37' : '42.6 Gbps / 100 Gbps', 14, 300);
  return tex(c);
}
