import { defer, EMPTY, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Apple } from "../items/Apple";
import { Feather } from "../items/Feather";
import { Fluff } from "../items/Fluff";
import { GreenHerb } from "../items/GreenHerb";
import { StickyMucus } from "../items/StickyMucus";
import { AudioSubject } from "../sounds/audio-subject";
import { loadPoringAttackAudio } from "../sounds/poring-attack";
import { loadPoringDamage } from "../sounds/poring-damage";
import { loadPoringDeadSound } from "../sounds/poring-dead";
import { loadPoringWalkSound } from "../sounds/poring-walk";
import { poporingLeftImage } from "../sprites/poporing-left-image";
import { poporingRightImage } from "../sprites/poporing-right-image";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class Poporing extends Monster {
  x = 100;
  y = 100;
  speedX = 60;
  speedY = 60;
  frameX = 0;
  frameY = 0;
  width = 50;
  height = 40;

  dps = 400;

  behaviorActions = this.walkingsAnyDirection(3000, 4000).concat([
    this.standingDuration(3000, 4000),
    this.standingDuration(2000, 4000),
  ]);

  frames: CropImage[][] = [
    // Standing
    [
      { order: 0, offsetX: 13, offsetY: 14, width: 37, height: 36 },
      {
        order: 1,
        offsetX: 69,
        offsetY: 13,
        width: 39,
        height: 37,
        marginLeftWidth: -1,
        marginLeftHeight: -1,
        marginRightWidth: 0,
        marginRightHeight: -1,
      },
      {
        order: 2,
        offsetX: 127,
        offsetY: 12,
        width: 41,
        height: 39,
        marginLeftWidth: -2,
        marginLeftHeight: -3,
        marginRightWidth: -1,
        marginRightHeight: -3,
      },
      {
        order: 3,
        offsetX: 187,
        offsetY: 17,
        width: 39,
        height: 33,
        marginLeftWidth: -1,
        marginLeftHeight: 3,
        marginRightWidth: 0,
        marginRightHeight: 3,
      },
    ],
    [
      // Walking
      {
        order: 0,
        offsetX: 12,
        offsetY: 79,
        width: 37,
        height: 31,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 1,
        offsetX: 67,
        offsetY: 81,
        width: 39,
        height: 30,
        marginLeftWidth: -1,
        marginLeftHeight: 6,
        marginRightWidth: -1,
        marginRightHeight: 6,
      },
      {
        order: 2,
        offsetX: 120,
        offsetY: 80,
        width: 41,
        height: 30,
        marginLeftWidth: -2,
        marginLeftHeight: 6,
        marginRightWidth: -2,
        marginRightHeight: 6,
      },
      {
        order: 3,
        offsetX: 176,
        offsetY: 78,
        width: 35,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 5,
        marginRightWidth: 1,
        marginRightHeight: 5,
      },
      {
        order: 4,
        offsetX: 228,
        offsetY: 76,
        width: 34,
        height: 34,
        marginLeftWidth: 2,
        marginLeftHeight: 2,
        marginRightWidth: 1,
        marginRightHeight: 2,
      },
      {
        order: 5,
        offsetX: 280,
        offsetY: 78,
        width: 36,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 6,
        offsetX: 335,
        offsetY: 79,
        width: 37,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 5,
        marginRightWidth: -1,
        marginRightHeight: 5,
      },
      {
        order: 7,
        offsetX: 393,
        offsetY: 81,
        width: 35,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 5,
        marginRightWidth: 1,
        marginRightHeight: 5,
      },

      {
        order: 8,
        offsetX: 12,
        offsetY: 79,
        width: 37,
        height: 31,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 9,
        offsetX: 67,
        offsetY: 81,
        width: 39,
        height: 30,
        marginLeftWidth: -1,
        marginLeftHeight: 6,
        marginRightWidth: -1,
        marginRightHeight: 6,
      },
      {
        order: 10,
        offsetX: 120,
        offsetY: 80,
        width: 41,
        height: 30,
        marginLeftWidth: -2,
        marginLeftHeight: 6,
        marginRightWidth: -2,
        marginRightHeight: 6,
      },
      {
        order: 11,
        offsetX: 176,
        offsetY: 78,
        width: 35,
        height: 31,
        marginLeftWidth: -1,
        marginLeftHeight: 3,
        marginRightWidth: 3,
        marginRightHeight: 3,
      },
      {
        order: 12,
        offsetX: 228,
        offsetY: 76,
        width: 34,
        height: 34,
        marginLeftWidth: -2,
        marginLeftHeight: -2,
        marginRightWidth: 4,
        marginRightHeight: -2,
      },
      {
        order: 13,
        offsetX: 280,
        offsetY: 78,
        width: 36,
        height: 31,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
        marginRightWidth: 0,
        marginRightHeight: 1,
      },
      {
        order: 14,
        offsetX: 335,
        offsetY: 79,
        width: 37,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 5,
        marginRightWidth: -1,
        marginRightHeight: 5,
      },
      {
        order: 15,
        offsetX: 393,
        offsetY: 81,
        width: 35,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 5,
        marginRightWidth: 1,
        marginRightHeight: 5,
      },
    ],
    [],
    [
      // Hurting/Die
      { order: 0, offsetX: 17, offsetY: 220, width: 37, height: 36 },
      {
        order: 1,
        offsetX: 75,
        offsetY: 224,
        width: 39,
        height: 32,
        marginLeftWidth: 1,
        marginLeftHeight: 4,
        marginRightWidth: -2,
        marginRightHeight: 4,
      },
      {
        order: 2,
        offsetX: 132,
        offsetY: 215,
        width: 62,
        height: 48,
        marginLeftWidth: -17,
        marginLeftHeight: -11,
        marginRightWidth: -7,
        marginRightHeight: -11,
      },
      {
        order: 3,
        offsetX: 221,
        offsetY: 204,
        width: 80,
        height: 66,
        marginLeftWidth: -28,
        marginLeftHeight: -30,
        marginRightWidth: -12,
        marginRightHeight: -30,
      },
      {
        order: 4,
        offsetX: 332,
        offsetY: 204,
        width: 85,
        height: 65,
        marginLeftWidth: -30,
        marginLeftHeight: -18,
        marginRightWidth: -15,
        marginRightHeight: -18,
      },
      {
        order: 5,
        offsetX: 449,
        offsetY: 221,
        width: 84,
        height: 28,
        marginLeftWidth: -30,
        marginLeftHeight: 19,
        marginRightWidth: -14,
        marginRightHeight: 19,
      },
    ],
  ];

  walkingAudio = new AudioSubject(this, loadPoringWalkSound());
  damagedAudio = new AudioSubject(this, loadPoringDamage());
  dyingAudio = new AudioSubject(this, loadPoringDeadSound());
  attackAudio = new AudioSubject(this, loadPoringAttackAudio());

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, poporingLeftImage, poporingRightImage);

    this.maxHp = 250;
    this.hp = this.maxHp;

    this.atk = 75;

    this.dropItems = [
      [GreenHerb, 10],
      [Apple, 15],
      [Apple, 10],
      [StickyMucus, 10],
    ];
  }

  getFrameEntry(frameY: number, frameX: number): CropImage {
    return this.frames[frameY][frameX];
  }

  standing(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(120, 0, 3);
    });
  }
  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 1;
      return this.forwardFrameX(50, 0, 7).pipe(
        tap({
          next: (frameX) => {
            if (frameX === 3) {
              this.walkingAudio.play();
            }
          },
        })
      );
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 3;
      return this.forwardFrameX(120, 0, 1, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 0) {
            this.damagedAudio.play();
          }
        })
      );
    });
  }

  dying(): Observable<any> {
    return defer(() => {
      this.frameY = 3;

      return this.forwardFrameX(100, 0, 5, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 2) {
            this.dyingAudio.play();
          }
        })
      );
    });
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 1;
      const minFrameX = 8;
      const maxFrameX = 15;
      return this.forwardFrameX(100, minFrameX, maxFrameX, {
        once: true,
      }).pipe(
        tap((frameX) => {
          if (frameX === 10) {
            this.attackAudio.play();
          } else if (frameX === 12) {
            if (this.direction === DIRECTION.RIGHT) {
              this.onDamageArea$.next({
                x: this.x + (this.width * 3) / 4,
                y: this.y,
                w: 40,
                h: 40,
              });
            } else if (this.direction === DIRECTION.LEFT) {
              this.onDamageArea$.next({
                x: this.x - this.width / 4,
                y: this.y,
                w: 40,
                h: 40,
              });
            }
          }
        })
      );
    });
  }
}
