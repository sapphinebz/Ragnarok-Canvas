import { defer, EMPTY, Observable } from 'rxjs';
import { CropImage, Monster } from './Monster';

export class GeffenMonk extends Monster {
  x = 100;
  y = 100;
  speedX = 15;
  speedY = 15;
  frameX = 0;
  frameY = 0;
  width = 100;
  height = 105;

  frames: CropImage[][] = [
    [
      { order: 0, offsetX: 0, width: 100 },
      { order: 1, offsetX: 100, width: 100, marginHeight: -2 },
      { order: 2, offsetX: 200, width: 100, marginHeight: -2 },
      { order: 3, offsetX: 300, width: 100, marginHeight: -2 },
      { order: 4, offsetX: 400, width: 100, marginHeight: -2 },
      { order: 5, offsetX: 500, width: 100 },
    ],
    [],
    [
      { order: 0, offsetX: 25, offsetY: 250, width: 50 },
      { order: 1, offsetX: 95, offsetY: 250, width: 70, marginWidth: -20 },
    ],
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(
      canvas,
      'https://www.spriters-resource.com/resources/sheets/124/127182.png?updated=1583522244'
    );
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
      this.frameY = 2;
      return this.createForwardFrame(1000, 0, 1);
    });
  }
  dying(): Observable<any> {
    return EMPTY;

    // throw new Error("Method not implemented.");
  }
  attack(): Observable<any> {
    // throw new Error("Method not implemented.");
    return EMPTY;
  }
}
