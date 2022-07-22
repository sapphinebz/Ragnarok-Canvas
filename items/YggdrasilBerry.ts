import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { yggdrasilBerryImage } from "./images/yggdrasil-berry-image";
import { Item } from "./Item";

export class YggdrasilBerry extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, yggdrasilBerryImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    // restore 100%
    monster.restoreHp(monster.maxHp);
    this.useAudio.play();
  }
}
