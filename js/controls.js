import * as THREE from '../vendor/three.module.min.js';

/* 轻量轨道控制器：左键旋转、右键/Shift+左键平移、滚轮缩放、支持镜头飞行 */
export class Orbit {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.enabled = true;
    this.target = new THREE.Vector3(0, 1.55, -3.0);
    this.r = 10.5;
    this.theta = 0;
    this.phi = 1.32;

    this._drag = null;
    this._px = 0; this._py = 0;
    this._fly = null;
    this._tmp = new THREE.Vector3();

    dom.addEventListener('pointerdown', e => this.down(e));
    dom.addEventListener('pointermove', e => this.move(e));
    dom.addEventListener('pointerup', e => this.up(e));
    dom.addEventListener('pointercancel', e => this.up(e));
    dom.addEventListener('contextmenu', e => e.preventDefault());
    dom.addEventListener('wheel', e => this.wheel(e), { passive: false });
    this.apply();
  }

  down(e) {
    if (!this.enabled) return;
    if (e.button === 0 && !e.shiftKey) this._drag = 'rot';
    else if (e.button === 0 || e.button === 2 || e.button === 1) this._drag = 'pan';
    this._px = e.clientX; this._py = e.clientY;
    this.dom.setPointerCapture?.(e.pointerId);
    this._fly = null;
  }

  move(e) {
    if (!this.enabled || !this._drag) return;
    const dx = e.clientX - this._px, dy = e.clientY - this._py;
    this._px = e.clientX; this._py = e.clientY;

    if (this._drag === 'rot') {
      this.theta -= dx * 0.0045;
      this.phi = THREE.MathUtils.clamp(this.phi - dy * 0.0038, 0.22, 1.48);
    } else {
      const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
      const k = this.r * 0.0016;
      this.target.addScaledVector(right, -dx * k);
      this.target.addScaledVector(up, dy * k);
      this.clampTarget();
    }
    this.apply();
  }

  up() { this._drag = null; }

  wheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.r = THREE.MathUtils.clamp(this.r * (1 + Math.sign(e.deltaY) * 0.09), 2.2, 17);
    this.apply();
  }

  clampTarget() {
    this.target.x = THREE.MathUtils.clamp(this.target.x, -7.5, 7.5);
    this.target.y = THREE.MathUtils.clamp(this.target.y, 0.4, 3.0);
    this.target.z = THREE.MathUtils.clamp(this.target.z, -5.2, 5.0);
  }

  apply() {
    const s = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.r * s * Math.sin(this.theta),
      this.target.y + this.r * Math.cos(this.phi),
      this.target.z + this.r * s * Math.cos(this.theta)
    );
    this.camera.lookAt(this.target);
  }

  flyTo(pos, target, ms = 1100) {
    const startPos = this.camera.position.clone();
    const end = new THREE.Vector3(...pos);
    const dir = end.clone().sub(new THREE.Vector3(...target));
    const r = dir.length();
    const phi = Math.acos(THREE.MathUtils.clamp(dir.y / r, -1, 1));
    const theta = Math.atan2(dir.x, dir.z);

    // 选择最短旋转路径
    let dTheta = theta - this.theta;
    while (dTheta > Math.PI) dTheta -= Math.PI * 2;
    while (dTheta < -Math.PI) dTheta += Math.PI * 2;

    this._fly = {
      t0: performance.now(), ms,
      p0: startPos, p1: end,
      g0: this.target.clone(), g1: new THREE.Vector3(...target),
      r0: this.r, r1: r,
      th0: this.theta, th1: this.theta + dTheta,
      ph0: this.phi, ph1: phi
    };
  }

  update() {
    if (!this.enabled || !this._fly) return;
    const f = this._fly;
    const k = Math.min((performance.now() - f.t0) / f.ms, 1);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // easeInOutCubic

    this.target.lerpVectors(f.g0, f.g1, e);
    this.r = THREE.MathUtils.lerp(f.r0, f.r1, e);
    this.theta = THREE.MathUtils.lerp(f.th0, f.th1, e);
    this.phi = THREE.MathUtils.lerp(f.ph0, f.ph1, e);
    this.apply();

    if (k >= 1) this._fly = null;
  }
}

/* 第一人称行走：拖拽 360° 环视，点击地面 / WASD 前进 */
export class Walker {
  constructor(camera, dom, { groundAt, clamp } = {}) {
    this.camera = camera;
    this.dom = dom;
    this.groundAt = groundAt;
    this.clamp = clamp || (p => p);
    this.enabled = false;
    this.yaw = 0;
    this.pitch = 0;
    this.eye = 1.62;
    this.pos = new THREE.Vector3(0, 0, 4.2);
    this.speed = 2.5;
    this.target = null;
    this.keys = new Set();
    this._drag = null;
    this._px = 0; this._py = 0;
    this._down = null;
    this._bob = 0;
    this._yaw0 = 0;
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');

    dom.addEventListener('pointerdown', e => this.down(e));
    dom.addEventListener('pointermove', e => this.move(e));
    dom.addEventListener('pointerup', e => this.up(e));
    dom.addEventListener('pointercancel', e => { this._drag = null; this._down = null; });

    this._keydown = e => {
      if (!this.enabled) return;
      const k = e.code;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) {
        this.keys.add(k);
        this.target = null;
        e.preventDefault();
      }
    };
    this._keyup = e => this.keys.delete(e.code);
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
  }

  enter({ pos, yaw = 0, pitch = 0 } = {}) {
    if (pos) this.pos.set(pos[0], 0, pos[1]);
    this.yaw = yaw;
    this.pitch = pitch;
    this.target = null;
    this.keys.clear();
    this.enabled = true;
    this.clamp(this.pos);
    this.applyCamera();
  }

  exit() {
    this.enabled = false;
    this.target = null;
    this.keys.clear();
    this._drag = null;
    this._down = null;
  }

  down(e) {
    if (!this.enabled || e.button !== 0) return;
    this._drag = { x: e.clientX, y: e.clientY };
    this._down = { x: e.clientX, y: e.clientY };
    this.dom.setPointerCapture?.(e.pointerId);
  }

  move(e) {
    if (!this.enabled || !this._drag) return;
    const dx = e.clientX - this._drag.x;
    const dy = e.clientY - this._drag.y;
    this._drag.x = e.clientX;
    this._drag.y = e.clientY;
    this.yaw -= dx * 0.0034;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.003, -1.05, 1.05);
    this.applyCamera();
  }

  up(e) {
    if (!this.enabled || !this._down) return;
    const moved = Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y);
    this._drag = null;
    this._down = null;
    if (moved < 6 && this.groundAt) {
      const p = this.groundAt(e);
      if (p) {
        this.target = this.clamp(p);
        this.target.y = 0;
      }
    }
  }

  applyCamera() {
    this.camera.position.set(this.pos.x, this.eye + this._bob, this.pos.z);
    this._euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._euler);
  }

  update(dt) {
    if (!this.enabled) return;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let mx = 0, mz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) { mx += fx; mz += fz; }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) { mx -= fx; mz -= fz; }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) { mx -= rx; mz -= rz; }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) { mx += rx; mz += rz; }

    const len = Math.hypot(mx, mz);
    let step = 0;
    if (len > 0.001) {
      step = this.speed * dt;
      this.target = null;
      this.pos.x += (mx / len) * step;
      this.pos.z += (mz / len) * step;
    } else if (this.target) {
      const dx = this.target.x - this.pos.x;
      const dz = this.target.z - this.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.12) {
        this.target = null;
      } else {
        step = Math.min(this.speed * dt, dist);
        this.pos.x += (dx / dist) * step;
        this.pos.z += (dz / dist) * step;
      }
    }

    this.clamp(this.pos);

    const moving = step > 0.0005;
    this._bob += ((moving ? Math.sin(performance.now() * 0.011) * 0.018 : 0) - this._bob) * Math.min(1, dt * 8);
    this.applyCamera();
  }

  destroy() {
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
  }
}
