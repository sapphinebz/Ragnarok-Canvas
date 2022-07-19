import { defer, EMPTY, Observable, takeWhile, timer } from 'rxjs';
import { onErrorResumeNext, tap } from 'rxjs/operators';
import { loadFabreDeadSound } from '../sounds/fabre-dead';
import { fabreSpriteLeftImage } from '../sprites/load-fabre-left';
import { fabreSpriteRightImage } from '../sprites/load-fabre-right';
import { CropImage, DIRECTION, Monster } from './Monster';

export class Fabre extends Monster {
  x = 100;
  y = 100;
  speedX = 3;
  speedY = 3;
  frameX = 0;
  frameY = 0;
  width = 50;
  height = 40;
  maxHp = 100;
  hp = this.maxHp;
  atk = 25;
  dps = 800;

  dyingAudio = loadFabreDeadSound();

  frames: CropImage[][] = [
    // Walking
    [
      { order: 0, offsetX: 10, offsetY: 11, width: 34, height: 27 },
      { order: 1, offsetX: 58, offsetY: 11, width: 34, height: 27 },
      { order: 2, offsetX: 108, offsetY: 11, width: 31, height: 27 },
      { order: 3, offsetX: 154, offsetY: 12, width: 33, height: 26 },
      { order: 4, offsetX: 206, offsetY: 12, width: 32, height: 26 },
      { order: 5, offsetX: 251, offsetY: 12, width: 32, height: 25 },
      { order: 6, offsetX: 299, offsetY: 12, width: 30, height: 25 },
      { order: 7, offsetX: 344, offsetY: 13, width: 32, height: 26 },
    ],
    [
      // Attacking
      {
        order: 0,
        offsetX: 10,
        offsetY: 57,
        width: 33,
        height: 26,
        marginLeftWidth: 1,
        marginLeftHeight: 1,
      },
      {
        order: 1,
        offsetX: 60,
        offsetY: 55,
        width: 41,
        height: 26,
        marginLeftWidth: -7,
        marginLeftHeight: 5,
        marginRightWidth: 0,
        marginRightHeight: 5,
      },
      {
        order: 2,
        offsetX: 117,
        offsetY: 54,
        width: 31,
        height: 28,
        marginLeftWidth: 1,
        marginLeftHeight: -1,
        marginRightWidth: 3,
        marginRightHeight: -2,
      },
      { order: 3, offsetX: 165, offsetY: 56, width: 40, height: 27 },
      { order: 4, offsetX: 222, offsetY: 57, width: 29, height: 26 },
    ],
    [
      {
        order: 0,
        offsetX: 12,
        height: 52,
        width: 55,
        offsetY: 90,
        marginRightWidth: -12,
      },
      {
        order: 1,
        offsetX: 67,
        height: 52,
        width: 56,
        offsetY: 90,
        marginRightWidth: -12,
      },
    ],
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, fabreSpriteLeftImage, fabreSpriteRightImage);

    this.dyingAudio.volume = 0.05;
  }

  getFrameEntry(frameY: number, frameX: number): CropImage {
    return this.frames[frameY][frameX];
  }
  standing(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(80, 0, 3);
    });
  }
  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(80, 0, 3);
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return EMPTY;
  }

  dying(): Observable<any> {
    return defer(() => {
      this.frameY = 2;

      return this.createForwardFrame(350, 0, 1).pipe(
        takeWhile((frameX) => {
          return frameX + 1 <= 1;
        }),
        onErrorResumeNext(
          defer(() => {
            this.dyingAudio.play();
            return timer(1000);
          })
        )
      );
    });
  }
  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 1;
      return this.createForwardFrame(150, 0, 2, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 1) {
            if (this.direction === DIRECTION.LEFT) {
              this.onDamageArea$.next({
                x: this.x - this.width / 2,
                y: this.y + this.height / 4,
                w: 30,
                h: 20,
              });
            } else if (this.direction === DIRECTION.RIGHT) {
              this.onDamageArea$.next({
                x: this.x + (this.width * 1) / 2,
                y: this.y + this.height / 4,
                w: 30,
                h: 20,
              });
            }
          }
        })
      );
    });
  }
}
