import { defer, Observable, tap } from "rxjs";
import { AudioSubject } from "../sounds/audio-subject";
import { loadBaphometAttackAudio } from "../sounds/baphomet-attack";
import { loadBaphometBreath } from "../sounds/baphomet-breath";
import { loadBaphometDamagedAudio } from "../sounds/baphomet-damaged";
import { loadBaphometDeadAudio } from "../sounds/baphomet-dead";
import { baphometJrLeftImage } from "../sprites/baphomet-jr-left-image";
import { baphometJrRightImage } from "../sprites/baphomet-jr-right-image";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class BaphometJr extends Monster {
  x = 300;
  y = 300;
  speedX = 100;
  speedY = 100;
  frameX = 0;
  frameY = 0;

  width = 38;
  height = 57;

  respawnTimeMin = 12000;
  respawnTimeMax = 25000;

  atk = 50;
  visionRange = 120;
  trackRange = 300;
  isAggressiveOnVision = true;
  dps = 300;

  behaviorActions = this.walkingsAnyDirection(1000, 2000).concat([
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
  ]);

  attackAudio = new AudioSubject(this, loadBaphometAttackAudio());
  // breathAudio = new AudioSubject(this, loadBaphometBreath());
  // damagedAudio = new AudioSubject(this, loadBaphometDamagedAudio());
  // deadAudio = new AudioSubject(this, loadBaphometDeadAudio());

  frames: CropImage[][] = [
    // Standing
    [
      { order: 0, offsetX: 192, offsetY: 6, width: 38, height: 57 },
      {
        order: 1,
        offsetX: 247,
        offsetY: 7,
        width: 38,
        height: 56,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
        marginRightWidth: 0,
        marginRightHeight: 1,
      },
      {
        order: 2,
        offsetX: 303,
        offsetY: 7,
        width: 38,
        height: 55,
        marginLeftWidth: 0,
        marginLeftHeight: 2,
        marginRightWidth: 0,
        marginRightHeight: 2,
      },
      {
        order: 3,
        offsetX: 354,
        offsetY: 8,
        width: 37,
        height: 54,
        marginLeftWidth: 1,
        marginLeftHeight: 3,
        marginRightWidth: 1,
        marginRightHeight: 3,
      },
    ],
    // Walking
    [
      {
        order: 0,
        offsetX: 7,
        offsetY: 78,
        width: 24,
        height: 46,
        marginLeftWidth: 14,
        marginLeftHeight: 11,
        marginRightWidth: 0,
        marginRightHeight: 11,
      },
      {
        order: 1,
        offsetX: 48,
        offsetY: 79,
        width: 24,
        height: 44,
        marginLeftWidth: 14,
        marginLeftHeight: 11,
        marginRightWidth: 0,
        marginRightHeight: 11,
      },
      {
        order: 2,
        offsetX: 89,
        offsetY: 78,
        width: 24,
        height: 45,
        marginLeftWidth: 14,
        marginLeftHeight: 11,
        marginRightWidth: 0,
        marginRightHeight: 11,
      },
    ],
    // Attacking
    [
      {
        order: 0,
        offsetX: 6,
        offsetY: 140,
        width: 24,
        height: 44,
        marginLeftWidth: 14,
        marginLeftHeight: 13,
        marginRightWidth: 0,
        marginRightHeight: 13,
      },
      {
        order: 1,
        offsetX: 47,
        offsetY: 140,
        width: 24,
        height: 44,
        marginLeftWidth: 14,
        marginLeftHeight: 13,
        marginRightWidth: 0,
        marginRightHeight: 13,
      },
      {
        order: 2,
        offsetX: 86,
        offsetY: 140,
        width: 24,
        height: 43,
        marginLeftWidth: 15,
        marginLeftHeight: 14,
        marginRightWidth: 0,
        marginRightHeight: 14,
      },
      {
        order: 3,
        offsetX: 126,
        offsetY: 140,
        width: 25,
        height: 44,
        marginLeftWidth: 12,
        marginLeftHeight: 13,
        marginRightWidth: 0,
        marginRightHeight: 13,
      },
      {
        order: 4,
        offsetX: 169,
        offsetY: 140,
        width: 25,
        height: 43,
        marginLeftWidth: 12,
        marginLeftHeight: 14,
        marginRightWidth: 0,
        marginRightHeight: 14,
      },
    ],
    //Hurting / Dying
    [
      {
        order: 0,
        offsetX: 7,
        offsetY: 203,
        width: 27,
        height: 44,
        marginLeftWidth: 12,
        marginLeftHeight: 13,
        marginRightWidth: 0,
        marginRightHeight: 13,
      },
      {
        order: 1,
        offsetX: 45,
        offsetY: 207,
        width: 35,
        height: 40,
        marginLeftWidth: 18,
        marginLeftHeight: 26,
        marginRightWidth: -14,
        marginRightHeight: 26,
      },
    ],
    // Slash
    [
      { order: 0, offsetX: 105, offsetY: 277, width: 42, height: 75 },
      { order: 1, offsetX: 167, offsetY: 295, width: 40, height: 40 },
      // Scythe
      { order: 2, offsetX: 309, offsetY: 289, width: 33, height: 52 },
      { order: 3, offsetX: 367, offsetY: 289, width: 37, height: 50 },
    ],
  ];

  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, baphometJrLeftImage, baphometJrRightImage);

    this.maxHp = 250;
    this.hp = this.maxHp;

    this.dropItems = [];
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      return this.forwardFrameX(150, 0, 4, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 3) {
            this.attackAudio.play();
          }
          if (frameX === 4) {
            if (this.direction === DIRECTION.LEFT) {
              this.onDamageArea$.next({
                x: this.x - this.width / 4,
                y: this.y + this.height / 4,
                w: 60,
                h: 60,
              });
            } else if (this.direction === DIRECTION.RIGHT) {
              this.onDamageArea$.next({
                x: this.x + (this.width * 3) / 4,
                y: this.y,
                w: 60,
                h: 60,
              });
            }
          }
        })
      );
    });
  }

  walking() {
    return defer(() => {
      this.frameY = 1;
      return this.forwardFrameX(50, 0, 2);
    });
  }

  standing() {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(120, 0, 3);
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 3;
      return this.forwardFrameX(130, 0, 0, { once: true });
    });
  }

  dying() {
    return defer(() => {
      this.frameY = 3;
      return this.forwardFrameX(130, 0, 1, { once: true });
    });
  }
}
