import { Monster } from '../monsters/Monster';
import { jellopyImage } from './images/jellopy-image';
import { Item } from './Item';

export class Jellopy extends Item {
  usable = false;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, jellopyImage);
  }
  useWith(monster: Monster): void {}
}
