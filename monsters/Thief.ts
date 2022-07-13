import {
  defer,
  ignoreElements,
  merge,
  NEVER,
  Observable,
  ReplaySubject,
} from 'rxjs';
import {
  concatMap,
  connect,
  filter,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { loadThiefLeftSprite } from '../sprites/load-thief-left';
import { loadLeftThiefDagger } from '../sprites/load-thief-left-dagger';
import { loadThiefRightSprite } from '../sprites/load-thief-right';
import { loadRightThiefDagger } from '../sprites/load-thief-right-dagger';
import { CropImage, Monster } from './Monster';

export class Thief extends Monster {
  x = 100;
  y = 100;
  speedX = 8;
  speedY = 8;
  frameX = 0;
  frameY = 0;
  width = 80;
  height = 107;

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
    // stand right
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
    ],
  ];

  leftEffectDaggerImage = loadLeftThiefDagger();
  rightEffectDaggerImage = loadRightThiefDagger();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, loadThiefLeftSprite(), loadThiefRightSprite());
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
  }
  standing(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(150, 0, 5);
    });
  }

  dying(): Observable<any> {
    return defer(() => {
      this.frameY = 3;

      return this.createForwardFrame(100, 0, 5).pipe(
        tap((frameX) => {
          if (frameX === 2) {
          }
        }),
        takeWhile((frameX) => {
          return frameX + 1 <= 5;
        })
      );
    });
  }

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 6;
      return this.createForwardFrame(150, 0, 3);
    });
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 4;
      return this.createForwardFrame(100, 0, 6, { once: true }).pipe(
        connect((frameX$) => {
          const damage$ = frameX$.pipe(
            tap((frameX) => {
              if (frameX >= 5) {
                if (this.direction === 'left') {
                  this.onDamageArea$.next({
                    x: this.x - 20,
                    y: this.y + this.height / 2,
                    w: 30,
                    h: 50,
                  });
                } else {
                  this.onDamageArea$.next({
                    x: this.x + this.width - 10,
                    y: this.y + this.height / 2,
                    w: 30,
                    h: 50,
                  });
                }
              }
            })
          );

          const subscription = this.drawImage$
            .pipe(
              withLatestFrom(frameX$),
              tap(([_, attackFrameX]) => {
                if (attackFrameX === 2) {
                  this.ctx.drawImage(
                    this.leftEffectDaggerImage,
                    0,
                    650,
                    30,
                    30,
                    this.x + 9,
                    this.y + 40,
                    30,
                    30
                  );
                } else if (attackFrameX === 3) {
                  this.ctx.drawImage(
                    this.leftEffectDaggerImage,
                    45,
                    650,
                    30,
                    30,
                    this.x + 6,
                    this.y + 40,
                    30,
                    30
                  );
                } else if (attackFrameX === 4) {
                  this.ctx.drawImage(
                    this.leftEffectDaggerImage,
                    85,
                    650,
                    30,
                    30,
                    this.x - 15,
                    this.y + 50,
                    30,
                    30
                  );
                } else if (attackFrameX === 5) {
                  this.ctx.drawImage(
                    this.leftEffectDaggerImage,
                    125,
                    650,
                    30,
                    30,
                    this.x - 17,
                    this.y + 53,
                    30,
                    30
                  );
                } else if (attackFrameX === 6) {
                  this.ctx.drawImage(
                    this.leftEffectDaggerImage,
                    142,
                    650,
                    30,
                    30,
                    this.x - 27,
                    this.y + 60,
                    30,
                    30
                  );
                }
              })
            )
            .subscribe();

          return damage$.pipe(
            tap({
              complete: () => {
                subscription.unsubscribe();
              },
              unsubscribe: () => {
                subscription.unsubscribe();
              },
            })
          );
        })
      );
    });
  }

  playWalkingSound() {
    return new Observable((subscriber) => {
      const stopAudio = () => {
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

  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      return this.createForwardFrame(35, 0, 7);
    });
  }
}
