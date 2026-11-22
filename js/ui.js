/* 界面层：指标渲染、详情面板、告警演练、时钟 */

import { metrics, subscribe, update } from './store.js';

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
  },
  secwall: {
    tag: 'SECURITY WALL',
    title: '网络安全攻击态势 · 实时大屏',
    rows: [
      ['当前攻击速率', '386 次 / 分钟', 'warn'],
      ['攻击来源 TOP1', '198.51.100.0/24（境外）'],
      ['主要类型', '端口扫描 42% · 暴力破解 27% · Web 探测 18%'],
      ['DDoS 峰值', '3.2 Gbps', 'warn'],
      ['今日封禁', '37 个 IP', 'ok'],
      ['待处置事件', '2 起 · 已派单', 'warn'],
      ['联动链路', '态势感知 → 防火墙 → 工单 → 企业微信'],
      ['大屏刷新', '10 fps 节流 · 仅重绘变化区域']
    ],
    note: '大屏只做态势呈现与定位，封禁/解封仍需在态势感知平台走双人复核与审计，指挥中心不直接下发阻断指令。',
    full: true
  },
  rack: {
    tag: 'NETWORK RACK',
    title: '网络机柜 · 端口状态',
    rows: [
      ['机柜编号', 'RC-08（测试机柜）'],
      ['上联端口 Gi1/0/24', '1000M 全双工 正常', 'ok'],
      ['告警端口 Gi1/0/6', 'CRC 错误 128 · 已置红', 'bad'],
      ['光模块', '单模 1310nm · 收 -6.2 dBm', 'ok'],
      ['今日丢包', '0.02%', 'ok'],
      ['处置建议', '更换跳线后观察 30 分钟']
    ],
    note: '点击机柜时场景内的告警端口会红色闪烁 4.5 秒，便于在 3D 中快速定位；真实环境请以网管告警为准。'
  },
  duty: {
    tag: 'DUTY ROSTER · 8 人三组',
    title: '主控台 · 在岗值班与岗位职责',
    rows: [
      ['在岗值班（3 人）', '张工 · 值班长/数字电视（高工）｜赵工 · 网络安全（高工）｜刘工 · 网络配置/规划架构（中工）', 'ok'],
      ['值班表（8 人）', '高级工程师 3 人：张工、李工、赵工；中级工程师 5 人：王工、陈工、刘工、孙工、周工'],
      ['数字电视管理与运维（3 人）', '张工（高工·值班长）、李工（高工）、王工（中工）｜信源调度、播出链路、画面质量'],
      ['网络安全管理与处置（2 人）', '赵工（高工）、陈工（中工）｜攻击监测、封禁处置、事件上报'],
      ['网络配置与操作（3 人）', '刘工、孙工、周工（均为中工）｜其中刘工负责网络规划与架构设计'],
      ['巡检安排', '每 2 小时一次（整点）：机柜 / UPS / 大屏信源 / 空调，双人签字；夜间加密一次', 'warn'],
      ['交接班', '08:30 / 20:30｜交接值班记录、未闭环告警、钥匙与对讲'],
      ['上报链路', '值班长 → 中心主任 → 上级单位，重大故障 5 分钟内首报']
    ],
    note: '主控台席位牌是唯一入口：点开即可查看在岗 3 人、8 人排班、三组职责与巡检要求。'
  },
  door: {
    tag: 'AUTO SENSOR DOOR',
    title: '机房门 · 健身房',
    rows: [
      ['门后区域', '商用健身旗舰店 · 自由力量 / 固定器械 / 有氧 / MMA / 电竞'],
      ['开门方式', '门顶感应器 · 靠近自动双开（已取消门禁）'],
      ['通行规则', '走到门前 2.7m 内自动开门，门扇向内双开'],
      ['防夹保护', '门区有人时保持开启，离开后延时关闭'],
      ['应急', '断电可手动推开，门内侧有应急解锁']
    ],
    note: '门顶感应器检测到人员靠近即开门，门扇打开时状态灯由绿转亮；也可点右下角「下班了」直接进店。'
  },
  riotgear: {
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
  },
  gymgear: {
    tag: 'GYM EQUIPMENT',
    title: '健身房 · 器材与电竞区',
    rows: [
      ['区域划分', '自由力量 / 固定器械 / 有氧 / 功能训练 / 电竞'],
      ['电竞位', '3 台高背椅 + 主机 + 2K 240Hz 屏'],
      ['角色', '爆炸头 + 头戴耳机 · 哑铃飞鸟'],
      ['状态色', '正常 / 使用中 / 维护中 / 空闲'],
      ['提示', '点击具体器材查看目标肌群与配重范围']
    ],
    note: '健身房以器材为主，电竞区仅占右侧墙边一条；点击器材或角色可查看详情。'
  }
};

const $ = id => document.getElementById(id);

/* 指标 → DOM 的唯一写入点：处置台只改 store，不再直接改这些卡片 */
function render (m) {
  const txt = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const html = (id, v) => { const el = $(id); if (el) el.innerHTML = v; };
  const cls = (id, v) => { const el = $(id); if (el) el.className = v; };
  const width = (id, v) => { const el = $(id); if (el) el.style.width = v; };

  html('m-src', m.src + '<small>/' + m.srcTotal + '</small>');
  html('m-out', m.out + '<small>/' + m.outTotal + '</small>');
  txt('m-atk', m.attacks.toLocaleString());
  txt('m-blk', m.blocked);
  txt('m-pend', m.pending);
  html('m-traf', m.traffic.toFixed(1) + '<small>Gbps</small>');
  txt('m-loss', m.loss.toFixed(2) + '%');

  const pend = $('m-pend');
  if (pend) pend.style.color = m.pending > 2 ? '#ff5a5a' : '';

  width('bar-bc', m.health + '%');
  const bc = $('bar-bc');
  if (bc) {
    bc.style.background = m.alarm
      ? 'linear-gradient(90deg,#a33,#ff5a5a)'
      : 'linear-gradient(90deg,#2a9fd6,#3fd0ff)';
  }
  width('bar-net', Math.round(m.traffic) + '%');
  cls('dot-bc', m.alarm ? 'dot bad' : 'dot');
  cls('dot-sec', m.pending > 0 ? 'dot warn' : 'dot');
}

export function initUI({ onView, onAlarm, onGym }) {
  subscribe(render);

  // 时钟
  const tick = () => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    $('clock').textContent = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}  ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  tick(); setInterval(tick, 1000);

  // 视角（第 7 个按钮「下班了」直接进入健身房）
  const activate = i => {
    document.querySelectorAll('#views .btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === String(i));
    });
  };
  document.querySelectorAll('#views .btn').forEach(b => {
    // 统一由 activate() 同步高亮，避免键盘与鼠标两条路径状态分叉
    b.addEventListener('click', () => {
      if (b.dataset.view === 'gym') {
        onGym?.();
        return;
      }
      const i = Number(b.dataset.view);
      onView(i);
      activate(i);
    });
  });

  // 告警演练
  $('alarm-btn').addEventListener('click', () => setAlarm(!metrics.alarm, onAlarm));
  $('reset-btn').addEventListener('click', () => {
    setAlarm(false, onAlarm);
    document.querySelectorAll('#views .btn').forEach(x => x.classList.remove('active'));
  });
  $('panel-close').addEventListener('click', closePanel);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
    if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
      const i = Number(e.key) - 1;
      onView(i);
      activate(i);
    }
  });

  setInterval(simulate, 2600);
  return { setAlarm, openPanel };
}

function simulate() {
  if (metrics.alarm) return;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  update({
    attacks: metrics.attacks + Math.floor(Math.random() * 7),
    blocked: metrics.blocked + (Math.random() > 0.6 ? 1 : 0),
    traffic: clamp(metrics.traffic + (Math.random() - 0.5) * 1.6, 30, 72),
    loss: clamp(metrics.loss + (Math.random() - 0.5) * 0.01, 0, 0.09)
  });
}

let pendingBeforeAlarm = 2;

export function setAlarm(on, cb) {
  if (on) {
    pendingBeforeAlarm = metrics.pending;
    update({ alarm: true, src: 11, out: 382, pending: 4, health: 72 });
  } else {
    update({ alarm: false, src: metrics.srcTotal, out: metrics.outTotal, pending: pendingBeforeAlarm, health: 96 });
  }

  const btn = $('alarm-btn');
  btn.classList.toggle('active', on);
  btn.textContent = on ? '告警中' : '告警演练';
  // 标记告警横幅占用，避免操作提示的定时器把它隐藏
  const bn = $('banner');
  bn.classList.toggle('show', on);
  if (on) {
    bn.dataset.alarm = '1';
    // 演练横幅不依赖外部回调，避免主场景未注入时空白
    if (!bn.innerHTML.trim()) {
      bn.innerHTML = '<b style="color:#ff5a5a">告警演练中</b> · 安全播出分区已接管，请按预案处置';
    }
  } else {
    delete bn.dataset.alarm;
    bn.innerHTML = '';
  }
  cb?.(on);
}

export function openPanel(key, info) {
  // 动态对象（器材 / 门禁）直接带 rows，静态分区仍走 PANELS 注册表
  const p = (info && info.rows ? info : PANELS[key]) || PANELS.wall;
  $('panel-title').textContent = p.title;
  const rows = p.rows.map(r => {
    const cls = r[2] ? ` class="${r[2]}"` : '';
    return `<div class="p-row"><span>${r[0]}</span><b${cls}>${r[1]}</b></div>`;
  }).join('');
  $('panel-body').innerHTML = `
    <div class="p-tag">${p.tag || ''}</div>
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
  $('panel').classList.toggle('full', !!p.full);
}

export function closePanel() {
  $('panel').classList.remove('open', 'full');
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
