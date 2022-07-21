import { Monster } from '../monsters/Monster';
import { fluffImage } from './images/fluff-image';
import { Item } from './Item';

export class Fluff extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, fluffImage);
  }
  useWith(monster: Monster): void {}
}
