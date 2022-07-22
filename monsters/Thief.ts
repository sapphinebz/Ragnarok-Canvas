import { defer, Observable, Subject, switchMap, timer } from "rxjs";
import { map, mergeMap, takeUntil, takeWhile, tap } from "rxjs/operators";
import { loadDaggerHitSound } from "../sounds/dagger-hit-sound";
import { loadThiefFamaleDamagedAudio } from "../sounds/thief-famale-damaged";
import { loadThiefFamaleDeadAudio } from "../sounds/thief-famale-dead";
import { thiefLeftSpriteImage } from "../sprites/load-thief-left";
import { loadLeftThiefDagger } from "../sprites/load-thief-left-dagger";
import { thiefRightSpriteImage } from "../sprites/load-thief-right";
import { loadRightThiefDagger } from "../sprites/load-thief-right-dagger";
import { playAudio } from "../utils/play-audio";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class Thief extends Monster {
  maxHp = 1200;
  hp = this.maxHp;
  atk = 18;
  x = 100;
  y = 100;
  speedX = 8;
  speedY = 8;
  frameX = 0;
  frameY = 0;
  width = 80;
  height = 107;
  attackSpeed = 60;
  dps = 0;
  showHpGauge = true;

  daggerHitSound = loadDaggerHitSound();
  damagedAudio = loadThiefFamaleDamagedAudio();
  deadAudio = loadThiefFamaleDeadAudio();

  frames: CropImage[][] = [
    [
      // stand left
      { order: 0, offsetX: 0, width: 80 },
      { order: 1, offsetX: 100, width: 80, marginHeight: -1 },
      { order: 2, offsetX: 201, width: 80, marginHeight: -1 },
      { order: 3, offsetX: 301, width: 80, marginHeight: -1 },
      { order: 4, offsetX: 401, width: 80, marginHeight: -1 },
      { order: 5, offsetX: 500, width: 80 },
    ],
    // stand top
    [
      {
        order: 0,
        offsetX: 29,
        offsetY: 133,
        width: 41,
        height: 93,
        marginLeftWidth: 20,
        marginRightWidth: 20,
        marginHeight: 14,
      },
      {
        order: 1,
        offsetX: 129,
        offsetY: 133,
        width: 41,
        height: 94,
        marginLeftWidth: 20,
        marginRightWidth: 20,
        marginHeight: 13,
      },
      {
        order: 2,
        offsetX: 229,
        offsetY: 133,
        width: 41,
        height: 95,
        marginLeftWidth: 20,
        marginRightWidth: 20,
        marginHeight: 13,
      },
      {
        order: 3,
        offsetX: 329,
        offsetY: 133,
        width: 41,
        height: 95,
        marginLeftWidth: 20,
        marginRightWidth: 20,
        marginHeight: 13,
      },
      {
        order: 4,
        offsetX: 429,
        offsetY: 133,
        width: 41,
        height: 94,
        marginLeftWidth: 20,
        marginRightWidth: 20,
        marginHeight: 13,
      },
      {
        order: 5,
        offsetX: 529,
        offsetY: 133,
        width: 41,
        height: 93,
        marginLeftWidth: 20,
        marginRightWidth: 20,
        marginHeight: 14,
      },
    ],
    // walk left
    [
      { order: 0, offsetY: 257, offsetX: 3, width: 80, height: 109 },
      {
        order: 1,
        offsetY: 257,
        offsetX: 77,
        width: 80,
        height: 111,
        marginHeight: -1,
      },
      {
        order: 2,
        offsetY: 257,
        offsetX: 154,
        width: 80,
        height: 111,
        marginHeight: -2,
      },
      {
        order: 3,
        offsetY: 257,
        offsetX: 235,
        width: 80,
        height: 111,
        marginHeight: 1,
      },
      {
        order: 4,
        offsetY: 257,
        offsetX: 323,
        width: 80,
        height: 111,
        marginHeight: 1,
      },
      {
        order: 5,
        offsetY: 257,
        offsetX: 404,
        width: 80,
        height: 111,
        marginHeight: 3,
      },
      {
        order: 6,
        offsetY: 257,
        offsetX: 484,
        width: 80,
        height: 111,
        marginHeight: 3,
      },
      {
        order: 7,
        offsetY: 257,
        offsetX: 556,
        width: 80,
        height: 111,
        marginHeight: 1,
      },
    ],

    // walk top
    [
      {
        order: 0,
        offsetX: 0,
        width: 50,
        offsetY: 200,
        height: 50,
        marginRightWidth: 5,
      },
      {
        order: 1,
        offsetX: 50,
        width: 50,
        offsetY: 200,
        height: 50,
        marginRightWidth: 5,
      },
      {
        order: 2,
        offsetX: 130,
        width: 50,
        offsetY: 200,
        height: 50,
        marginRightWidth: 5,
      },
      {
        order: 3,
        offsetX: 240,
        offsetY: 190,
        width: 90,
        height: 80,
        marginHeight: -20,
        marginLeftWidth: 0,
        marginRightWidth: -35,
      },
      {
        order: 4,
        offsetX: 310,
        offsetY: 180,
        width: 130,
        height: 80,
        marginLeftWidth: -45,
        marginRightWidth: -30,
        marginHeight: -25,
      },
      {
        order: 5,
        offsetX: 430,
        offsetY: 200,
        width: 120,
        height: 60,
        marginLeftWidth: -45,
        marginRightWidth: -20,
        marginHeight: -3,
      },
    ],
    // attack left
    [
      { order: 0, offsetY: 534, offsetX: 1, width: 80, height: 109 },
      { order: 1, offsetY: 534, offsetX: 110, width: 80, height: 109 },
      {
        order: 2,
        offsetY: 534,
        offsetX: 203,
        width: 80,
        height: 109,
        marginHeight: 1,
      },
      {
        order: 3,
        offsetY: 534,
        offsetX: 303,
        width: 80,
        height: 109,
        marginHeight: 1,
      },
      {
        order: 4,
        offsetY: 534,
        offsetX: 403,
        width: 80,
        height: 109,
        marginHeight: 1,
      },
      {
        order: 5,
        offsetY: 534,
        offsetX: 511,
        width: 80,
        height: 109,
        marginHeight: 5,
      },
      {
        order: 6,
        offsetY: 534,
        offsetX: 611,
        width: 80,
        height: 109,
        marginHeight: 6,
      },
    ],
    [],
    [
      // hurting
      {
        order: 0,
        offsetX: 3,
        width: 80,
        offsetY: 797,
        height: 109,
        marginHeight: 1,
      },
      {
        order: 1,
        offsetX: 110,
        width: 80,
        offsetY: 797,
        height: 109,
        marginHeight: -4,
      },
      {
        order: 2,
        offsetX: 205,
        width: 80,
        offsetY: 797,
        height: 109,
        marginHeight: -5,
      },
      {
        order: 3,
        offsetX: 299,
        width: 80,
        offsetY: 797,
        height: 109,
        marginHeight: -3,
      },
      {
        order: 4,
        offsetX: 413,
        offsetY: 832,
        width: 80,
        height: 48,
        marginHeight: 52,
        marginLeftWidth: 30,
        marginRightWidth: -30,
      },
    ],
  ];

  leftEffectDaggerImage = loadLeftThiefDagger();
  rightEffectDaggerImage = loadRightThiefDagger();

  // 0 = left, 1 = right
  attackEffectFrames = [
    [0, 650, 30, 30, -18, 51, 30, 30, DIRECTION.LEFT],
    [45, 650, 30, 30, -18, 51, 30, 30, DIRECTION.LEFT],
    [85, 650, 30, 30, -18, 51, 30, 30, DIRECTION.LEFT],
    [125, 650, 30, 30, -18, 51, 30, 30, DIRECTION.LEFT],
    [145, 650, 30, 30, -18, 51, 30, 30, DIRECTION.LEFT],
  ];

  hasEffect = false;
  effectFrame: number[] = [];
  onSoundEffectAttackPlay$ = new Subject<void>();
  onStopSoundEffectAttack$ = new Subject<void>();
  onEffectAttack = new Subject<{
    x: number;
    y: number;
    direction: DIRECTION;
  }>();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, thiefLeftSpriteImage, thiefRightSpriteImage);

    this.daggerHitSound.volume = 0.05;
    this.damagedAudio.volume = 0.05;
    this.deadAudio.volume = 0.05;

    this.onSoundEffectAttackPlay$
      .pipe(
        switchMap(() =>
          playAudio(this.daggerHitSound).pipe(
            takeUntil(this.onStopSoundEffectAttack$)
          )
        ),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    /**
     * stay effect even player finish attack and move
     */
    this.onEffectAttack
      .pipe(
        mergeMap(({ x, y, direction }) => {
          return timer(0, this.attackSpeed).pipe(
            map((_, index) => index),
            takeWhile((frameX) => {
              if (this.attackEffectFrames[frameX] !== undefined) {
                this.hasEffect = true;
                this.effectFrame = [...this.attackEffectFrames[frameX]];

                let offsetX = this.effectFrame[0];
                const sWidth = this.effectFrame[3];

                if (direction === DIRECTION.RIGHT) {
                  this.effectFrame[0] =
                    this.rightEffectDaggerImage.width - (offsetX + sWidth);
                  this.effectFrame[4] = x + 50 - this.effectFrame[4];
                  this.effectFrame[5] = y + 103 - this.effectFrame[5];
                } else if (direction === DIRECTION.LEFT) {
                  this.effectFrame[4] = x + this.effectFrame[4];
                  this.effectFrame[5] = y + this.effectFrame[5];
                }
                this.effectFrame[8] = direction;

                return true;
              }
              this.hasEffect = false;
              return false;
            })
          );
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
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

  drawEffect() {
    if (this.hasEffect) {
      const [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, directionEnum] =
        this.effectFrame;
      this.ctx.drawImage(
        directionEnum === 0
          ? this.leftEffectDaggerImage
          : this.rightEffectDaggerImage,
        sx,
        sy,
        sWidth,
        sHeight,
        dx,
        dy,
        dWidth,
        dHeight
      );
    }
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 4;
      return this.forwardFrameX(this.attackSpeed, 0, 6, {
        once: true,
      }).pipe(
        tap({
          next: (frameX) => {
            if (frameX === 4) {
              this.onSoundEffectAttackPlay$.next();
            }
            if (frameX === 5) {
              this.onEffectAttack.next({
                x: this.x,
                y: this.y,
                direction: this.direction,
              });
            }
            if (frameX === 5) {
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
      return this.forwardFrameX(35, 0, 7);
    });
  }
}
