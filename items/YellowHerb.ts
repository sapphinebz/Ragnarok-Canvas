import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { randomMinMax } from "../utils/random-minmax";
import { yellowHerbImage } from "./images/yellow-herb-image";
import { Item } from "./Item";

export class YellowHerb extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, yellowHerbImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(30, 40);
    monster.restoreHp(hp);
    this.useAudio.play();
  }
}
