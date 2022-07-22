import { Monster } from "../monsters/Monster";
import { roughWindImage } from "./images/rough-wind-image";
import { Item } from "./Item";

export class RoughWind extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, roughWindImage);
  }
  useWith(monster: Monster): void {}
}
