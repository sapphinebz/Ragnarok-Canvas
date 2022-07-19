import {
  defer,
  EMPTY,
  ignoreElements,
  merge,
  NEVER,
  Observable,
  Subject,
} from 'rxjs';
import {
  concatMap,
  connect,
  filter,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs/operators';
import { loadPoringAttackAudio } from '../sounds/poring-attack';
import { loadPoringDamage } from '../sounds/poring-damage';
import { loadPoringDeadSound } from '../sounds/poring-dead';
import { loadPoringWalkSound } from '../sounds/poring-walk';
import { poringSpriteLeftImage } from '../sprites/load-poring-left';
import { poringSpriteRightImage } from '../sprites/load-poring-right';
import { playAudio } from '../utils/play-audio';
import { CropImage, DIRECTION, Monster } from './Monster';

export class Poring extends Monster {
  x = 100;
  y = 100;
  maxHp = 150;
  hp = this.maxHp;
  atk = 35;
  speedX = 3;
  speedY = 3;
  frameX = 0;
  frameY = 0;
  width = 60;
  height = 60;

  attackRange = 30;
  isAggressiveOnVision = false;
  dps = 600;

  onPlayAttackAudio$ = new Subject<void>();
  attackAudio = loadPoringAttackAudio();

  dyingAudio = loadPoringDeadSound();

  onPlayDamageAudio$ = new Subject<void>();
  damageAudio = loadPoringDamage();

  walkingAudio = loadPoringWalkSound();

  frames: CropImage[][] = [
    [
      // Standing
      { order: 0, offsetX: 7, offsetY: 11, width: 37, height: 36 },
      {
        order: 1,
        offsetX: 63,
        offsetY: 10,
        width: 39,
        height: 37,
        marginLeftWidth: -1,
        marginLeftHeight: -2,
        marginRightWidth: -1,
        marginRightHeight: -1,
      },
      {
        order: 2,
        offsetX: 122,
        offsetY: 9,
        width: 41,
        height: 39,
        marginLeftWidth: -1,
        marginLeftHeight: -4,
        marginRightWidth: -2,
        marginRightHeight: -3,
      },
      {
        order: 3,
        offsetX: 189,
        offsetY: 14,
        width: 39,
        height: 33,
        marginLeftWidth: 0,
        marginLeftHeight: 2,
        marginRightWidth: -1,
        marginRightHeight: 3,
      },
      { order: 4, offsetX: 251, offsetY: 12, width: 37, height: 36 },
      { order: 5, offsetX: 310, offsetY: 12, width: 39, height: 37 },
      { order: 6, offsetX: 371, offsetY: 10, width: 41, height: 39 },
      { order: 7, offsetX: 438, offsetY: 16, width: 39, height: 33 },
    ],
    // Walking
    [
      { order: 0, offsetX: 8, offsetY: 73, width: 37, height: 31 },
      { order: 1, offsetX: 59, offsetY: 74, width: 39, height: 30 },
      { order: 2, offsetX: 110, offsetY: 74, width: 41, height: 30 },
      { order: 3, offsetX: 165, offsetY: 74, width: 35, height: 31 },
      { order: 4, offsetX: 213, offsetY: 70, width: 34, height: 34 },
      { order: 5, offsetX: 265, offsetY: 73, width: 36, height: 31 },
      { order: 6, offsetX: 319, offsetY: 74, width: 37, height: 31 },
      { order: 7, offsetX: 373, offsetY: 74, width: 35, height: 31 },
      // { order: 0, offsetX: 0, width: 50 },
      // { order: 1, offsetX: 50, width: 50 },
      // { order: 2, offsetX: 100, width: 50 },
      // { order: 3, offsetX: 155, width: 50 },
      // { order: 4, offsetX: 200, width: 50 },
      // { order: 5, offsetX: 255, width: 50 },
      // { order: 6, offsetX: 310, width: 50 },
      // { order: 7, offsetX: 365, width: 50 },
    ],
    [],
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
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, poringSpriteLeftImage, poringSpriteRightImage);

    this.dyingAudio.volume = 0.05;
    this.walkingAudio.volume = 0.02;
    this.damageAudio.volume = 0.05;
    this.attackAudio.volume = 0.05;

    this.onPlayAttackAudio$
      .pipe(
        switchMap(() => {
          this.attackAudio.currentTime = 0;
          return playAudio(this.attackAudio);
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    this.onPlayDamageAudio$
      .pipe(
        switchMap(() => playAudio(this.damageAudio)),
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
      return this.createForwardFrame(120, 0, 3);
    });
  }

  dying(): Observable<any> {
    return defer(() => {
      this.frameY = 3;

      return this.createForwardFrame(100, 0, 5).pipe(
        tap((frameX) => {
          if (frameX === 2) {
            this.dyingAudio.play();
          }
        }),
        takeWhile((frameX) => {
          return frameX + 1 <= 5;
        })
      );
    });
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 1;
      const maxFrameX = 7;
      const minFrameX = 0;
      return this.createForwardFrame(100, minFrameX, maxFrameX, {
        once: true,
      }).pipe(
        this.moveLocationOnAttack({
          moveY: 15,
          moveX: this.attackRange,
          maxLocationOnFrame: 3,
        }),
        tap((frameX) => {
          if (frameX === 2) {
            this.onPlayAttackAudio$.next();
          }
        })
      );
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 3;
      return this.createForwardFrame(120, 0, 1, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 0) {
            this.onPlayDamageAudio$.next();
          }
        })
      );
    });
  }

  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 1;
      return this.createForwardFrame(50, 0, 7).pipe(
        connect((xframe$) => {
          const sound$ = xframe$.pipe(
            filter((xframe) => xframe === 3),
            concatMap(() => this.playWalkingAudio())
          );
          return merge(xframe$, sound$.pipe(ignoreElements()));
        })
      );
    });
  }

  private playWalkingAudio() {
    return new Observable((subscriber) => {
      this.walkingAudio.play();
      const stopAudio = () => {
        this.walkingAudio.pause();
        this.walkingAudio.currentTime = 0;
        subscriber.next();
        subscriber.complete();
      };
      const timeoutIndex = setTimeout(stopAudio, 270);
      return () => {
        clearTimeout(timeoutIndex);
        stopAudio();
      };
    });
  }
}
