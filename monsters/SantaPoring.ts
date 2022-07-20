import { interval, map, switchMap, takeUntil, tap } from 'rxjs';
import { poringSpriteLeftImage } from '../sprites/load-poring-left';
import { poringSpriteRightImage } from '../sprites/load-poring-right';
import { CropImage, DIRECTION } from './Monster';
import { Poring } from './Poring';

export class SantaPoring extends Poring {
  isAggressiveOnVision = true;

  get ctx() {
    return this.canvas.getContext('2d');
  }

  santaHatY = -8;
  santaHatFrameX = 2;
  santaHatFrames$ = this.timelineFrames(this.walkSpeed * 3, 0, 2).pipe(
    tap({
      next: (frameX) => {
        this.santaHatFrameX = frameX;
      },
    })
  );

  santaHatFrames: CropImage[][] = [
    [
      { order: 0, offsetX: 237, offsetY: 416, width: 33, height: 27 },
      { order: 1, offsetX: 287, offsetY: 416, width: 33, height: 27 },
      { order: 2, offsetX: 336, offsetY: 415, width: 33, height: 28 },
    ],
    [
      { order: 0, offsetX: 359, offsetY: 416, width: 33, height: 27 },
      { order: 1, offsetX: 309, offsetY: 416, width: 33, height: 27 },
      { order: 2, offsetX: 260, offsetY: 415, width: 33, height: 28 },
    ],
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.santaHatFrames$
      .pipe(takeUntil(this.onDied$), takeUntil(this.onCleanup$))
      .subscribe();

    // this.onDied$
    //   .pipe(
    //     switchMap(() => {
    //       const currentSantaHatY = this.santaHatY;
    //       return this.tween(
    //         250,
    //         tap((t) => {
    //           this.santaHatY = currentSantaHatY + (8 - currentSantaHatY) * t;
    //         })
    //       );
    //     }),
    //     takeUntil(this.onCleanup$)
    //   )
    //   .subscribe();

    this.onDieChangeValueEffect({
      init: () => this.santaHatY,
      targetValue: 8,
      updated: (y) => (this.santaHatY = y),
    })
      .pipe(takeUntil(this.onCleanup$))
      .subscribe();
  }

  drawEffect(): void {
    let image: HTMLImageElement;
    if (this.direction === DIRECTION.RIGHT) {
      image = poringSpriteRightImage;
    } else {
      image = poringSpriteLeftImage;
    }

    if (this.santaHatFrameX !== null) {
      let directionFrame: number;
      let margin: { x: number; y: number };
      if (this.direction === DIRECTION.LEFT) {
        directionFrame = 0;
        margin = { y: this.santaHatY, x: 4 };
      } else if (this.direction === DIRECTION.RIGHT) {
        directionFrame = 1;
        margin = { y: this.santaHatY, x: -1 };
      }
      this.drawCropImage(
        image,
        this.santaHatFrames[directionFrame][this.santaHatFrameX],
        margin
      );
    }
  }
}
