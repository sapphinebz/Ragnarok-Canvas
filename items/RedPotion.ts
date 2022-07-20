import { Monster } from '../monsters/Monster';
import { loadHealAudio } from '../sounds/heal-effect';
import { randomMinMax } from '../utils/random-minmax';
import { redPotionImage } from './images/red-potion-image';
import { Item } from './Item';

export class RedPotion extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, redPotionImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(45, 65);
    monster.restoreHp(hp);
    this.useAudio.play();
  }
}
