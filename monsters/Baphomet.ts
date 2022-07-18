import { defer, EMPTY, Observable } from 'rxjs';
import { baphometSpriteLeft } from '../sprites/baphomet-sprite-left';
import { baphometSpriteRight } from '../sprites/baphomet-sprite-right';
import { CropImage, Monster } from './Monster';

export class Baphomet extends Monster {
  maxHp = 1200;
  hp = this.maxHp;
  x = 300;
  y = 300;
  speedX = 5;
  speedY = 5;
  frameX = 0;
  frameY = 0;

  width = 83;
  height = 118;

  atk = 50;
  visionRange = 200;
  isAggressiveOnVision = true;
  dps = 300;

  frames: CropImage[][] = [
    [
      { order: 0, offsetX: 4, offsetY: 3, width: 83, height: 118 },
      { order: 1, offsetX: 109, offsetY: 5, width: 87, height: 117 },
      { order: 2, offsetX: 215, offsetY: 6, width: 91, height: 116 },
      { order: 3, offsetX: 332, offsetY: 8, width: 95, height: 112 },
      { order: 4, offsetX: 445, offsetY: 11, width: 93, height: 106 },
      { order: 5, offsetX: 561, offsetY: 10, width: 90, height: 107 },
      { order: 6, offsetX: 675, offsetY: 10, width: 85, height: 110 },
      { order: 7, offsetX: 783, offsetY: 8, width: 84, height: 114 },
    ],
  ];

  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, baphometSpriteLeft, baphometSpriteRight);
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
  }

  attack(): Observable<any> {
    return EMPTY;
  }

  walking() {
    return EMPTY;
  }

  standing() {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(1000, 0, 1);
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return EMPTY;
  }

  dying() {
    return EMPTY;
  }
}
