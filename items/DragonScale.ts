import { Monster } from "../monsters/Monster";
import { dragonScaleImage } from "./images/dragon-scale-image";
import { Item } from "./Item";

export class DragonScale extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, dragonScaleImage);
  }
  useWith(monster: Monster): void {}
}
