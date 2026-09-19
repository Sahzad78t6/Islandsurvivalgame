import { Vector2 } from '../engine/Vector2';

export class MobileControls {
  private container: HTMLElement | null = null;
  public inputVector: Vector2 = new Vector2(0, 0);
  public isSprinting: boolean = false;
  public isEnabled: boolean = true;
  public isForcedLandscape: boolean = false;

  private joystickActive: boolean = false;
  private joystickTouchId: number | null = null;
  private joystickStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private maxRadius: number = 48; // Max thumb displacement

  private joystickThumbEl: HTMLElement | null = null;

  public onAttack: () => void = () => {};
  public onInteract: () => void = () => {};
  public onBuild: () => void = () => {};
  public onInventory: () => void = () => {};
  public onToggleOrientation: () => void = () => {};

  constructor() {
    this.isEnabled = true;
    this.buildUI();
    this.setupEvents();
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
      <!-- In-game Touch HUD Layer -->
      <div id="mobile-touch-layer" class="mobile-touch-layer" style="display: none;">
        <!-- Left Virtual Joystick -->
        <div id="mobile-joystick-zone" class="mobile-joystick-zone">
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
          <button id="btn-mobile-rot" class="mobile-mini-btn" title="Toggle Horizontal Mode">🔄</button>
          <button id="btn-mobile-fs" class="mobile-mini-btn" title="Toggle Fullscreen">⛶</button>
        </div>

        <!-- Right Action Buttons Arc -->
        <div class="mobile-action-cluster">
          <!-- Sprint Toggle -->
          <button id="btn-touch-sprint" class="touch-action-btn btn-sprint" title="Sprint">
            <span class="btn-icon">⚡</span>
            <span class="btn-lbl">SPRINT</span>
          </button>

          <!-- Build Toggle -->
          <button id="btn-touch-build" class="touch-action-btn btn-build" title="Build Menu [B]">
            <span class="btn-icon">🔨</span>
            <span class="btn-lbl">BUILD</span>
          </button>

          <!-- Backpack / Crafting -->
          <button id="btn-touch-bag" class="touch-action-btn btn-bag" title="Inventory / Crafting [TAB]">
            <span class="btn-icon">🎒</span>
            <span class="btn-lbl">BAG</span>
          </button>

          <!-- Interact / Gather / Drink -->
          <button id="btn-touch-interact" class="touch-action-btn btn-interact" title="Interact [E]">
            <span class="btn-icon">🖐️</span>
            <span class="btn-lbl">USE [E]</span>
          </button>

          <!-- Primary Attack / Harvest (Large) -->
          <button id="btn-touch-attack" class="touch-action-btn btn-attack" title="Attack / Chop / Mine">
            <span class="btn-icon">⚔️</span>
            <span class="btn-lbl">ATTACK</span>
          </button>
        </div>
      </div>
    `;

    this.joystickThumbEl = document.getElementById('mobile-joystick-thumb');
  }

  private setupEvents() {
    // 1. Fullscreen / Landscape button
    const reqFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen?.();
        } else {
          await document.exitFullscreen?.();
        }
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (err) {
        console.log('Fullscreen info:', err);
      }
    };

    document.getElementById('btn-mobile-fs')?.addEventListener('click', reqFullscreen);
    document.getElementById('btn-mobile-rot')?.addEventListener('click', () => {
      this.onToggleOrientation();
    });

    // 2. Virtual Joystick Touch Logic
    const zone = document.getElementById('mobile-joystick-zone');
    if (zone) {
      zone.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        if (this.joystickActive) return;
        const touch = e.changedTouches[0];
        this.joystickActive = true;
        this.joystickTouchId = touch.identifier;
        this.joystickStartPos = { x: touch.clientX, y: touch.clientY };
        this.handleMove(touch.clientX, touch.clientY);
      }, { passive: false });

      const moveHandler = (e: TouchEvent) => {
        if (!this.joystickActive) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.joystickTouchId) {
            e.preventDefault();
            this.handleMove(touch.clientX, touch.clientY);
            break;
          }
        }
      };

      const endHandler = (e: TouchEvent) => {
        if (!this.joystickActive) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.joystickTouchId) {
            e.preventDefault();
            this.resetJoystick();
            break;
          }
        }
      };

      zone.addEventListener('touchmove', moveHandler, { passive: false });
      zone.addEventListener('touchend', endHandler, { passive: false });
      zone.addEventListener('touchcancel', endHandler, { passive: false });
      window.addEventListener('touchend', endHandler, { passive: false });
    }

    // 3. Action Buttons Hookup
    const bindTouchAction = (id: string, onTrigger: () => void) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        onTrigger();
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      }, { passive: false });
      btn.addEventListener('touchcancel', () => btn.classList.remove('active'));
    };

    bindTouchAction('btn-touch-attack', () => this.onAttack());
    bindTouchAction('btn-touch-interact', () => this.onInteract());
    bindTouchAction('btn-touch-build', () => this.onBuild());
    bindTouchAction('btn-touch-bag', () => this.onInventory());

    const sprintBtn = document.getElementById('btn-touch-sprint');
    if (sprintBtn) {
      sprintBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isSprinting = !this.isSprinting;
        sprintBtn.classList.toggle('active-sprint', this.isSprinting);
      }, { passive: false });
    }
  }

  private handleMove(clientX: number, clientY: number) {
    const rawDx = clientX - this.joystickStartPos.x;
    const rawDy = clientY - this.joystickStartPos.y;

    // If game is rotated 90deg clockwise, translate coordinates into game local space
    const dx = this.isForcedLandscape ? rawDy : rawDx;
    const dy = this.isForcedLandscape ? -rawDx : rawDy;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      this.inputVector.set(0, 0);
      if (this.joystickThumbEl) this.joystickThumbEl.style.transform = 'translate(0px, 0px)';
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, this.maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (this.joystickThumbEl) {
      this.joystickThumbEl.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    const intensity = clampedDist / this.maxRadius;
    this.inputVector.set(Math.cos(angle) * intensity, Math.sin(angle) * intensity);

    if (intensity > 0.85) {
      this.isSprinting = true;
      const sprintBtn = document.getElementById('btn-touch-sprint');
      sprintBtn?.classList.add('active-sprint');
    }
  }

  private resetJoystick() {
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.inputVector.set(0, 0);
    if (this.joystickThumbEl) {
      this.joystickThumbEl.style.transform = 'translate(0px, 0px)';
    }
  }

  public setForcedLandscape(forced: boolean) {
    this.isForcedLandscape = forced;
  }

  public setVisible(visible: boolean) {
    const layer = document.getElementById('mobile-touch-layer');
    if (layer) {
      layer.style.display = visible ? 'block' : 'none';
    }
  }

  public getVector(): Vector2 {
    return this.inputVector;
  }
}
