import { defer, EMPTY, Observable, takeWhile, timer } from 'rxjs';
import { onErrorResumeNext } from 'rxjs/operators';
import { loadFabreDeadSound } from '../sounds/fabre-dead';
import { fabreSpriteLeftImage } from '../sprites/load-fabre-left';
import { fabreSpriteRightImage } from '../sprites/load-fabre-right';
import { CropImage, Monster } from './Monster';

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

  dyingAudio = loadFabreDeadSound();

  frames: CropImage[][] = [
    [
      { order: 0, offsetX: 0, width: 43 },
      { order: 1, offsetX: 48, width: 43 },
      { order: 2, offsetX: 96, width: 43 },
      { order: 3, offsetX: 144, width: 43 },
    ],
    [
      { order: 0, offsetX: 10, offsetY: 57, width: 33, height: 26 },
      {
        order: 1,
        offsetX: 60,
        offsetY: 55,
        width: 41,
        height: 26,
      },
      {
        order: 2,
        offsetX: 117,
        offsetY: 54,
        width: 31,
        height: 28,
      },
      {
        order: 3,
        offsetX: 166,
        offsetY: 56,
        width: 39,
        height: 27,
      },
      {
        order: 4,
        offsetX: 222,
        offsetY: 57,
        width: 29,
        height: 26,
      },
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
      return this.createForwardFrame(150, 0, 3);
    });
  }
  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(150, 0, 3);
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
      return this.createForwardFrame(1000, 0, 2, { once: true }).pipe(
        this.moveLocationOnAttack({
          moveY: 15,
          moveX: 15,
          maxLocationOnFrame: 1,
        })
      );
    });
  }
}
