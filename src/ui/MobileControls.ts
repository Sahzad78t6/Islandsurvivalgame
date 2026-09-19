// Modern Multi-Touch Virtual Controls for Mobile & Tablet (Pointer Events with Multitouch pointerId tracking)

import { Vector2 } from '../engine/Vector2';

export interface TouchControlSettings {
  joystickSize: 'small' | 'medium' | 'large';
  opacity: number; // 0.3 to 1.0
  leftHanded: boolean;
  haptics: boolean;
}

const SETTINGS_STORAGE_KEY = 'island_survival_touch_settings';

export class MobileControls {
  private container: HTMLElement | null = null;
  private joystickZoneEl: HTMLElement | null = null;
  private joystickBaseEl: HTMLElement | null = null;
  private joystickThumbEl: HTMLElement | null = null;
  private touchLayerEl: HTMLElement | null = null;

  public inputVector: Vector2 = new Vector2(0, 0);
  public isSprinting: boolean = false;
  public isTouchDevice: boolean = false;
  public isVisible: boolean = false;

  // Aiming / Touch cursor state
  public touchAimWorldPos: Vector2 | null = null;
  public isAiming: boolean = false;

  // Dynamic Joystick tracking
  private joystickPointerId: number | null = null;
  private joystickOrigin: { x: number; y: number } = { x: 0, y: 0 };
  private maxDisplacement: number = 52;
  private deadZone: number = 0.08;

  // Settings
  public settings: TouchControlSettings = {
    joystickSize: 'medium',
    opacity: 0.85,
    leftHanded: false,
    haptics: true
  };

  // Event Callbacks
  public onAttack: () => void = () => {};
  public onInteract: () => void = () => {};
  public onBuild: () => void = () => {};
  public onInventory: () => void = () => {};
  public onFullscreenToggle: () => void = () => {};
  public onAimMove: (screenX: number, screenY: number) => void = () => {};
  public onAimTap: (screenX: number, screenY: number) => void = () => {};

  constructor() {
    this.loadSettings();
    this.detectDeviceType();
    this.buildUI();
    this.setupPointerListeners();
    this.applySettingsToDOM();
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load touch settings:', e);
    }
  }

  public saveSettings(newSettings: Partial<TouchControlSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save touch settings:', e);
    }
    this.applySettingsToDOM();
  }

  private detectDeviceType() {
    // Detect coarse pointer or touch support
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouchPoints = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
    this.isTouchDevice = hasCoarsePointer || hasTouchPoints;

    // Listen for the first touch event on hybrid laptop/tablet devices
    const touchListener = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        this.isTouchDevice = true;
        if (this.isVisible) {
          this.setVisible(true);
        }
        window.removeEventListener('pointerdown', touchListener);
      }
    };
    window.addEventListener('pointerdown', touchListener, { passive: true });
  }

  public triggerHaptic(durationMs: number = 20) {
    if (this.settings.haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {
        // Ignore haptic errors on restricted browsers
      }
    }
  }

  private buildUI() {
    let host = document.getElementById('mobile-controls-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mobile-controls-root';
      document.body.appendChild(host);
    }
    this.container = host;

    this.container.innerHTML = `
      <div id="mobile-touch-layer" class="mobile-touch-layer" style="display: none;">
        <!-- Left Floating Dynamic Joystick Zone -->
        <div id="mobile-joystick-touch-zone" class="mobile-joystick-touch-zone" aria-label="Virtual Joystick">
          <div id="mobile-joystick-base" class="mobile-joystick-base">
            <div class="joystick-arrow-guide up">▲</div>
            <div class="joystick-arrow-guide down">▼</div>
            <div class="joystick-arrow-guide left">◀</div>
            <div class="joystick-arrow-guide right">▶</div>
            <div id="mobile-joystick-thumb" class="mobile-joystick-thumb">
              <span class="thumb-core"></span>
            </div>
          </div>
        </div>

        <!-- Top Right Utility Buttons -->
        <div class="mobile-quick-actions">
          <button id="btn-mobile-fs" class="mobile-mini-btn" title="Toggle Fullscreen" aria-label="Toggle Fullscreen">⛶</button>
        </div>

        <!-- Right Side Action Buttons Cluster -->
        <div id="mobile-action-cluster" class="mobile-action-cluster">
          <!-- Sprint Toggle -->
          <button id="btn-touch-sprint" class="touch-action-btn btn-sprint" title="Toggle Sprint" aria-label="Sprint">
            <span class="btn-icon">⚡</span>
            <span class="btn-lbl">SPRINT</span>
          </button>

          <!-- Build Toggle -->
          <button id="btn-touch-build" class="touch-action-btn btn-build" title="Build Blueprints [B]" aria-label="Build Menu">
            <span class="btn-icon">🔨</span>
            <span class="btn-lbl">BUILD</span>
          </button>

          <!-- Backpack / Crafting -->
          <button id="btn-touch-bag" class="touch-action-btn btn-bag" title="Backpack & Crafting [TAB]" aria-label="Backpack">
            <span class="btn-icon">🎒</span>
            <span class="btn-lbl">BAG</span>
          </button>

          <!-- Interact / Harvest / Drink / Revive -->
          <button id="btn-touch-interact" class="touch-action-btn btn-interact" title="Interact [E]" aria-label="Interact">
            <span class="btn-icon">🖐️</span>
            <span class="btn-lbl">USE [E]</span>
          </button>

          <!-- Primary Strike / Harvest (Large) -->
          <button id="btn-touch-attack" class="touch-action-btn btn-attack" title="Attack / Chop / Mine" aria-label="Attack">
            <span class="btn-icon">⚔️</span>
            <span class="btn-lbl">STRIKE</span>
          </button>
        </div>
      </div>
    `;

    this.touchLayerEl = document.getElementById('mobile-touch-layer');
    this.joystickZoneEl = document.getElementById('mobile-joystick-touch-zone');
    this.joystickBaseEl = document.getElementById('mobile-joystick-base');
    this.joystickThumbEl = document.getElementById('mobile-joystick-thumb');
  }

  private applySettingsToDOM() {
    if (!this.touchLayerEl) return;

    // Apply Opacity
    this.touchLayerEl.style.opacity = `${this.settings.opacity}`;

    // Apply Left Handed layout swap
    if (this.settings.leftHanded) {
      this.touchLayerEl.classList.add('left-handed-layout');
    } else {
      this.touchLayerEl.classList.remove('left-handed-layout');
    }

    // Apply Joystick Size
    const scale = this.settings.joystickSize === 'small' ? 0.85 : this.settings.joystickSize === 'large' ? 1.2 : 1.0;
    this.maxDisplacement = 52 * scale;
    if (this.joystickBaseEl) {
      this.joystickBaseEl.style.transform = `scale(${scale})`;
    }
  }

  private setupPointerListeners() {
    // 1. Dynamic Floating Joystick (Left Half / or Right Half if left-handed)
    const zone = this.joystickZoneEl;
    if (zone) {
      zone.addEventListener('pointerdown', (e: PointerEvent) => {
        if (this.joystickPointerId !== null) return;
        e.preventDefault();
        e.stopPropagation();

        this.joystickPointerId = e.pointerId;
        zone.setPointerCapture(e.pointerId);

        // Position joystick base dynamically at touch landing spot
        const rect = zone.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        this.joystickOrigin = { x: e.clientX, y: e.clientY };

        if (this.joystickBaseEl) {
          this.joystickBaseEl.style.display = 'flex';
          this.joystickBaseEl.style.left = `${startX}px`;
          this.joystickBaseEl.style.top = `${startY}px`;
          this.joystickBaseEl.classList.add('active');
        }

        this.handleJoystickMove(e.clientX, e.clientY);
        this.triggerHaptic(15);
      });

      zone.addEventListener('pointermove', (e: PointerEvent) => {
        if (e.pointerId !== this.joystickPointerId) return;
        e.preventDefault();
        e.stopPropagation();
        this.handleJoystickMove(e.clientX, e.clientY);
      });

      const endJoystick = (e: PointerEvent) => {
        if (e.pointerId !== this.joystickPointerId) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          zone.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        this.resetJoystick();
      };

      zone.addEventListener('pointerup', endJoystick);
      zone.addEventListener('pointercancel', endJoystick);
      zone.addEventListener('lostpointercapture', endJoystick);
    }

    // 2. Action Buttons Setup with Pointer Events & Multitouch Tracking
    const bindPointerAction = (id: string, onTrigger: () => void, isToggle: boolean = false) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      let currentPointer: number | null = null;

      btn.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        currentPointer = e.pointerId;
        try {
          btn.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }

        btn.classList.add('active');
        this.triggerHaptic(20);

        if (isToggle) {
          onTrigger();
        } else {
          onTrigger();
        }
      });

      const releaseBtn = (e: PointerEvent) => {
        if (currentPointer !== e.pointerId) return;
        e.preventDefault();
        e.stopPropagation();
        currentPointer = null;
        btn.classList.remove('active');
        try {
          btn.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      };

      btn.addEventListener('pointerup', releaseBtn);
      btn.addEventListener('pointercancel', releaseBtn);
      btn.addEventListener('lostpointercapture', releaseBtn);
    };

    bindPointerAction('btn-touch-attack', () => this.onAttack());
    bindPointerAction('btn-touch-interact', () => this.onInteract());
    bindPointerAction('btn-touch-build', () => this.onBuild());
    bindPointerAction('btn-touch-bag', () => this.onInventory());

    const sprintBtn = document.getElementById('btn-touch-sprint');
    if (sprintBtn) {
      bindPointerAction('btn-touch-sprint', () => {
        this.isSprinting = !this.isSprinting;
        sprintBtn.classList.toggle('active-sprint', this.isSprinting);
      }, true);
    }

    // Fullscreen Quick Button
    document.getElementById('btn-mobile-fs')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.triggerHaptic(25);
      this.onFullscreenToggle();
    });
  }

  private handleJoystickMove(clientX: number, clientY: number) {
    const dx = clientX - this.joystickOrigin.x;
    const dy = clientY - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      this.inputVector.set(0, 0);
      if (this.joystickThumbEl) {
        this.joystickThumbEl.style.transform = 'translate(0px, 0px)';
      }
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, this.maxDisplacement);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (this.joystickThumbEl) {
      this.joystickThumbEl.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    const rawIntensity = clampedDist / this.maxDisplacement;
    if (rawIntensity < this.deadZone) {
      this.inputVector.set(0, 0);
      return;
    }

    // Remap intensity from [deadZone, 1.0] to [0.0, 1.0]
    const normalizedIntensity = (rawIntensity - this.deadZone) / (1.0 - this.deadZone);
    this.inputVector.set(Math.cos(angle) * normalizedIntensity, Math.sin(angle) * normalizedIntensity);

    // Auto-sprint on deep thumb displacement
    if (normalizedIntensity > 0.9) {
      if (!this.isSprinting) {
        this.isSprinting = true;
        document.getElementById('btn-touch-sprint')?.classList.add('active-sprint');
      }
    }
  }

  private resetJoystick() {
    this.joystickPointerId = null;
    this.inputVector.set(0, 0);

    if (this.joystickThumbEl) {
      this.joystickThumbEl.style.transform = 'translate(0px, 0px)';
    }

    if (this.joystickBaseEl) {
      this.joystickBaseEl.classList.remove('active');
    }
  }

  public setVisible(visible: boolean) {
    this.isVisible = visible;
    const layer = document.getElementById('mobile-touch-layer');
    if (layer) {
      // Only show on touch devices or when explicitly activated
      const shouldShow = visible && this.isTouchDevice;
      layer.style.display = shouldShow ? 'block' : 'none';
    }
  }

  public getVector(): Vector2 {
    return this.inputVector;
  }
}
