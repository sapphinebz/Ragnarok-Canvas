import { Monster } from '../monsters/Monster';
import { loadHealAudio } from '../sounds/heal-effect';
import { candyImage } from './images/candy-image';
import { Item } from './Item';

export class Candy extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, candyImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    monster.restoreHp(monster.maxHp * 0.06);

    this.useAudio.play();
  }
}
