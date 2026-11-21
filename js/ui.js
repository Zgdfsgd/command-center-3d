/* 界面层：指标模拟、详情面板、告警演练、时钟 */

const D = {
  src: 12, srcTotal: 12,
  out: 386, outTotal: 386,
  attacks: 1284, blocked: 37, pending: 2,
  traffic: 42.6, loss: 0.02,
  alarm: false
};

const PANELS = {
  wall: {
    tag: 'VIDEO WALL',
    title: '视频墙 · 全市监测',
    rows: [
      ['拼接规模', '72 分区 / 13m × 2.45m'],
      ['轮巡周期', '12 s'],
      ['上屏信号', '12 路信源 + 6 路平台监测'],
      ['在线率', '100%', 'ok'],
      ['当前布局', '左轮巡 / 中业务 / 右网管']
    ],
    note: '3D 场景只承载分区与外框，真实视频流建议用 2D 图层叠加，避免 HLS 解码占用值班终端 GPU。'
  },
  bc: {
    tag: 'BROADCAST',
    title: '安全播出 · 业务链路',
    rows: [
      ['信源', '12 / 12 正常', 'ok'],
      ['数字电视平台', '主用 正常', 'ok'],
      ['高清互动平台', '正常', 'ok'],
      ['播出末端', '386 / 386 在线', 'ok'],
      ['镇街节目', '32 / 32 正常', 'ok'],
      ['最近切换', '今日 02:14 备用信源演练']
    ],
    note: '告警时该分区边框转为琥珀色脉冲，并联动操作台席位卡；信源切换仍需人工确认，3D 不直接下发切换指令。'
  },
  sec: {
    tag: 'SECURITY',
    title: '网络安全 · 实时态势',
    rows: [
      ['今日攻击', '1,284 次'],
      ['DDoS 峰值', '3.2 Gbps', 'warn'],
      ['自动封禁', '37 个 IP', 'ok'],
      ['待处置', '2 起', 'warn'],
      ['最新事件', '10:22 异常外联 192.0.2.88'],
      ['联动链路', '态势感知 → 防火墙 → 企业微信']
    ],
    note: '3D 上只呈现事件位置与影响面；封禁、解封走审批与审计，指挥中心不保留直接下发权限。'
  },
  net: {
    tag: 'NETWORK',
    title: '城域数据网 · 链路负载',
    rows: [
      ['出口流量', '42.6 / 100 Gbps', 'ok'],
      ['核心互联', '2 × 100G 正常', 'ok'],
      ['时延', '3.1 ms', 'ok'],
      ['丢包', '0.02%', 'ok'],
      ['在线设备', '1,286 台'],
      ['今日变更', '2 项（22:00 起）']
    ],
    note: '链路利用率超过 70% 时，3D 中的链路带改为琥珀色；超过 85% 转红色并推送工单，而不是只改数字颜色。'
  },
  desk: {
    tag: 'DUTY DESK',
    title: '值班席 · 交接与待办',
    rows: [
      ['在岗', '3 人（值班 / 安全 / 安播）', 'ok'],
      ['交接班', '08:30 已完成'],
      ['待办', '3 项', 'warn'],
      ['今日计划操作', '2 项'],
      ['最近事件', '09:41 高清互动平台端口抖动']
    ],
    note: '席位是 3D 场景里最有价值的一层：应急时先回答“谁在看、谁在处理”，再回答“哪里坏了”。'
  },
  side: {
    tag: 'EMERGENCY STATION',
    title: '应急工位 · 处置队列',
    rows: [
      ['待处置工单', '2 起', 'warn'],
      ['封禁队列', '5 个 IP'],
      ['最近操作', '10:23 封禁 198.51.100.7', 'ok'],
      ['复核', '双人确认 已开启'],
      ['回滚窗口', '30 分钟']
    ],
    note: '演示环境：处置按钮不接生产系统。真实落地时建议跳转现有工单/堡垒机，保留完整审计。'
  }
};

const $ = id => document.getElementById(id);

export function initUI({ onView, onAlarm }) {
  // 时钟
  const tick = () => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    $('clock').textContent = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  tick(); setInterval(tick, 1000);

  // 视角
  document.querySelectorAll('#views .btn').forEach(b => {
    b.addEventListener('click', () => {
      onView(Number(b.dataset.view));
      document.querySelectorAll('#views .btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });

  // 告警演练
  $('alarm-btn').addEventListener('click', () => setAlarm(!D.alarm, onAlarm));
  $('reset-btn').addEventListener('click', () => {
    setAlarm(false, onAlarm);
    document.querySelectorAll('#views .btn').forEach(x => x.classList.remove('active'));
  });
  $('panel-close').addEventListener('click', closePanel);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
    if (['1', '2', '3', '4', '5', '6'].includes(e.key)) onView(Number(e.key) - 1);
  });

  setInterval(simulate, 2600);
  return { setAlarm, openPanel };
}

function simulate() {
  if (D.alarm) return;
  D.attacks += Math.floor(Math.random() * 7);
  D.blocked += Math.random() > 0.6 ? 1 : 0;
  D.traffic = Math.max(30, Math.min(72, D.traffic + (Math.random() - 0.5) * 1.6));
  D.loss = Math.max(0, Math.min(0.09, D.loss + (Math.random() - 0.5) * 0.01));

  $('m-atk').textContent = D.attacks.toLocaleString();
  $('m-blk').textContent = D.blocked;
  $('m-traf').innerHTML = D.traffic.toFixed(1) + '<small>Gbps</small>';
  $('m-loss').textContent = D.loss.toFixed(2) + '%';
  $('bar-net').style.width = (D.traffic / 100 * 100).toFixed(0) + '%';
}

export function setAlarm(on, cb) {
  D.alarm = on;
  const btn = $('alarm-btn');
  btn.classList.toggle('active', on);
  btn.textContent = on ? '告警中' : '告警演练';
  $('banner').classList.toggle('show', on);

  const dotBc = $('dot-bc');
  dotBc.className = 'dot' + (on ? ' bad' : '');
  $('m-src').innerHTML = on ? '11<small>/12</small>' : '12<small>/12</small>';
  $('m-out').innerHTML = on ? '382<small>/386</small>' : '386<small>/386</small>';
  $('bar-bc').style.width = on ? '72%' : '96%';
  $('bar-bc').style.background = on
    ? 'linear-gradient(90deg,#a33,#ff5a5a)'
    : 'linear-gradient(90deg,#2a9fd6,#3fd0ff)';
  if (on) {
    $('m-pend').textContent = '4';
    $('m-pend').style.color = '#ff5a5a';
  } else {
    $('m-pend').textContent = '2';
    $('m-pend').style.color = '';
  }
  cb?.(on);
}

export function openPanel(key) {
  const p = PANELS[key] || PANELS.wall;
  $('panel-title').textContent = p.title;
  const rows = p.rows.map(r => {
    const cls = r[2] ? ` class="${r[2]}"` : '';
    return `<div class="p-row"><span>${r[0]}</span><b${cls}>${r[1]}</b></div>`;
  }).join('');
  $('panel-body').innerHTML = `
    <div class="p-tag">${p.tag}</div>
    ${rows}
    <div class="p-note">${p.note}</div>
    <div class="p-actions">
      <button class="btn" data-act="locate">定位对象</button>
      <button class="btn" data-act="ticket">发起工单</button>
    </div>
    <div class="p-note" style="opacity:.65">演示数据，未接入生产系统。</div>`;
  $('panel-body').querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener('click', () => {
      b.textContent = b.dataset.act === 'locate' ? '已定位（演示）' : '已生成工单（演示）';
      b.classList.add('active');
    });
  });
  $('panel').classList.add('open');
}

export function closePanel() {
  $('panel').classList.remove('open');
}

export function showTip(text, x, y) {
  const t = $('tip');
  t.textContent = text;
  t.style.left = x + 'px';
  t.style.top = y + 'px';
  t.style.opacity = 1;
}
export function hideTip() {
  $('tip').style.opacity = 0;
}
