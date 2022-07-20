import { Monster } from '../monsters/Monster';
import { emptyBottleImage } from './images/bottle-image';
import { Item } from './Item';

export class EmptyBottle extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, emptyBottleImage);
  }
  useWith(monster: Monster): void {}
}
