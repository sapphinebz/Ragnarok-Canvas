import { Monster } from '../monsters/Monster';
import { loadHealAudio } from '../sounds/heal-effect';
import { randomMinMax } from '../utils/random-minmax';
import { whiteHerbImage } from './images/white-herb-image';
import { Item } from './Item';

export class WhiteHerb extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, whiteHerbImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(20, 75);
    monster.restoreHp(hp);
    this.useAudio.play();
  }
}
