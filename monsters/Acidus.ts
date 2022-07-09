import { defer, EMPTY, Observable } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { loadAcidusAttackSound } from '../sounds/acidus-attack';
import { loadAcidusLeftSprite } from '../sprites/load-acidus-left';
import { loadAcidusSpriteRight } from '../sprites/load-acidus-right';
import { CropImage, Monster } from './Monster';

export class Acidus extends Monster {
  x = 200;
  y = 200;
  speedX = 15;
  speedY = 15;
  frameX = 0;
  frameY = 0;
  width = 119;
  height = 120;

  attackAudio = loadAcidusAttackSound();
  //

  frames: CropImage[][] = [
    [
      { order: 0, offsetX: 119, width: 119 },
      { order: 1, offsetX: 240, width: 135 },
      { order: 2, offsetX: 392, width: 135 },
      { order: 3, offsetX: 527, width: 120 },
      { order: 4, offsetX: 653, width: 130 },
      { order: 5, offsetX: 783, width: 135 },
      { order: 6, offsetX: 930, width: 110 },
      { order: 7, offsetX: 1075, width: 135 },
    ],
    [],
    [
      { order: 0, offsetX: 120, width: 140 },
      { order: 1, offsetX: 280, width: 140 },
      { order: 2, offsetX: 420, width: 135 },
      { order: 3, offsetX: 540, width: 140 },
      { order: 4, offsetX: 680, width: 130 },
      { order: 5, offsetX: 815, width: 135 },
      { order: 6, offsetX: 950, width: 100 },
      { order: 7, offsetX: 1075, width: 135 },
    ],
  ];
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, loadAcidusLeftSprite(), loadAcidusSpriteRight());

    this.attackAudio.volume = 0.05;
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      this.attackAudio.play();
      return this.createForwardFrame(50, 0, 7).pipe(
        takeWhile((frameX) => frameX + 1 <= 7)
      );
    });
  }

  walking() {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(150, 0, 6);
    });
  }

  standing() {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(100, 0, 6);
    });
  }

  dying() {
    return EMPTY;
  }
}
