import { Monster } from '../monsters/Monster';
import { loadHealAudio } from '../sounds/heal-effect';
import { randomMinMax } from '../utils/random-minmax';
import { redHerbImage } from './images/red-herb-image';
import { Item } from './Item';

export class RedHerb extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, redHerbImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(20, 30);
    monster.restoreHp(hp);
    this.useAudio.play();
  }
}
