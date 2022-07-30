import { Monster } from "../monsters/Monster";
import { aquaMarineImage } from "./images/aqua-marine-image";
import { billsOfBirdImage } from "./images/bills-of-bird";
import { Item } from "./Item";

export class AquaMarine extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, aquaMarineImage);
  }
  useWith(monster: Monster): void {}
}
