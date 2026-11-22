/* 值班处置台：模拟信源切换、安全事件处置、调度派单、电话接听
 * 与页面解耦，独立注入 DOM 与样式，standalone / TvT 插件共用
 */

import { metrics, subscribe, update } from './store.js';

const CSS = `
.sim-fab{position:fixed;right:20px;bottom:74px;z-index:20;height:34px;padding:0 14px;border-radius:18px;
  border:1px solid rgba(63,208,255,.45);background:rgba(10,22,32,.88);color:#bfe8ff;font-size:12px;
  letter-spacing:.5px;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 4px 18px rgba(0,0,0,.35)}
.sim-fab:hover{border-color:#3fd0ff;color:#fff;box-shadow:0 0 16px rgba(63,208,255,.3)}
.sim-dock{position:fixed;left:20px;bottom:56px;width:332px;max-height:min(560px,calc(100% - 120px));z-index:19;
  display:none;flex-direction:column;background:rgba(9,16,23,.94);border:1px solid rgba(120,190,255,.2);
  border-left:2px solid #3fd0ff;border-radius:8px;backdrop-filter:blur(12px);color:#dbe9f4;
  font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
.sim-dock.open{display:flex}
.sim-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(120,190,255,.14)}
.sim-head b{font-size:13px;font-weight:600;letter-spacing:.5px}
.sim-live{font-size:9px;color:#ffb547;border:1px solid rgba(255,181,71,.4);padding:1px 5px;border-radius:3px;letter-spacing:1px}
.sim-head .x{margin-left:auto;background:none;border:0;color:#8fa6bb;font-size:16px;cursor:pointer;line-height:1}
.sim-tabs{display:flex;gap:2px;padding:8px 10px 0}
.sim-tabs button{flex:1;height:27px;border:1px solid transparent;background:rgba(255,255,255,.04);color:#8fa6bb;
  font-size:11.5px;border-radius:4px 4px 0 0;cursor:pointer}
.sim-tabs button.on{background:rgba(63,208,255,.12);border-color:rgba(63,208,255,.35);border-bottom-color:transparent;color:#e8f6ff}
.sim-body{padding:10px 12px;overflow:auto;flex:1 1 auto;min-height:150px}
.sim-pane{display:none}
.sim-pane.on{display:block}
.sim-row{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#93a9bc;padding:5px 0;
  border-bottom:1px dashed rgba(140,170,195,.13)}
.sim-row b{color:#e8f5ff;font-family:Consolas,monospace;font-size:11.5px;font-weight:500}
.sim-row b.ok{color:#37d67a}.sim-row b.warn{color:#ffb547}.sim-row b.bad{color:#ff5a5a}
.sim-btn{width:100%;height:32px;margin-top:8px;border-radius:4px;border:1px solid rgba(63,208,255,.4);
  background:rgba(20,44,60,.6);color:#cfeeff;font-size:12px;cursor:pointer;letter-spacing:.5px}
.sim-btn:hover{background:rgba(30,64,86,.8);color:#fff}
.sim-btn:disabled{opacity:.45;cursor:default}
.sim-btn.warn{border-color:rgba(255,181,71,.5);background:rgba(58,42,16,.55);color:#ffd79a}
.sim-btn.danger{border-color:rgba(255,90,90,.45);background:rgba(60,20,20,.5);color:#ffc0c0}
.sim-item{border:1px solid rgba(120,190,255,.14);border-radius:5px;padding:8px 9px;margin-bottom:7px;background:rgba(255,255,255,.025)}
.sim-item h4{font-size:11.5px;font-weight:500;color:#dceaf5;line-height:1.5;margin:0 0 5px}
.sim-item .meta{display:flex;gap:8px;font-size:10px;color:#7d93a6;font-family:Consolas,monospace}
.sim-item .meta em{font-style:normal;color:#ffb547}
.sim-item .acts{display:flex;gap:6px;margin-top:7px}
.sim-item .acts button{flex:1;height:25px;border-radius:3px;font-size:11px;cursor:pointer;
  border:1px solid rgba(63,208,255,.32);background:rgba(20,40,54,.7);color:#b9e4ff}
.sim-item .acts button:hover{background:rgba(32,66,88,.9)}
.sim-item.done{opacity:.55}
.sim-item.done .acts{display:none}
.sim-log{border-top:1px solid rgba(120,190,255,.14);background:rgba(0,0,0,.2);padding:7px 12px 9px;max-height:112px;overflow:auto}
.sim-log h5{font-size:10px;color:#7d93a6;font-weight:400;letter-spacing:1px;margin:0 0 5px}
.sim-log ul{list-style:none;margin:0;padding:0}
.sim-log li{font-size:10.5px;line-height:1.7;color:#8fa6bb;font-family:Consolas,monospace}
.sim-log li span{color:#3fd0ff;margin-right:6px}
.sim-toast{position:fixed;left:50%;top:120px;transform:translate(-50%,-10px);z-index:30;opacity:0;pointer-events:none;
  background:rgba(8,20,28,.95);border:1px solid rgba(63,208,255,.45);border-radius:5px;color:#d6f1ff;
  font-size:12px;letter-spacing:.5px;padding:8px 16px;transition:.25s;box-shadow:0 0 24px rgba(63,208,255,.18)}
.sim-toast.show{opacity:1;transform:translate(-50%,0)}
.sim-call{margin-top:8px;border:1px solid rgba(255,181,71,.45);border-radius:6px;padding:10px;
  background:rgba(52,36,10,.5);display:none}
.sim-call.show{display:block}
.sim-call .num{font-size:15px;font-family:Consolas,monospace;color:#ffd79a;letter-spacing:1px}
.sim-call .from{font-size:11px;color:#c8b58a;margin-top:3px}
.sim-call .acts{display:flex;gap:7px;margin-top:9px}
.sim-call .acts button{flex:1;height:28px;border-radius:4px;font-size:11.5px;cursor:pointer}
.sim-pick{display:flex;gap:6px;margin-top:6px}
.sim-pick select{flex:1;height:29px;background:rgba(10,22,30,.9);color:#cfe4f5;border:1px solid rgba(120,190,255,.22);
  border-radius:4px;font-size:11px;padding:0 5px;outline:none}
`;

const pad = n => String(n).padStart(2, '0');
const now = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
/* 通知 3D 场景做出响应动作（值班员肢体反馈） */
const emit = type => window.dispatchEvent(new CustomEvent('sim:action', { detail: { type } }));

export function initSim() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.innerHTML = `
    <button class="sim-fab" id="sim-fab">处置台 · 模拟操作</button>
    <div class="sim-dock" id="sim-dock">
      <div class="sim-head">
        <b>值班处置台</b><span class="sim-live">SIMULATION</span>
        <button class="x" id="sim-x">×</button>
      </div>
      <div class="sim-tabs">
        <button class="on" data-tab="signal">信源切换</button>
        <button data-tab="sec">安全事件</button>
        <button data-tab="dispatch">调度派单</button>
        <button data-tab="phone">电话</button>
      </div>
      <div class="sim-body">
        <div class="sim-pane on" data-pane="signal">
          <div class="sim-row"><span>当前播出信源</span><b id="sim-src">主用 · 省干 OTN A 平面</b></div>
          <div class="sim-row"><span>备用信源状态</span><b class="ok">就绪 · 已锁定</b></div>
          <div class="sim-row"><span>切换策略</span><b>人工确认 · 无中断切换</b></div>
          <button class="sim-btn warn" id="sim-switch">切换至备用信源</button>
          <button class="sim-btn" id="sim-restore" disabled>恢复主用信源</button>
        </div>

        <div class="sim-pane" data-pane="sec">
          <div class="sim-row"><span>待处置事件</span><b class="warn" id="sim-pend">2</b></div>
          <div id="sim-events"></div>
        </div>

        <div class="sim-pane" data-pane="dispatch">
          <div class="sim-pick">
            <select id="sim-team">
              <option>网络安全组</option><option>安全播出组</option>
              <option>动力环境组</option><option>安保组</option>
            </select>
            <select id="sim-level"><option>一般</option><option>紧急</option></select>
          </div>
          <button class="sim-btn" id="sim-dispatch">派发处置工单</button>
          <button class="sim-btn warn" id="sim-radio">对讲呼叫值班组</button>
          <div id="sim-tickets"></div>
        </div>

        <div class="sim-pane" data-pane="phone">
          <div class="sim-row"><span>调度电话</span><b id="sim-phone-state">空闲</b></div>
          <div class="sim-row"><span>通话计时</span><b id="sim-phone-t">00:00</b></div>
          <button class="sim-btn" id="sim-ring">模拟来电</button>
          <div class="sim-call" id="sim-call">
            <div class="num" id="sim-call-num">0769-8888 6001</div>
            <div class="from">省公司 · 安全播出调度中心</div>
            <div class="acts">
              <button class="sim-btn" id="sim-answer" style="margin:0">接听</button>
              <button class="sim-btn danger" id="sim-hangup" style="margin:0" disabled>挂断</button>
            </div>
          </div>
          <div class="sim-row" style="margin-top:8px"><span>今日通话</span><b id="sim-calls">0 次</b></div>
        </div>
      </div>
      <div class="sim-log">
        <h5>处置流水</h5>
        <ul id="sim-log-list"></ul>
      </div>
    </div>
    <div class="sim-toast" id="sim-toast"></div>
  `;
  document.body.appendChild(root);

  const $ = id => document.getElementById(id);
  const dock = $('sim-dock');
  const toastEl = $('sim-toast');
  let toastTimer = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  const banner = document.getElementById('banner');
  let bannerTimer = 0;
  function bannerMsg(html, ms = 4600) {
    if (!banner) return;
    // 告警横幅正在展示时不覆盖它
    if (banner.dataset.alarm) return;
    banner.innerHTML = html;
    banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      if (!banner.dataset.alarm) banner.classList.remove('show');
    }, ms);
  }

  function log(text) {
    const ul = $('sim-log-list');
    const li = document.createElement('li');
    li.innerHTML = `<span>${now()}</span>${text}`;
    ul.prepend(li);
    while (ul.children.length > 30) ul.lastChild.remove();
  }

  /* ---------- 面板切换 ---------- */
  root.querySelectorAll('.sim-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.sim-tabs button').forEach(b => b.classList.toggle('on', b === btn));
      root.querySelectorAll('.sim-pane').forEach(p => p.classList.toggle('on', p.dataset.pane === btn.dataset.tab));
    });
  });
  /* 打开处置台（可指定默认页签） */
  function openDock(tab) {
    dock.classList.add('open');
    $('sim-fab').style.display = 'none';
    if (tab) {
      const btn = root.querySelector(`.sim-tabs button[data-tab="${tab}"]`);
      if (btn) btn.click();
    }
  }

  $('sim-fab').addEventListener('click', () => openDock());
  $('sim-x').addEventListener('click', () => {
    dock.classList.remove('open');
    $('sim-fab').style.display = '';
  });

  /* ---------- 信源切换 ---------- */
  let onStandby = false;
  let switching = false;
  const srcLabel = $('sim-src');
  const btnSwitch = $('sim-switch');
  const btnRestore = $('sim-restore');

  function switchSource(toStandby) {
    if (switching) return;
    switching = true;
    emit('switch');
    let n = 3;
    const target = toStandby ? '备用' : '主用';
    const run = () => {
      btnSwitch.textContent = `切换中 · ${n}s`;
      if (n-- > 0) {
        setTimeout(run, 800);
        return;
      }
      onStandby = toStandby;
      srcLabel.textContent = toStandby ? '备用 · 省干 OTN B 平面' : '主用 · 省干 OTN A 平面';
      srcLabel.className = toStandby ? 'warn' : '';
      btnSwitch.disabled = toStandby;
      btnRestore.disabled = !toStandby;
      btnSwitch.textContent = '切换至备用信源';
      switching = false;
      log(`数字电视平台信源切换 → ${target}，播出无中断`);
      toast(`已切换至${target}信源，EPG 与码流校验通过`);
      emit('switch');
      bannerMsg(`<b>操作完成</b> · 数字电视平台已切换至${target}信源，输出码流正常，请值班员复核`);
      update({ standby: toStandby });
    };
    log(`发起信源切换：${toStandby ? '主用 → 备用' : '备用 → 主用'}，等待人工确认`);
    setTimeout(run, 500);
  }

  btnSwitch.addEventListener('click', () => switchSource(true));
  btnRestore.addEventListener('click', () => switchSource(false));

  /* ---------- 安全事件处置 ---------- */
  const events = [
    { id: 'SEC-2411-01', time: '10:42', level: '中', title: '边界防火墙：境外 IP 高频 SSH 暴力破解', state: 0 },
    { id: 'SEC-2411-02', time: '10:47', level: '高', title: '终端 EDR：可疑挖矿进程外联矿池域名', state: 0 },
    { id: 'SEC-2411-03', time: '10:51', level: '低', title: '播出网：非法组播源探测（已限速）', state: 2 }
  ];
  let pending = events.filter(e => e.state < 2).length;

  function paintPending() {
    const el = $('sim-pend');
    if (el) {
      el.textContent = pending;
      el.className = pending > 0 ? 'bad' : 'ok';
    }
  }

  function refreshOps() {
    /* 待处置数写回 store，由 ui.js 统一渲染 HUD 卡片 */
    update({ pending });
    paintPending();
  }

  /* 告警演练会临时改写待处置数，这里跟随 store 回写，避免两处计数打架 */
  subscribe(m => {
    if (m.pending !== pending) {
      pending = m.pending;
      paintPending();
    }
  });

  function renderEvents() {
    const box = $('sim-events');
    box.innerHTML = '';
    events.forEach(ev => {
      const div = document.createElement('div');
      div.className = 'sim-item' + (ev.state === 2 ? ' done' : '');
      const stateText = ev.state === 0 ? '待确认' : ev.state === 1 ? '已确认' : '已处置';
      const stateCls = ev.state === 0 ? 'warn' : ev.state === 1 ? '' : 'ok';
      div.innerHTML = `
        <h4>${ev.title}</h4>
        <div class="meta"><span>${ev.id}</span><span>${ev.time}</span>
          <em>${ev.level}危</em><span style="margin-left:auto" class="${stateCls}">${stateText}</span></div>
        <div class="acts">
          ${ev.state === 0 ? `<button data-act="ack" data-id="${ev.id}">确认告警</button>` : ''}
          ${ev.state === 1 ? `<button data-act="fix" data-id="${ev.id}">执行封禁处置</button>` : ''}
        </div>`;
      box.appendChild(div);
    });
    box.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        const ev = events.find(x => x.id === b.dataset.id);
        if (!ev) return;
        if (b.dataset.act === 'ack') {
          ev.state = 1;
          pending = Math.max(0, pending - 1);
          log(`确认安全告警 ${ev.id}，已通知网络安全组`);
          toast('告警已确认，进入处置流程');
          emit('ack');
        } else {
          ev.state = 2;
          update({ blocked: metrics.blocked + 1 });
          log(`完成封禁处置 ${ev.id}，策略已下发至边界防火墙`);
          toast('封禁策略已下发，事件闭环');
          emit('fix');
        }
        renderEvents();
        refreshOps();
      });
    });
  }
  renderEvents();
  refreshOps();

  /* ---------- 调度派单 ---------- */
  let ticketSeq = 21;
  const ticketList = [];
  $('sim-dispatch').addEventListener('click', () => {
    const team = $('sim-team').value;
    const level = $('sim-level').value;
    const no = `WO-20261121-${pad(ticketSeq++)}`;
    ticketList.unshift({ no, team, level });
    const box = $('sim-tickets');
    box.innerHTML = ticketList.slice(0, 3).map(t => `
      <div class="sim-row"><span>${t.no}</span><b class="${t.level === '紧急' ? 'bad' : 'ok'}">${t.team} · ${t.level}</b></div>
    `).join('');
    log(`派发工单 ${no} → ${team}（${level}）`);
    toast(`工单 ${no} 已推送至 ${team} 移动终端`);
    emit('dispatch');
    bannerMsg(`<b>调度指令</b> · ${no} 已派发至${team}，请 5 分钟内响应`);
  });

  $('sim-radio').addEventListener('click', () => {
    const team = $('sim-team').value;
    const btn = $('sim-radio');
    btn.disabled = true;
    btn.textContent = '对讲呼叫中…';
    log(`对讲呼叫 ${team}`);
    emit('radio');
    setTimeout(() => {
      btn.textContent = '对讲已接通 · 松开结束';
      toast(`${team} 应答：收到，正在前往现场`);
      log(`${team} 应答：收到，正在前往现场`);
    }, 1400);
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '对讲呼叫值班组';
      emit('hangup');
    }, 4200);
  });

  /* ---------- 电话 ---------- */
  let phoneState = 'idle'; // idle | ringing | talking
  let callTimer = 0;
  let callSeconds = 0;
  let calls = 0;

  function setPhone(state) {
    phoneState = state;
    const s = $('sim-phone-state');
    const answer = $('sim-answer');
    const hangup = $('sim-hangup');
    const call = $('sim-call');
    if (state === 'idle') {
      s.textContent = '空闲';
      s.className = '';
      call.classList.remove('show');
      answer.disabled = false;
      hangup.disabled = true;
      clearInterval(callTimer);
      $('sim-phone-t').textContent = '00:00';
      callSeconds = 0;
    } else if (state === 'ringing') {
      s.textContent = '来电振铃';
      s.className = 'warn';
      call.classList.add('show');
      $('sim-answer').disabled = false;
      $('sim-hangup').disabled = false;
    } else {
      s.textContent = '通话中';
      s.className = 'ok';
      $('sim-answer').disabled = true;
      $('sim-hangup').disabled = false;
    }
  }

  $('sim-ring').addEventListener('click', () => {
    if (phoneState !== 'idle') return;
    setPhone('ringing');
    log('调度电话来电：省公司安全播出调度中心');
    toast('来电振铃，请接听');
    emit('ring');
  });

  $('sim-answer').addEventListener('click', () => {
    if (phoneState !== 'ringing') return;
    calls += 1;
    $('sim-calls').textContent = `${calls} 次`;
    setPhone('talking');
    clearInterval(callTimer);
    callTimer = setInterval(() => {
      callSeconds += 1;
      $('sim-phone-t').textContent = `${pad(Math.floor(callSeconds / 60))}:${pad(callSeconds % 60)}`;
    }, 1000);
    log('接听调度电话，通报当前播出与网络安全状态');
    toast('已接通 · 正在通报值班情况');
    emit('answer');
  });

  $('sim-hangup').addEventListener('click', () => {
    if (phoneState === 'idle') return;
    log(`结束通话，通话时长 ${pad(Math.floor(callSeconds / 60))}:${pad(callSeconds % 60)}`);
    toast('通话已结束，记录已归档');
    setPhone('idle');
    emit('hangup');
  });

  /* 首次进入 25 秒后模拟一次来电，便于演示 */
  const autoRing = setTimeout(() => {
    if (phoneState === 'idle') {
      setPhone('ringing');
      log('调度电话来电：省公司安全播出调度中心');
      toast('演示来电 · 可在「电话」页接听');
      emit('ring');
    }
  }, 25000);

  log('值班处置台已就绪，等待操作');

  return {
    open: openDock,
    destroy() {
      clearTimeout(autoRing);
      clearInterval(callTimer);
      clearTimeout(toastTimer);
      clearTimeout(bannerTimer);
      root.remove();
      style.remove();
    }
  };
}
