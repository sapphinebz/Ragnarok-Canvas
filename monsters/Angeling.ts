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

  haloSpriteLeft = { offsetX: 523, offsetY: 480, width: 27, height: 9 };
  haloSpriteRight = { offsetX: 79, offsetY: 481, width: 26, height: 8 };

  wingASpriteLeft: CropImage[] = [
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
  ];

  wingASpriteRight: CropImage[] = [
    { order: 0, offsetX: 383, offsetY: 474, width: 14, height: 19 },
    {
      order: 1,
      offsetX: 360,
      offsetY: 473,
      width: 14,
      height: 19,
      marginRightHeight: 7,
    },
  ];

  wingBSpriteLeft: CropImage[] = [
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
  ];

  wingBSpriteRight: CropImage[] = [
    { order: 0, offsetX: 333, offsetY: 476, width: 18, height: 19 },
    {
      order: 1,
      offsetX: 313,
      offsetY: 476,
      width: 15,
      height: 21,
      marginRightHeight: 7,
    },
  ];

  flipDirection = 1;
  flipWing$ = interval(240);

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.flipWing$
      .pipe(takeUntil(this.onDied$), takeUntil(this.onCleanup$))
      .subscribe(() => {
        this.flipDirection = -this.flipDirection;
      });
  }

  drawEffect(): void {
    let image: HTMLImageElement;

    const haloMarginY = 5;
    if (this.direction === DIRECTION.RIGHT) {
      image = poringSpriteRightImage;
      // Halo
      this.ctx.drawImage(
        image,
        this.haloSpriteRight.offsetX,
        this.haloSpriteRight.offsetY,
        this.haloSpriteRight.width,
        this.haloSpriteRight.height,
        this.x + 3,
        this.y - haloMarginY,
        this.haloSpriteRight.width,
        this.haloSpriteRight.height
      );
      const wingARightSprite =
        this.flipDirection === 1
          ? this.wingASpriteRight[0]
          : this.wingASpriteRight[1];
      const wingBRightSprite =
        this.flipDirection === 1
          ? this.wingBSpriteRight[0]
          : this.wingBSpriteRight[1];

      // Wing

      this.drawCropImage(image, wingARightSprite, { x: this.width - 3, y: -3 });
      this.drawCropImage(image, wingBRightSprite, { x: -18 });
    } else {
      image = poringSpriteLeftImage;
      // Halo
      this.ctx.drawImage(
        image,
        this.haloSpriteLeft.offsetX,
        this.haloSpriteLeft.offsetY,
        this.haloSpriteLeft.width,
        this.haloSpriteLeft.height,
        this.x + 7,
        this.y - haloMarginY,
        this.haloSpriteLeft.width,
        this.haloSpriteLeft.height
      );

      const wingALeftSprite =
        this.flipDirection === 1
          ? this.wingASpriteLeft[0]
          : this.wingASpriteLeft[1];
      const wingBLeftSprite =
        this.flipDirection === 1
          ? this.wingBSpriteLeft[0]
          : this.wingBSpriteLeft[1];

      // Wing
      this.drawCropImage(image, wingALeftSprite, { x: -12, y: -5 });
      this.drawCropImage(image, wingBLeftSprite, { x: this.width, y: 1 });
    }
  }
}
