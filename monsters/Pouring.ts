import { defer, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AquaMarine } from "../items/AquaMarine";
import { Jellopy } from "../items/Jellopy";
import { RedPotion } from "../items/RedPotion";
import { StickyMucus } from "../items/StickyMucus";
import { WhiteHerb } from "../items/WhiteHerb";
import { WhitePotion } from "../items/WhitePotion";
import { AudioSubject } from "../sounds/audio-subject";
import { loadPoringAttackAudio } from "../sounds/poring-attack";
import { loadPoringDamage } from "../sounds/poring-damage";
import { loadPoringDeadSound } from "../sounds/poring-dead";
import { loadPoringWalkSound } from "../sounds/poring-walk";
import { pouringSpriteLeftImage } from "../sprites/pouring-sprite-left";
import { pouringSpriteRightImage } from "../sprites/pouring-sprite-right";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class Pouring extends Monster {
  x = 100;
  y = 100;
  atk = 90;
  speedX = 80;
  speedY = 80;
  frameX = 0;
  frameY = 0;
  width = 37;
  height = 35;

  attackRange = 25;
  visionRange = 150;
  trackRange = 450;
  isAggressiveOnVision = true;
  dps = 300;
  respawnTimeMin = 15000;
  respawnTimeMax = 25000;
  isStealer = true;

  attackAudio = new AudioSubject(this, loadPoringAttackAudio());
  dyingAudio = new AudioSubject(this, loadPoringDeadSound());
  damagedAudio = new AudioSubject(this, loadPoringDamage());
  walkingAudio = new AudioSubject(this, loadPoringWalkSound());

  behaviorActions = this.walkingsAnyDirection(3000, 5000).concat([
    this.standingDuration(2000, 5000),
    this.standingDuration(2000, 5000),
  ]);

  frames: CropImage[][] = [
    [
      // Standing
      {
        order: 0,
        offsetX: 15,
        offsetY: 16,
        width: 37,
        height: 35,
        marginLeftWidth: 0,
        marginLeftHeight: 0,
      },
      {
        order: 1,
        offsetX: 72,
        offsetY: 15,
        width: 39,
        height: 37,
        marginLeftWidth: -2,
        marginLeftHeight: -2,
        marginRightWidth: 0,
        marginRightHeight: -2,
      },
      {
        order: 2,
        offsetX: 132,
        offsetY: 15,
        width: 41,
        height: 38,
        marginLeftWidth: -3,
        marginLeftHeight: -4,
        marginRightWidth: -1,
        marginRightHeight: -4,
      },
      {
        order: 3,
        offsetX: 198,
        offsetY: 22,
        width: 39,
        height: 33,
        marginLeftWidth: -2,
        marginLeftHeight: 2,
        marginRightWidth: 0,
        marginRightHeight: 2,
      },
    ],
    // Walking
    [
      { order: 0, offsetX: 15, offsetY: 16, width: 37, height: 35 },
      {
        order: 0,
        offsetX: 13,
        offsetY: 91,
        width: 37,
        height: 30,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 1,
        offsetX: 72,
        offsetY: 93,
        width: 39,
        height: 30,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 2,
        offsetX: 134,
        offsetY: 95,
        width: 40,
        height: 30,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 3,
        offsetX: 201,
        offsetY: 96,
        width: 35,
        height: 31,
        marginLeftWidth: 3,
        marginLeftHeight: 4,
        marginRightWidth: 2,
        marginRightHeight: 4,
      },
      {
        order: 4,
        offsetX: 261,
        offsetY: 96,
        width: 33,
        height: 33,
        marginLeftWidth: 4,
        marginLeftHeight: 1,
        marginRightWidth: 3,
        marginRightHeight: 1,
      },
      {
        order: 5,
        offsetX: 320,
        offsetY: 97,
        width: 36,
        height: 31,
        marginLeftWidth: 3,
        marginLeftHeight: 3,
        marginRightWidth: 1,
        marginRightHeight: 3,
      },
      {
        order: 6,
        offsetX: 383,
        offsetY: 101,
        width: 35,
        height: 31,
        marginLeftWidth: 3,
        marginLeftHeight: 3,
        marginRightWidth: 2,
        marginRightHeight: 3,
      },
      {
        order: 7,
        offsetX: 442,
        offsetY: 105,
        width: 35,
        height: 30,
        marginLeftWidth: 3,
        marginLeftHeight: 3,
        marginRightWidth: 2,
        marginRightHeight: 3,
      },

      {
        order: 8,
        offsetX: 13,
        offsetY: 91,
        width: 37,
        height: 30,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 9,
        offsetX: 72,
        offsetY: 93,
        width: 39,
        height: 30,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 10,
        offsetX: 134,
        offsetY: 95,
        width: 40,
        height: 30,
        marginLeftWidth: 0,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 11,
        offsetX: 201,
        offsetY: 96,
        width: 35,
        height: 31,
        marginLeftWidth: 0,
        marginLeftHeight: 2,
        marginRightWidth: 5,
        marginRightHeight: 2,
      },
      {
        order: 12,
        offsetX: 261,
        offsetY: 96,
        width: 33,
        height: 33,
        marginLeftWidth: -1,
        marginLeftHeight: -3,
        marginRightWidth: 7,
        marginRightHeight: -3,
      },
      {
        order: 13,
        offsetX: 320,
        offsetY: 97,
        width: 36,
        height: 31,
        marginLeftWidth: 1,
        marginLeftHeight: 0,
        marginRightWidth: 2,
        marginRightHeight: -1,
      },
      {
        order: 14,
        offsetX: 383,
        offsetY: 101,
        width: 35,
        height: 31,
        marginLeftWidth: 2,
        marginLeftHeight: 2,
        marginRightWidth: 1,
        marginRightHeight: 1,
      },
      {
        order: 15,
        offsetX: 442,
        offsetY: 105,
        width: 35,
        height: 30,
        marginLeftWidth: 3,
        marginLeftHeight: 3,
        marginRightWidth: 2,
        marginRightHeight: 3,
      },
    ],
    [],
    // Hurting / Die
    [
      { order: 0, offsetX: 17, offsetY: 237, width: 37, height: 35 },
      {
        order: 1,
        offsetX: 87,
        offsetY: 243,
        width: 39,
        height: 31,
        marginLeftWidth: -2,
        marginLeftHeight: 4,
        marginRightWidth: 0,
        marginRightHeight: 4,
      },
      {
        order: 2,
        offsetX: 151,
        offsetY: 239,
        width: 62,
        height: 48,
        marginLeftWidth: -20,
        marginLeftHeight: -12,
        marginRightWidth: -4,
        marginRightHeight: -11,
      },
      {
        order: 3,
        offsetX: 250,
        offsetY: 233,
        width: 80,
        height: 64,
        marginLeftWidth: -35,
        marginLeftHeight: -32,
        marginRightWidth: -11,
        marginRightHeight: -28,
      },
      {
        order: 4,
        offsetX: 389,
        offsetY: 236,
        width: 85,
        height: 65,
        marginLeftWidth: -38,
        marginLeftHeight: -22,
        marginRightWidth: -14,
        marginRightHeight: -18,
      },
      {
        order: 5,
        offsetX: 528,
        offsetY: 266,
        width: 84,
        height: 28,
        marginLeftWidth: -38,
        marginLeftHeight: 15,
        marginRightWidth: -13,
        marginRightHeight: 19,
      },
    ],
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, pouringSpriteLeftImage, pouringSpriteRightImage);

    this.maxHp = 350;
    this.hp = this.maxHp;

    this.dropItems = [
      [WhitePotion, 10],
      [AquaMarine, 20],
      [WhiteHerb, 15],
      [StickyMucus, 15],
    ];

    if (this.isStealer) {
      this.autoStealItemOnField();
    }

    this.walkingAudio.volume = 0.02;
  }

  standing(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(120, 0, 3);
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
      return this.forwardFrameX(80, minFrameX, maxFrameX, {
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
}
