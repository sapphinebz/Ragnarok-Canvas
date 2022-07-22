import { Monster } from "../monsters/Monster";
import { evilHornImage } from "./images/evil-horn-image";
import { Item } from "./Item";

export class EvilHorn extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, evilHornImage);
  }
  useWith(monster: Monster): void {}
}
