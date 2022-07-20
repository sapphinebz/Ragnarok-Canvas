import { Monster } from '../monsters/Monster';
import { stickyMucusImage } from './images/sticky-mucus-image';
import { Item } from './Item';

export class StickyMucus extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, stickyMucusImage);
  }
  useWith(monster: Monster): void {}
}
