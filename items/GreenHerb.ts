import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { randomMinMax } from "../utils/random-minmax";
import { greenHerbImage } from "./images/green-herb-image";
import { Item } from "./Item";

export class GreenHerb extends Item {
  usable = true;
  useAudio = loadHealAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, greenHerbImage);
    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    const hp = randomMinMax(15, 25);
    monster.restoreHp(hp);
    this.useAudio.play();
  }
}
