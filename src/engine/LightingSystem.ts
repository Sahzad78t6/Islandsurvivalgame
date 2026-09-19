// Dynamic 2D Lighting Engine and 24-hour Day/Night Cycle

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  intensity: number; // 0 to 1
  color: string;
  flicker?: boolean;
}

export class LightingSystem {
  public timeOfDay: number = 0.4; // 0.0 to 1.0 (0.25=dawn, 0.5=noon, 0.75=dusk, 0.9=night)
  public timeSpeed: number = 0.005; // ~200 seconds per full 24h day
  public ambientDarkness: number = 0; // 0 (bright noon) to 0.92 (pitch black night)
  public ambientColor: string = 'rgba(10, 15, 30, 0)';
  public lightningFlash: number = 0; // 0 to 1

  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 1280;
    this.offscreenCanvas.height = 720;
    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context for lighting');
    this.offscreenCtx = ctx;
  }

  public update(dt: number) {
    this.timeOfDay = (this.timeOfDay + this.timeSpeed * dt) % 1.0;

    // Calculate ambient darkness & color based on time of day
    // 0.25 = sunrise (6am), 0.5 = noon (12pm), 0.75 = sunset (6pm), 0.9 = midnight
    if (this.timeOfDay >= 0.3 && this.timeOfDay <= 0.7) {
      // Day
      this.ambientDarkness = 0.05;
      this.ambientColor = 'rgba(15, 20, 35, 0.05)';
    } else if (this.timeOfDay > 0.7 && this.timeOfDay < 0.8) {
      // Sunset
      const t = (this.timeOfDay - 0.7) / 0.1;
      this.ambientDarkness = 0.05 + t * 0.75;
      this.ambientColor = `rgba(40, 20, 30, ${this.ambientDarkness})`;
    } else if (this.timeOfDay >= 0.8 || this.timeOfDay < 0.2) {
      // Deep Night
      this.ambientDarkness = 0.88;
      this.ambientColor = 'rgba(6, 10, 22, 0.88)';
    } else {
      // Dawn (0.2 to 0.3)
      const t = (this.timeOfDay - 0.2) / 0.1;
      this.ambientDarkness = 0.88 - t * 0.83;
      this.ambientColor = `rgba(35, 25, 40, ${this.ambientDarkness})`;
    }

    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.5);
    }
  }

  public triggerLightning(intensity: number = 1.0) {
    this.lightningFlash = intensity;
  }

  public getTimeString(): string {
    const totalHours = this.timeOfDay * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours - hours) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  public renderLighting(
    destCtx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    lights: LightSource[],
    worldToScreen: (wx: number, wy: number) => { x: number; y: number }
  ) {
    // If it's pure daytime and no special darkness, return
    let darkness = this.ambientDarkness;
    if (this.lightningFlash > 0) {
      darkness = Math.max(0, darkness - this.lightningFlash * 0.9);
    }

    if (darkness <= 0.06 && lights.length === 0) return;

    if (this.offscreenCanvas.width !== screenWidth || this.offscreenCanvas.height !== screenHeight) {
      this.offscreenCanvas.width = screenWidth;
      this.offscreenCanvas.height = screenHeight;
    }

    const oCtx = this.offscreenCtx;
    oCtx.clearRect(0, 0, screenWidth, screenHeight);

    // 1. Fill with ambient night darkness
    oCtx.fillStyle = `rgba(8, 12, 24, ${darkness})`;
    oCtx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. Cut out light holes using 'destination-out'
    oCtx.globalCompositeOperation = 'destination-out';

    for (const light of lights) {
      const screenPos = worldToScreen(light.x, light.y);
      let r = light.radius;
      if (light.flicker) {
        r *= 0.92 + Math.random() * 0.16;
      }

      // Check if visible on screen
      if (
        screenPos.x + r < 0 ||
        screenPos.x - r > screenWidth ||
        screenPos.y + r < 0 ||
        screenPos.y - r > screenHeight
      ) {
        continue;
      }

      const grad = oCtx.createRadialGradient(
        screenPos.x, screenPos.y, r * 0.1,
        screenPos.x, screenPos.y, r
      );
      grad.addColorStop(0, `rgba(0, 0, 0, ${light.intensity})`);
      grad.addColorStop(0.5, `rgba(0, 0, 0, ${light.intensity * 0.6})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      oCtx.fillStyle = grad;
      oCtx.beginPath();
      oCtx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
      oCtx.fill();
    }

    oCtx.globalCompositeOperation = 'source-over';

    // 3. Draw light colored warmth halos
    for (const light of lights) {
      const screenPos = worldToScreen(light.x, light.y);
      let r = light.radius;
      if (light.flicker) r *= 0.94 + Math.random() * 0.12;

      const warmGrad = oCtx.createRadialGradient(
        screenPos.x, screenPos.y, 0,
        screenPos.x, screenPos.y, r * 0.7
      );
      warmGrad.addColorStop(0, light.color);
      warmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      oCtx.fillStyle = warmGrad;
      oCtx.beginPath();
      oCtx.arc(screenPos.x, screenPos.y, r * 0.7, 0, Math.PI * 2);
      oCtx.fill();
    }

    // 4. Composite darkness mask onto main screen
    destCtx.drawImage(this.offscreenCanvas, 0, 0);

    // 5. If lightning flash is active, draw a brilliant white screen tint
    if (this.lightningFlash > 0.05) {
      destCtx.fillStyle = `rgba(230, 245, 255, ${this.lightningFlash * 0.4})`;
      destCtx.fillRect(0, 0, screenWidth, screenHeight);
    }
  }
}

