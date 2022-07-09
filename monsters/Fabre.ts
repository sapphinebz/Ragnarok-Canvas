import { defer, EMPTY, Observable, takeWhile, timer } from 'rxjs';
import { onErrorResumeNext } from 'rxjs/operators';
import { loadFabreDeadSound } from '../sounds/fabre-dead';
import { loadFabreSpriteLeft } from '../sprites/load-fabre-left';
import { loadFabreSpriteRight } from '../sprites/load-fabre-right';
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

  dyingAudio = loadFabreDeadSound();

  frames: CropImage[][] = [
    [
      { order: 0, offsetX: 0, width: 43 },
      { order: 1, offsetX: 48, width: 43 },
      { order: 2, offsetX: 96, width: 43 },
      { order: 3, offsetX: 144, width: 43 },
    ],
    [],
    [
      { order: 0, offsetX: 12, height: 52, width: 55, offsetY: 90 },
      { order: 1, offsetX: 67, height: 52, width: 56, offsetY: 90 },
    ],
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, loadFabreSpriteLeft(), loadFabreSpriteRight());

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
    // throw new Error("Method not implemented.");
    return EMPTY;
  }
}
