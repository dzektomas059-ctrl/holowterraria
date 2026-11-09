/**
 * Hollowfall - Unified Input Manager (Keyboard, Mouse, Wheel & Mobile Touch)
 * Отслеживание непрерывных нажатий, единичных импульсов (justPressed), мыши и виртуального джойстика
 */

export class InputManager {
  // Continuous held keys
  private keysHeld: Set<string> = new Set();
  // Edge-triggered single frame actions
  private keysJustPressed: Set<string> = new Set();

  // Mouse & Viewport
  public mouseScreenX: number = 0;
  public mouseScreenY: number = 0;
  public mouseLeftHeld: boolean = false;
  public mouseLeftJustPressed: boolean = false;
  public mouseRightHeld: boolean = false;
  public mouseRightJustPressed: boolean = false;
  public wheelDelta: number = 0;

  // Touch controls state
  public touchStick: { active: boolean; dx: number; dy: number } = { active: false, dx: 0, dy: 0 };
  public touchJump: boolean = false;
  public touchJumpJustPressed: boolean = false;
  public touchPhaseShift: boolean = false;
  public touchHook: boolean = false;
  public isTouchDevice: boolean = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling with Space or Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keysHeld.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keysHeld.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysHeld.clear();
      this.keysJustPressed.clear();
      this.mouseLeftHeld = false;
      this.mouseRightHeld = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreenX = e.clientX;
      this.mouseScreenY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseLeftHeld = true;
        this.mouseLeftJustPressed = true;
      } else if (e.button === 2) {
        this.mouseRightHeld = true;
        this.mouseRightJustPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseLeftHeld = false;
      if (e.button === 2) this.mouseRightHeld = false;
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Disable browser right-click menu
    });

    window.addEventListener('wheel', (e) => {
      this.wheelDelta = Math.sign(e.deltaY);
    }, { passive: true });

    // Touch support detection
    window.addEventListener('touchstart', () => {
      this.isTouchDevice = true;
    }, { once: true });
  }

  public endFrame(): void {
    this.keysJustPressed.clear();
    this.mouseLeftJustPressed = false;
    this.mouseRightJustPressed = false;
    this.touchJumpJustPressed = false;
    this.touchPhaseShift = false;
    this.touchHook = false;
    this.wheelDelta = 0;
  }

  public isHeld(code: string): boolean {
    return this.keysHeld.has(code);
  }

  public isJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  public getMoveLeft(): boolean {
    return this.isHeld('KeyA') || this.isHeld('ArrowLeft') || (this.touchStick.active && this.touchStick.dx < -0.3);
  }

  public getMoveRight(): boolean {
    return this.isHeld('KeyD') || this.isHeld('ArrowRight') || (this.touchStick.active && this.touchStick.dx > 0.3);
  }

  public getMoveUp(): boolean {
    return this.isHeld('KeyW') || this.isHeld('ArrowUp') || (this.touchStick.active && this.touchStick.dy < -0.4);
  }

  public getMoveDown(): boolean {
    return this.isHeld('KeyS') || this.isHeld('ArrowDown') || (this.touchStick.active && this.touchStick.dy > 0.4);
  }

  public getJump(): boolean {
    return this.isHeld('Space') || this.isHeld('KeyW') || this.touchJump;
  }

  public getJumpJustPressed(): boolean {
    return this.isJustPressed('Space') || this.isJustPressed('KeyW') || this.touchJumpJustPressed;
  }

  public getPhaseShift(): boolean {
    return this.isJustPressed('KeyQ') || this.touchPhaseShift;
  }

  public getGrapple(): boolean {
    return this.isJustPressed('KeyE') || this.touchHook;
  }

  public getInventoryToggle(): boolean {
    return this.isJustPressed('Tab') || this.isJustPressed('KeyI') || this.isJustPressed('KeyE');
  }

  public getMapToggle(): boolean {
    return this.isJustPressed('KeyM');
  }

  public getDebugToggle(): boolean {
    return this.isJustPressed('F3');
  }

  public getPauseToggle(): boolean {
    return this.isJustPressed('Escape') || this.isJustPressed('KeyP');
  }
}
