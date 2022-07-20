import { Monster } from '../monsters/Monster';
import { loadHealAudio } from '../sounds/heal-effect';
import { randomMinMax } from '../utils/random-minmax';
import { appleImage } from './images/apple-image';
import { Item } from './Item';

export class Apple extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, appleImage);

    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(12, 25);
    monster.restoreHp(hp);
    this.useAudio.play();
  }
}
