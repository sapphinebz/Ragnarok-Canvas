import { Monster } from "../monsters/Monster";
import { Skill } from "./Skill";

export class Heal extends Skill {
  passive: boolean = false;
  constructor(public level: number) {
    super();
  }
  useWith(monster: Monster, toMonster: Monster) {
    /** formula Heal */
    toMonster.restoreHp(toMonster.maxHp * 0.05 * this.level);
  }
}
