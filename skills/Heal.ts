import { Monster } from "../monsters/Monster";
import { loadHealAudio } from "../sounds/heal-effect";
import { Skill } from "./Skill";

export class Heal extends Skill {
  passive: boolean = false;
  useAudio = loadHealAudio();
  constructor(public level: number) {
    super();

    this.useAudio.volume = 0.05;
  }
  useWith(monster: Monster, toMonster: Monster) {
    /** formula Heal */
    this.useAudio.play();
    toMonster.restoreHp(toMonster.maxHp * 0.05 * this.level);
  }
}
