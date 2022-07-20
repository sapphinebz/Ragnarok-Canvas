import { interval, map, takeUntil, tap } from 'rxjs';
import { poringSpriteLeftImage } from '../sprites/load-poring-left';
import { poringSpriteRightImage } from '../sprites/load-poring-right';
import { CropImage, DIRECTION } from './Monster';
import { Poring } from './Poring';

export class SantaPoring extends Poring {
  maxHp = 120;
  hp = this.maxHp;
  atk = 20;
  speedX = 3;
  speedY = 3;

  isAggressiveOnVision = false;
  dps = 400;

  frameHat$ = this.createForwardFrame(120, 0, 2);

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
  }

  drawEffect(): void {
    if (this.direction === DIRECTION.RIGHT) {
      const image = poringSpriteRightImage;
    } else {
      const image = poringSpriteLeftImage;
    }
  }
}
