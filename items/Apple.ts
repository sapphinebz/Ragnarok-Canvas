import { Monster } from '../monsters/Monster';
import { randomMinMax } from '../utils/random-minmax';
import { appleImage } from './images/apple-image';
import { Item } from './Item';

export class Apple extends Item {
  usable = true;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, appleImage);
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(12, 25);
    monster.restoreHp(hp);
  }
}
