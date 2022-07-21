import { takeUntil, tap } from 'rxjs';
import { Apple } from '../items/Apple';
import { Candy } from '../items/Candy';
import { CandyCane } from '../items/CandyCane';
import { RedHerb } from '../items/RedHerb';
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

    this.dropItems = [
      [CandyCane, 15],
      [Apple, 30],
      [RedHerb, 30],
      [Candy, 15],
    ];

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
