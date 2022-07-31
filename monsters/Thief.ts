import { defer, Observable } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { DoubleAttack } from "../skills/DoubleAttack";
import { AudioSubject } from "../sounds/audio-subject";
import { loadDaggerHitSound } from "../sounds/dagger-hit-sound";
import { loadThiefFamaleDamagedAudio } from "../sounds/thief-famale-damaged";
import { loadThiefFamaleDeadAudio } from "../sounds/thief-famale-dead";
import { thiefLeftSpriteImage } from "../sprites/load-thief-left";
import { loadLeftThiefDagger } from "../sprites/load-thief-left-dagger";
import { thiefRightSpriteImage } from "../sprites/load-thief-right";
import { loadRightThiefDagger } from "../sprites/load-thief-right-dagger";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class Thief extends Monster {
  atk = 18;
  x = 100;
  y = 100;
  speedX = 200;
  speedY = 200;
  frameX = 0;
  frameY = 0;
  width = 62;
  height = 94;

  attackSpeed = 140;

  dps = 0;
  showHpGauge = true;

  attackAudio = new AudioSubject(this, loadDaggerHitSound());
  damagedAudio = new AudioSubject(this, loadThiefFamaleDamagedAudio());
  deadAudio = new AudioSubject(this, loadThiefFamaleDeadAudio());

  frames: CropImage[][] = [
    [
      // Standing
      { order: 0, offsetX: 19, offsetY: 13, width: 62, height: 93 },
      {
        order: 1,
        offsetX: 119,
        offsetY: 13,
        width: 62,
        height: 94,
        marginLeftWidth: 0,
        marginLeftHeight: -1,
        marginRightWidth: 0,
        marginRightHeight: -1,
      },
      {
        order: 2,
        offsetX: 218,
        offsetY: 12,
        width: 64,
        height: 95,
        marginLeftWidth: -2,
        marginLeftHeight: -2,
        marginRightWidth: 0,
        marginRightHeight: -2,
      },
      {
        order: 3,
        offsetX: 317,
        offsetY: 12,
        width: 65,
        height: 95,
        marginLeftWidth: -3,
        marginLeftHeight: -2,
        marginRightWidth: 0,
        marginRightHeight: -2,
      },
      {
        order: 4,
        offsetX: 417,
        offsetY: 13,
        width: 65,
        height: 94,
        marginLeftWidth: -3,
        marginLeftHeight: -1,
        marginRightWidth: 0,
        marginRightHeight: -1,
      },
      { order: 5, offsetX: 519, offsetY: 13, width: 62, height: 93 },
    ],
    // stand top
    [],
    // walk left
    [
      {
        order: 0,
        offsetX: 28,
        offsetY: 270,
        width: 33,
        height: 97,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 23,
        marginRightHeight: 0,
      },
      {
        order: 1,
        offsetX: 102,
        offsetY: 271,
        width: 36,
        height: 93,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 20,
        marginRightHeight: 0,
      },
      {
        order: 2,
        offsetX: 175,
        offsetY: 272,
        width: 42,
        height: 90,
        marginLeftWidth: 2,
        marginLeftHeight: 0,
        marginRightWidth: 18,
        marginRightHeight: 0,
      },
      {
        order: 3,
        offsetX: 260,
        offsetY: 269,
        width: 37,
        height: 93,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 19,
        marginRightHeight: 0,
      },
      {
        order: 4,
        offsetX: 348,
        offsetY: 269,
        width: 33,
        height: 93,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 23,
        marginRightHeight: 0,
      },
      {
        order: 5,
        offsetX: 429,
        offsetY: 267,
        width: 34,
        height: 95,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 22,
        marginRightHeight: 0,
      },
      {
        order: 6,
        offsetX: 509,
        offsetY: 267,
        width: 37,
        height: 95,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 19,
        marginRightHeight: 0,
      },
      {
        order: 7,
        offsetX: 581,
        offsetY: 269,
        width: 35,
        height: 99,
        marginLeftWidth: 6,
        marginLeftHeight: 0,
        marginRightWidth: 21,
        marginRightHeight: 0,
      },
    ],

    // walk top
    [],
    // attack left
    [
      { order: 0, offsetX: 21, offsetY: 547, width: 62, height: 93 },
      {
        order: 1,
        offsetX: 129,
        offsetY: 548,
        width: 45,
        height: 92,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
        marginRightWidth: 17,
        marginRightHeight: 1,
      },
      {
        order: 2,
        offsetX: 222,
        offsetY: 547,
        width: 45,
        height: 92,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
        marginRightWidth: 17,
        marginRightHeight: 1,
      },
      {
        order: 3,
        offsetX: 322,
        offsetY: 547,
        width: 45,
        height: 92,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
        marginRightWidth: 17,
        marginRightHeight: 1,
      },
      {
        order: 4,
        offsetX: 420,
        offsetY: 547,
        width: 49,
        height: 92,
        marginLeftWidth: -6,
        marginLeftHeight: 1,
        marginRightWidth: 19,
        marginRightHeight: 1,
      },
      {
        order: 5,
        offsetX: 509,
        offsetY: 551,
        width: 72,
        height: 84,
        marginLeftWidth: -25,
        marginLeftHeight: 9,
        marginRightWidth: 15,
        marginRightHeight: 9,
      },
      {
        order: 6,
        offsetX: 608,
        offsetY: 551,
        width: 73,
        height: 83,
        marginLeftWidth: -26,
        marginLeftHeight: 10,
        marginRightWidth: 15,
        marginRightHeight: 10,
      },
    ],
    [],
    [
      // hurting
      {
        order: 0,
        offsetX: 22,
        offsetY: 809,
        width: 62,
        height: 93,
        marginLeftWidth: 0,
        marginLeftHeight: 0,
      },
      {
        order: 1,
        offsetX: 133,
        offsetY: 813,
        width: 40,
        height: 86,
        marginLeftWidth: 8,
        marginLeftHeight: -1,
        marginRightWidth: 14,
        marginRightHeight: -1,
      },
      {
        order: 2,
        offsetX: 233,
        offsetY: 812,
        width: 39,
        height: 87,
        marginLeftWidth: 10,
        marginLeftHeight: -2,
        marginRightWidth: 13,
        marginRightHeight: -2,
      },
      {
        order: 3,
        offsetX: 328,
        offsetY: 814,
        width: 49,
        height: 84,
        marginLeftWidth: 11,
        marginLeftHeight: 1,
        marginRightWidth: 2,
        marginRightHeight: 1,
      },
      {
        order: 4,
        offsetX: 413,
        offsetY: 832,
        width: 80,
        height: 48,
        marginLeftWidth: 21,
        marginLeftHeight: 41,
        marginRightWidth: -39,
        marginRightHeight: 41,
      },
    ],
  ];

  weapons = [
    [],
    [],
    [],
    [],
    [
      null,
      null,
      null,
      null,
      null,
      {
        order: 5,
        offsetX: 3,
        offsetY: 664,
        width: 32,
        height: 17,
        marginLeftWidth: -38,
        marginLeftHeight: 51,
        marginRightWidth: 70,
        marginRightHeight: 51,
      },
      {
        order: 6,
        offsetX: 45,
        offsetY: 664,
        width: 31,
        height: 17,
        marginLeftWidth: -37,
        marginLeftHeight: 51,
        marginRightWidth: 70,
        marginRightHeight: 51,
      },
      {
        order: 7,
        offsetX: 86,
        offsetY: 665,
        width: 27,
        height: 16,
        marginLeftWidth: -34,
        marginLeftHeight: 52,
        marginRightWidth: 71,
        marginRightHeight: 52,
      },
      {
        order: 8,
        offsetX: 126,
        offsetY: 664,
        width: 19,
        height: 13,
        marginLeftWidth: -28,
        marginLeftHeight: 54,
        marginRightWidth: 73,
        marginRightHeight: 54,
      },
      {
        order: 9,
        offsetX: 154,
        offsetY: 664,
        width: 14,
        height: 12,
        marginLeftWidth: -27,
        marginLeftHeight: 56,
        marginRightWidth: 77,
        marginRightHeight: 56,
      },
    ],
  ];

  leftEffectDaggerImage = loadLeftThiefDagger();
  rightEffectDaggerImage = loadRightThiefDagger();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, thiefLeftSpriteImage, thiefRightSpriteImage);

    this.maxHp = 1200;
    this.hp = this.maxHp;

    this.attackAudio.volume = 0.025;

    const doubleAttackSkill = new DoubleAttack(10);

    this.initSkill([doubleAttackSkill]);

    doubleAttackSkill.onUse.pipe(takeUntil(this.onCleanup$)).subscribe(() => {
      this.attackAudio.play();
    });

    this.drawAfter$
      .pipe(
        tap((frame) => {
          this.drawCropImageAtFrame({
            frames: this.weapons,
            frameX: frame.frameX,
            frameY: frame.frameY,
            imageLeft: this.leftEffectDaggerImage,
            imageRight: this.rightEffectDaggerImage,
          });
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();
  }

  standing(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(150, 0, 5);
    });
  }

  dying(): Observable<any> {
    return defer(() => {
      this.frameY = 6;
      this.deadAudio.play();
      return this.forwardFrameX(150, 0, 4, { once: true });
    });
  }

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 6;
      this.damagedAudio.play();
      return this.forwardFrameX(150, 0, 3, { once: true });
    });
  }

  drawEffect() {}

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 4;
      return this.forwardFrameX(this.delayAnimationAttack, 0, 6, {
        once: true,
      }).pipe(
        tap({
          next: (frameX) => {
            if (frameX === 3) {
              this.attackAudio.play();
            } else if (frameX === 5) {
              if (this.direction === DIRECTION.LEFT) {
                this.onDamageArea$.next({
                  x: this.x - 25,
                  y: this.y + this.height / 2,
                  w: 50,
                  h: 40,
                });
              } else {
                this.onDamageArea$.next({
                  x: this.x + this.width - 25,
                  y: this.y + this.height / 2,
                  w: 50,
                  h: 40,
                });
              }
            }
          },
        })
      );
    });
  }

  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      this.attackAudio.stop();
      return this.forwardFrameX(35, 0, 7);
    });
  }
}
