import { Monster } from "../monsters/Monster";
import { concentrationPotionImage } from "./images/concentration-potion-image";
import { Item } from "./Item";

export class ConcentrationPotion extends Item {
  usable = true;
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, concentrationPotionImage);
  }
  useWith(monster: Monster): void {
    this.addStatusEffect(monster, {
      onEffect: () => {
        monster.attackSpeed += 10;
      },
      onTimeoutEffect: () => {
        monster.attackSpeed -= 10;
      },
      statusEffect: "ConcentrationPotion",
      timeout: 15000,
    });
  }
}
