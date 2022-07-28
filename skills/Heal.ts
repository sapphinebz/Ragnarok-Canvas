import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { CastingSkill } from "./CastingSkill";

export class Heal extends CastingSkill {
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
  useWith(monster: Monster, toMonster: Monster) {
    /** formula Heal */
    this.casting(monster, () => {
      this.useAudio.play();
      toMonster.restoreHp(toMonster.maxHp * 0.05 * this.level);
    });
  }
}
