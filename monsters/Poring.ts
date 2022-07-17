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
import { loadPoringDamage } from '../sounds/poring-damage';
import { loadPoringDeadSound } from '../sounds/poring-dead';
import { loadPoringWalkSound } from '../sounds/poring-walk';
import { loadPoringSpriteLeft } from '../sprites/load-poring-left';
import { loadPoringSpriteRight } from '../sprites/load-poring-right';
import { playAudio } from '../utils/play-audio';
import { AggressiveCondition, CropImage, DIRECTION, Monster } from './Monster';

export class Poring extends Monster {
  x = 100;
  y = 100;
  hp = 50;
  maxHp = this.hp;
  atk = 15;
  speedX = 3;
  speedY = 3;
  frameX = 0;
  frameY = 0;
  width = 60;
  height = 60;

  attackRange = 30;
  dps = 600;

  dyingAudio = loadPoringDeadSound();

  damageAudio = loadPoringDamage();
  onPlayDamageAudio$ = new Subject<void>();

  walkingAudio = loadPoringWalkSound();

  frames: CropImage[][] = [
    [
      { order: 0, offsetX: 0, width: 60 },
      { order: 1, offsetX: 60, width: 60 },
      { order: 2, offsetX: 120, width: 60 },
      { order: 3, offsetX: 185, width: 60 },
    ],
    [
      { order: 0, offsetX: 0, width: 50 },
      { order: 1, offsetX: 50, width: 50 },
      { order: 2, offsetX: 100, width: 50 },
      { order: 3, offsetX: 155, width: 50 },
      { order: 4, offsetX: 200, width: 50 },
      { order: 5, offsetX: 255, width: 50 },
      { order: 6, offsetX: 310, width: 50 },
      { order: 7, offsetX: 365, width: 50 },
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
    super(canvas, loadPoringSpriteLeft(), loadPoringSpriteRight());

    this.dyingAudio.volume = 0.05;
    this.walkingAudio.volume = 0.02;
    this.damageAudio.volume = 0.05;

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
      return this.createForwardFrame(100, 0, 7, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 4) {
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

  checkAggressive(condition: AggressiveCondition): void {}

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
