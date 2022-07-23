import { Monster } from "../monsters/Monster";
import { loadAgilityUpAudio } from "../sounds/agility-up";
import { concentrationPotionImage } from "./images/concentration-potion-image";
import { Item } from "./Item";

export class ConcentrationPotion extends Item {
  usable = true;
  agilityUpAudio = loadAgilityUpAudio();
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, concentrationPotionImage);

    this.agilityUpAudio.volume = 0.05;
  }
  useWith(monster: Monster): void {
    this.agilityUpAudio.play();
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
