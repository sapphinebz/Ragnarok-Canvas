import { Monster } from "../monsters/Monster";
import { billsOfBirdImage } from "./images/bills-of-bird";
import { Item } from "./Item";

export class BillsOfBird extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, billsOfBirdImage);
  }
  useWith(monster: Monster): void {}
}
