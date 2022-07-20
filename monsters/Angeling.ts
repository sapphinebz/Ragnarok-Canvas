import { interval, map, takeUntil, tap } from 'rxjs';
import { poringSpriteLeftImage } from '../sprites/load-poring-left';
import { poringSpriteRightImage } from '../sprites/load-poring-right';
import { CropImage, DIRECTION } from './Monster';
import { Poring } from './Poring';

export class Angeling extends Poring {
  maxHp = 880;
  hp = this.maxHp;
  atk = 120;
  speedX = 4;
  speedY = 4;

  isAggressiveOnVision = true;
  dps = 400;

  haloFrame = 0;
  // Halo as direction
  haloSprite: CropImage[][] = [
    [{ order: 0, offsetX: 523, offsetY: 480, width: 27, height: 9 }],
    [{ order: 1, offsetX: 79, offsetY: 481, width: 26, height: 8 }],
  ];

  // WingA as direction
  wingASprite: CropImage[][] = [
    [
      { order: 0, offsetX: 232, offsetY: 474, width: 14, height: 19 },
      {
        order: 1,
        offsetX: 255,
        offsetY: 473,
        width: 14,
        height: 19,
        marginLeftWidth: 0,
        marginLeftHeight: 7,
      },
    ],
    [
      { order: 0, offsetX: 383, offsetY: 474, width: 14, height: 19 },
      {
        order: 1,
        offsetX: 360,
        offsetY: 473,
        width: 14,
        height: 19,
        marginRightHeight: 7,
      },
    ],
  ];

  // WingB as direction
  wingBSprite: CropImage[][] = [
    [
      { order: 0, offsetX: 278, offsetY: 476, width: 18, height: 19 },
      {
        order: 1,
        offsetX: 301,
        offsetY: 476,
        width: 15,
        height: 21,
        marginLeftWidth: 0,
        marginLeftHeight: 7,
      },
    ],
    [
      { order: 0, offsetX: 333, offsetY: 476, width: 18, height: 19 },
      {
        order: 1,
        offsetX: 313,
        offsetY: 476,
        width: 15,
        height: 21,
        marginRightHeight: 7,
      },
    ],
  ];

  frameXFlip = 1;
  flipWingFrame$ = this.timelineFrames(this.walkSpeed * 4, 0, 1).pipe(
    tap({
      next: (frameX) => (this.frameXFlip = frameX),
      unsubscribe: () => (this.frameXFlip = null),
    })
  );

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.flipWingFrame$
      .pipe(takeUntil(this.onDied$), takeUntil(this.onCleanup$))
      .subscribe();

    this.onDied$.pipe(takeUntil(this.onCleanup$)).subscribe(() => {
      this.haloFrame = null;
    });
  }

  drawEffect(): void {
    let image: HTMLImageElement;
    if (this.direction === DIRECTION.RIGHT) {
      image = poringSpriteRightImage;
    } else if (this.direction === DIRECTION.LEFT) {
      image = poringSpriteLeftImage;
    }

    if (this.haloFrame !== null) {
      let margin: { x: number; y: number };
      let directionFrame: number;
      if (this.direction === DIRECTION.LEFT) {
        directionFrame = 0;
        margin = { x: 7, y: -5 };
      } else if (this.direction === DIRECTION.RIGHT) {
        directionFrame = 1;
        margin = { x: 3, y: -5 };
      }

      this.drawCropImage(
        image,
        this.haloSprite[directionFrame][this.haloFrame],
        margin
      );
    }

    if (this.frameXFlip !== null) {
      let marginWingA: { x?: number; y?: number };
      let marginWingB: { x?: number; y?: number };
      let directionFrame: number;
      if (this.direction === DIRECTION.LEFT) {
        directionFrame = 0;
        marginWingA = { x: -12, y: -5 };
        marginWingB = { x: this.width, y: 1 };
      } else if (this.direction === DIRECTION.RIGHT) {
        directionFrame = 1;
        marginWingA = { x: this.width - 3, y: -3 };
        marginWingB = { x: -18 };
      }

      this.drawCropImage(
        image,
        this.wingASprite[directionFrame][this.frameXFlip],
        marginWingA
      );
      this.drawCropImage(
        image,
        this.wingBSprite[directionFrame][this.frameXFlip],
        marginWingB
      );
    }
  }
}
