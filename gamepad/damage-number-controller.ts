import { loadDamageNumbers } from '../sprites/load-damage-numbers';

export class DamageNumberController {
  damageNumberImage = loadDamageNumbers();

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(private canvas: HTMLCanvasElement) {}

  drawImage() {
    this.ctx.drawImage(this.damageNumberImage, 10, 10, 7, 11, 0, 0, 7, 11);
    this.ctx.drawImage(this.damageNumberImage, 27, 10, 7, 11, 8, 0, 7, 11);
    this.ctx.drawImage(this.damageNumberImage, 43, 10, 8, 11, 15, 0, 8, 11);
    this.ctx.drawImage(this.damageNumberImage, 61, 10, 9, 11, 22, 0, 9, 11);
    this.ctx.drawImage(this.damageNumberImage, 79, 10, 11, 11, 29, 0, 11, 11);
    this.ctx.drawImage(this.damageNumberImage, 96, 10, 14, 11, 35, 0, 14, 11);
    this.ctx.drawImage(this.damageNumberImage, 114, 10, 16, 11, 42, 0, 16, 11);
    this.ctx.drawImage(this.damageNumberImage, 142, 10, 8, 11, 59, 0, 8, 11);
    this.ctx.drawImage(this.damageNumberImage, 162, 10, 8, 11, 68, 0, 8, 11);
    this.ctx.drawImage(this.damageNumberImage, 182, 10, 8, 11, 77, 0, 8, 11);
  }
}
