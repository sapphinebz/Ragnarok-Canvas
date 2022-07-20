import { Monster } from '../monsters/Monster';
import { randomMinMax } from '../utils/random-minmax';
import { redPotionImage } from './images/red-potion-image';
import { Item } from './Item';

export class RedPotion extends Item {
  usable = true;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, redPotionImage);
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(45, 65);
    monster.restoreHp(hp);
  }
}
