import { Monster } from "../monsters/Monster";
import { shellImage } from "./images/shell-image";
import { Item } from "./Item";

export class Shell extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, shellImage);
  }
  useWith(monster: Monster): void {}
}
