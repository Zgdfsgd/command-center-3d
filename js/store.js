/* 演示指标单一数据源
   HUD 卡片、值班处置台、告警演练都从这里读写，避免三处各存一份数字导致互相覆盖。 */

export const metrics = {
  src: 12, srcTotal: 12,
  out: 386, outTotal: 386,
  attacks: 1284, blocked: 37, pending: 2,
  traffic: 42.6, loss: 0.02,
  health: 96,          // 播出链路健康度（%），只用于进度条
  standby: false,      // 数字电视平台是否使用备用信源
  alarm: false
};

const subs = new Set();

/** 订阅指标变化，立即回调一次以完成首次渲染；返回取消订阅函数 */
export function subscribe (fn) {
  subs.add(fn);
  fn(metrics);
  return () => subs.delete(fn);
}

/** 合并写入并通知订阅者 */
export function update (patch) {
  Object.assign(metrics, patch);
  subs.forEach(fn => fn(metrics));
}
