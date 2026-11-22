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

/* ---------- 灭火器月度检查卡 ---------- */
export function inspectionCard() {
  const c = canvas(220, 300), x = c.getContext('2d');
  x.fillStyle = '#fbfcfd'; x.fillRect(0, 0, 220, 300);
  x.strokeStyle = '#c9d2d9'; x.lineWidth = 4; x.strokeRect(2, 2, 216, 296);
  x.fillStyle = '#b0232c'; x.fillRect(0, 0, 220, 44);
  x.fillStyle = '#fff'; x.font = `bold 21px ${FONT}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('灭火器月度检查卡', 110, 23);
  x.textAlign = 'left'; x.fillStyle = '#37424c'; x.font = `13px ${FONT}`;
  x.fillText('编号：MFZ-08', 16, 66);
  x.fillText('压力：正常', 16, 92);
  x.strokeStyle = '#d5dce1'; x.lineWidth = 1;
  [110, 140, 170, 200, 230, 260].forEach(y => {
    x.beginPath(); x.moveTo(14, y); x.lineTo(206, y); x.stroke();
  });
  x.fillStyle = '#8d979f'; x.font = `11px ${FONT}`;
  x.fillText('日期', 20, 130); x.fillText('检查人', 108, 130);
  x.fillStyle = '#4d5a64';
  ['11-01', '11-08', '11-15', '11-22'].forEach((d, i) => {
    x.fillText(d, 20, 148 + i * 30);
    x.fillText(['李', '王', '李', '赵'][i], 108, 148 + i * 30);
  });
  x.strokeStyle = '#2f8f5b'; x.lineWidth = 2;
  x.strokeRect(78, 116, 34, 22);
  x.beginPath(); x.moveTo(83, 127); x.lineTo(89, 133); x.lineTo(105, 119); x.stroke();
  return tex(c);
}

/* ---------- 墙脚疏散指示（绿底白字） ---------- */
export function evacSign() {
  const c = canvas(256, 96), x = c.getContext('2d');
  x.fillStyle = '#0f8a4c'; x.fillRect(0, 0, 256, 96);
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 6; x.strokeRect(3, 3, 250, 90);
  // 奔跑小人
  x.strokeStyle = '#fff'; x.lineWidth = 7; x.lineCap = 'round';
  x.beginPath(); x.arc(58, 22, 9, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
  x.beginPath(); x.moveTo(56, 34); x.lineTo(64, 56); x.lineTo(52, 78); x.stroke();
  x.beginPath(); x.moveTo(64, 56); x.lineTo(80, 78); x.stroke();
  x.beginPath(); x.moveTo(60, 42); x.lineTo(78, 46); x.stroke();
  x.beginPath(); x.moveTo(60, 42); x.lineTo(44, 54); x.stroke();
  // 箭头
  x.beginPath(); x.moveTo(104, 48); x.lineTo(146, 48); x.stroke();
  x.beginPath(); x.moveTo(134, 34); x.lineTo(150, 48); x.lineTo(134, 62); x.stroke();
  x.fillStyle = '#fff'; x.font = `bold 26px ${FONT}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('安全出口', 202, 48);
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

/* ---------- 右侧墙屏：网络安全攻击态势（单块 16:9 横屏，实时动效） ---------- */
export function attackScreen() {
  const W = 1280, H = 720;
  const c = canvas(W, H), x = c.getContext('2d');
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const pad2 = n => String(n).padStart(2, '0');
  const R = rnd(53);

  // 内网节点（中心 640, 392）
  const nodes = [
    [640, 392, '核心交换', '#4fd2ff', 1.0],
    [640, 258, '互联网出口', '#ffb547', 0.92],
    [754, 326, 'DMZ 区', '#4fd2ff', 0.82],
    [754, 458, '业务区', '#37d67a', 0.82],
    [640, 526, '数据区', '#37d67a', 0.82],
    [526, 458, '运维区', '#4fd2ff', 0.82],
    [526, 326, 'VPN 接入', '#4fd2ff', 0.82]
  ];

  // 外圈攻击源 → 内网节点的攻击弧
  const arcs = [];
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 / 12) * i + R() * 0.26;
    const rad = 176 + R() * 34;
    const tgt = nodes[1 + Math.floor(R() * (nodes.length - 1))];
    arcs.push({
      x: 640 + Math.cos(a) * rad,
      y: 392 + Math.sin(a) * rad * 0.82,
      tx: tgt[0] + (R() - 0.5) * 16,
      ty: tgt[1] + (R() - 0.5) * 16,
      speed: 0.14 + R() * 0.18,
      offset: R(),
      hot: R() < 0.3,
      color: R() < 0.28 ? '#ff7a45' : R() < 0.5 ? '#ffd24a' : '#4fd2ff'
    });
  }

  const events = [
    ['10:24:08', '端口扫描 203.0.113.44', '已封禁', '#37d67a'],
    ['10:24:03', 'SMB 蠕虫 198.51.100.7', '已阻断', '#37d67a'],
    ['10:23:51', 'CR-01 出口流量 +82%', '限速中', '#ffb547'],
    ['10:23:12', 'Web 爆破 45.77.12.9', '已封禁', '#37d67a'],
    ['10:22:36', 'EPG 响应超时 1.8s', '已恢复', '#4fd2ff'],
    ['10:22:02', 'DNS 异常 104.28.6.31', '观察中', '#ffb547']
  ];

  function panel(px, py, pw, ph) {
    rr(x, px, py, pw, ph, 10);
    x.fillStyle = 'rgba(10,22,34,.9)';
    x.fill();
    x.strokeStyle = 'rgba(63,208,255,.14)';
    x.lineWidth = 1.2;
    x.stroke();
  }

  function draw(time) {
    /* 背景与光晕 */
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#07131f');
    bg.addColorStop(1, '#040a11');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);

    const glow = x.createRadialGradient(640, 392, 30, 640, 392, 360);
    glow.addColorStop(0, 'rgba(48,150,220,.18)');
    glow.addColorStop(0.55, 'rgba(30,90,140,.06)');
    glow.addColorStop(1, 'rgba(4,10,17,0)');
    x.fillStyle = glow; x.fillRect(0, 60, W, H - 60);

    x.strokeStyle = 'rgba(70,130,180,.09)'; x.lineWidth = 1;
    for (let i = 0; i <= W; i += 40) { x.beginPath(); x.moveTo(i, 68); x.lineTo(i, H); x.stroke(); }
    for (let j = 68; j <= H; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }

    /* 顶栏 */
    x.fillStyle = 'rgba(8,20,32,.94)'; x.fillRect(0, 0, W, 68);
    x.strokeStyle = 'rgba(63,208,255,.3)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, 68); x.lineTo(W, 68); x.stroke();
    x.fillStyle = '#e6f4ff'; x.font = `bold 30px ${FONT}`;
    x.fillText('网络安全攻击态势', 28, 45);
    x.fillStyle = 'rgba(120,165,195,.65)'; x.font = `13px ${FONT}`;
    x.fillText('CYBER ATTACK SITUATION  /  REAL-TIME MONITOR', 244, 45);

    const blink = Math.sin(time * 3.2) > 0;
    x.fillStyle = blink ? '#ff4d4f' : 'rgba(255,77,79,.2)';
    x.beginPath(); x.arc(1040, 34, 6, 0, Math.PI * 2); x.fill();
    x.fillStyle = blink ? '#ffb3b4' : 'rgba(200,140,140,.45)';
    x.font = `bold 15px ${FONT}`;
    x.fillText('LIVE 实时监测', 1054, 39);

    const d = new Date();
    x.fillStyle = '#8fb6d0'; x.font = `16px ${FONT}`; x.textAlign = 'right';
    x.fillText(`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`, 1254, 40);
    x.textAlign = 'left';

    /* KPI */
    const kpis = [
      ['今日攻击', '12,846', '+18%', '#ff6b6b'],
      ['已拦截', '12,792', '99.6%', '#37d67a'],
      ['待处置', '2', 'P1', '#ffb547'],
      ['封禁 IP', '1,284', '24h', '#4fd2ff']
    ];
    const kw = (W - 56 - 36) / 4;
    kpis.forEach((k, i) => {
      const kx = 28 + i * (kw + 12), ky = 86;
      rr(x, kx, ky, kw, 62, 8);
      x.fillStyle = 'rgba(12,26,40,.92)'; x.fill();
      x.strokeStyle = 'rgba(63,208,255,.16)'; x.lineWidth = 1.2; x.stroke();
      x.fillStyle = 'rgba(140,175,200,.8)'; x.font = `14px ${FONT}`;
      x.fillText(k[0], kx + 14, ky + 23);
      x.fillStyle = k[3]; x.font = `bold 27px ${FONT}`;
      x.fillText(k[1], kx + 14, ky + 53);
      x.fillStyle = 'rgba(130,170,200,.55)'; x.font = `12px ${FONT}`;
      x.textAlign = 'right'; x.fillText(k[2], kx + kw - 12, ky + 52); x.textAlign = 'left';
    });

    /* 左：攻击类型 */
    panel(28, 162, 272, 300);
    x.fillStyle = '#cfe6f7'; x.font = `bold 16px ${FONT}`;
    x.fillText('攻击类型分布', 44, 194);
    x.fillStyle = 'rgba(120,160,190,.55)'; x.font = `12px ${FONT}`;
    x.fillText('ATTACK TYPE / 24H', 44, 214);
    const types = [
      ['端口扫描', 38, '#4fd2ff'], ['暴力破解', 26, '#ffb547'],
      ['DDoS 流量', 17, '#ff6b6b'], ['恶意代码', 12, '#c77dff'], ['其他', 7, '#7e9cb2']
    ];
    types.forEach((t, i) => {
      const ty = 244 + i * 44;
      x.fillStyle = '#8fb0c6'; x.font = `14px ${FONT}`;
      x.fillText(t[0], 44, ty);
      x.textAlign = 'right'; x.fillStyle = 'rgba(180,205,225,.7)';
      x.fillText(t[1] + '%', 284, ty); x.textAlign = 'left';
      x.fillStyle = 'rgba(255,255,255,.06)'; rr(x, 44, ty + 8, 240, 7, 3.5); x.fill();
      x.fillStyle = t[2]; rr(x, 44, ty + 8, 240 * (t[1] / 40), 7, 3.5); x.fill();
    });

    /* 左：攻击来源 */
    panel(28, 474, 272, 154);
    x.fillStyle = '#cfe6f7'; x.font = `bold 16px ${FONT}`;
    x.fillText('攻击来源 TOP 5', 44, 502);
    const srcs = [
      ['198.51.100.7', '美国 · 已封禁', '#37d67a'],
      ['203.0.113.44', '新加坡 · 已封禁', '#37d67a'],
      ['192.0.2.18', '荷兰 · 观察中', '#ffb547'],
      ['45.77.12.9', '日本 · 已封禁', '#37d67a'],
      ['104.28.6.31', '香港 · 观察中', '#ffb547']
    ];
    srcs.forEach((s, i) => {
      const sy = 528 + i * 20;
      x.fillStyle = 'rgba(150,185,210,.85)'; x.font = `12px ${FONT}`;
      x.fillText(s[0], 44, sy);
      x.fillStyle = s[2]; x.textAlign = 'right';
      x.fillText(s[1], 284, sy); x.textAlign = 'left';
    });

    /* 中：拓扑雷达 */
    x.save();
    x.translate(640, 392);
    [72, 122, 174, 226].forEach((rad, i) => {
      x.strokeStyle = `rgba(63,208,255,${0.07 + i * 0.018})`;
      x.lineWidth = 1.2;
      x.beginPath(); x.ellipse(0, 0, rad, rad * 0.82, 0, 0, Math.PI * 2); x.stroke();
    });
    const ang = (time * 0.5) % (Math.PI * 2);
    x.strokeStyle = 'rgba(79,210,255,.3)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(0, 0);
    x.lineTo(Math.cos(ang) * 194, Math.sin(ang) * 159); x.stroke();
    x.restore();

    // 节点互联（虚线）
    x.save();
    x.setLineDash([4, 6]);
    x.strokeStyle = 'rgba(90,150,190,.3)'; x.lineWidth = 1;
    nodes.slice(1).forEach(n => {
      x.beginPath(); x.moveTo(nodes[0][0], nodes[0][1]); x.lineTo(n[0], n[1]); x.stroke();
    });
    x.setLineDash([]);
    x.restore();

    // 攻击弧与流动光点
    arcs.forEach(a => {
      const mx = (a.x + a.tx) / 2 + (a.ty - a.y) * 0.2;
      const my = (a.y + a.ty) / 2 - (a.tx - a.x) * 0.2;
      x.strokeStyle = a.hot ? 'rgba(255,107,107,.22)' : 'rgba(63,208,255,.14)';
      x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(a.x, a.y); x.quadraticCurveTo(mx, my, a.tx, a.ty); x.stroke();

      x.fillStyle = a.hot ? 'rgba(255,107,107,.9)' : 'rgba(120,200,240,.75)';
      x.beginPath(); x.arc(a.x, a.y, 2.6, 0, Math.PI * 2); x.fill();

      const u = (time * a.speed + a.offset) % 1;
      const px = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * a.tx;
      const py = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * a.ty;
      x.shadowColor = a.color; x.shadowBlur = 9;
      x.fillStyle = a.color;
      x.beginPath(); x.arc(px, py, a.hot ? 3.4 : 2.8, 0, Math.PI * 2); x.fill();
      x.shadowBlur = 0;
    });

    // 节点
    nodes.forEach((n, i) => {
      const [nx, ny, label, color, scale] = n;
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.7 + i);
      if (i === 0) {
        x.fillStyle = 'rgba(63,208,255,.10)';
        x.beginPath(); x.arc(nx, ny, 26 + pulse * 5, 0, Math.PI * 2); x.fill();
      }
      x.fillStyle = 'rgba(9,24,37,.96)';
      x.beginPath(); x.arc(nx, ny, 15 * scale, 0, Math.PI * 2); x.fill();
      x.strokeStyle = color; x.lineWidth = 1.6;
      x.beginPath(); x.arc(nx, ny, 15 * scale, 0, Math.PI * 2); x.stroke();
      x.fillStyle = color;
      x.beginPath(); x.arc(nx, ny, 4, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(175,205,225,.92)'; x.font = `12px ${FONT}`; x.textAlign = 'center';
      x.fillText(label, nx, ny + 15 * scale + 17);
      x.textAlign = 'left';
    });

    // 图例
    const legend = [['已拦截', '#37d67a'], ['观察中', '#ffb547'], ['攻击流量', '#ff6b6b']];
    legend.forEach((l, i) => {
      const lx = 352 + i * 116;
      x.fillStyle = l[1];
      x.beginPath(); x.arc(lx, 612, 4, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(150,185,210,.75)'; x.font = `12px ${FONT}`;
      x.fillText(l[0], lx + 10, 616);
    });

    /* 右：实时事件 */
    panel(980, 162, 272, 466);
    x.fillStyle = '#cfe6f7'; x.font = `bold 16px ${FONT}`;
    x.fillText('实时阻断事件', 996, 194);
    x.fillStyle = 'rgba(120,160,190,.55)'; x.font = `12px ${FONT}`;
    x.textAlign = 'right'; x.fillText('最近 5 分钟', 1236, 194); x.textAlign = 'left';
    events.forEach((e, i) => {
      const ey = 214 + i * 66;
      rr(x, 996, ey, 240, 54, 6);
      x.fillStyle = i % 2 ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.045)';
      x.fill();
      x.fillStyle = 'rgba(140,175,200,.75)'; x.font = `12px ${FONT}`;
      x.fillText(e[0], 1008, ey + 20);
      x.fillStyle = '#c2d6e4'; x.font = `13px ${FONT}`;
      x.fillText(e[1], 1008, ey + 40);
      x.fillStyle = e[3]; x.font = `bold 12px ${FONT}`; x.textAlign = 'right';
      x.fillText(e[2], 1226, ey + 33); x.textAlign = 'left';
      x.fillStyle = e[3];
      x.globalAlpha = .55;
      x.fillRect(996, ey + 3, 3, 48);
      x.globalAlpha = 1;
    });

    /* 底部滚动条 */
    x.fillStyle = 'rgba(8,18,28,.96)'; x.fillRect(0, 646, W, 44);
    x.strokeStyle = 'rgba(63,208,255,.2)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(0, 646); x.lineTo(W, 646); x.stroke();
    x.fillStyle = '#ffb547'; x.font = `bold 14px ${FONT}`;
    x.fillText('最新', 18, 675);
    const msg = '10:24:08 来自 203.0.113.44 的端口扫描已自动封禁  ·  10:23:51 核心 CR-01 出口流量突增 82%，已限速  ·  10:22:36 SMB 蠕虫传播被阻断  ·  10:21:02 边界防火墙策略更新完成  ·  全网链路运行正常';
    x.save();
    x.beginPath(); x.rect(76, 646, W - 92, 44); x.clip();
    x.fillStyle = '#9fc2d8'; x.font = `15px ${FONT}`;
    const scroll = (time * 62) % 1900;
    x.fillText(msg, W - scroll, 675);
    x.fillText(msg, W - scroll + 1900, 675);
    x.restore();
  }

  let last = -1;
  function update(time) {
    if (time - last < 0.1) return;
    last = time;
    draw(time);
    texture.needsUpdate = true;
  }

  draw(0);
  texture.needsUpdate = true;
  return { texture, update };
}
