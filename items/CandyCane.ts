import { Monster } from '../monsters/Monster';
import { loadHealAudio } from '../sounds/heal-effect';
import { candyCaneImage } from './images/candy-cane-image';
import { Item } from './Item';

export class CandyCane extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, candyCaneImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    monster.restoreHp(monster.maxHp * 0.075);

    this.useAudio.play();
  }
}
