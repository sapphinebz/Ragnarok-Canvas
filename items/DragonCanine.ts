import { Monster } from "../monsters/Monster";
import { dragonCanineImage } from "./images/dragon-canine-image";
import { Item } from "./Item";

export class DragonCanine extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, dragonCanineImage);
  }
  useWith(monster: Monster): void {}
}
