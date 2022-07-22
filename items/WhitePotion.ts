import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { whitePotionImage } from "./images/white-potion-image";
import { Item } from "./Item";

export class WhitePotion extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, whitePotionImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    // restore 25%
    monster.restoreHp(monster.maxHp * 0.25);
    this.useAudio.play();
  }
}
