import * as Field from "..";
import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { distanceBetween } from "../utils/collision";
import { CastingSkill } from "./CastingSkill";

/**
 * Heal all ally within area
 */
export class HealAll extends CastingSkill {
  useAudio = loadHealAudio();
  constructor(public level: number) {
    super();

    if (this.level <= 10) {
      this.castingTime = 500;
    } else {
      this.castingTime = 1000;
    }

    this.useAudio.volume = 0.05;
  }
  useWith(user: Monster, toMonster: Monster) {
    /** formula Heal */
    this.casting("Heal all", user, () => {
      this.useAudio.play();
      for (const monster of Field.monstersOnField) {
        const distance = distanceBetween(user, monster);
        if (distance <= 150) {
          monster.restoreHp(toMonster.maxHp * 0.05 * this.level);
        }
      }
    });
  }
}
