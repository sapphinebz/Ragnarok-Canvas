import { defer, ignoreElements, merge, NEVER, Observable } from 'rxjs';
import { concatMap, connect, filter, takeWhile, tap } from 'rxjs/operators';
import { loadThiefLeftSprite } from '../sprites/load-thief-left';
import { loadThiefRightSprite } from '../sprites/load-thief-right';
import { CropImage, Monster } from './Monster';

export class Thief extends Monster {
  x = 100;
  y = 100;
  speedX = 5;
  speedY = 5;
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

  attack(): Observable<any> {
    return NEVER;
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
      return this.createForwardFrame(120, 0, 7);
    });
  }
}
