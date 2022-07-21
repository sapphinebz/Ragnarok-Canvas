import { Monster } from '../monsters/Monster';
import { featherImage } from './images/feather-image';
import { Item } from './Item';

export class Feather extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, featherImage);
  }
  useWith(monster: Monster): void {}
}
