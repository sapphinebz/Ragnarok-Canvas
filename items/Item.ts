import { Monster, MoveLocation } from '../monsters/Monster';

export interface FieldItem {
  item: Item;
  location: MoveLocation;
}

export type DropItems = [any, number][];

export abstract class Item {
  usable = false;

  get width() {
    return this.image.width;
  }

  get height() {
    return this.image.height;
  }

  get ctx() {
    return this.canvas.getContext('2d');
  }
  constructor(
    public canvas: HTMLCanvasElement,
    public image: HTMLImageElement
  ) {}

  abstract useWith(monster: Monster): void;
}
