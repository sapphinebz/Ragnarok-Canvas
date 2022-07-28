import { Monster } from "../monsters/Monster";
import { CastingSkill } from "./CastingSkill";

/**
 * เสกลูกน้องแหละ รอแปปกำลังทำ
 */
export class ComeOnGuy extends CastingSkill {
  constructor(public level: number) {
    super();
    this.castingTime = 1000;
  }
  useWith(monster: Monster, toMonster: Monster) {
    /** formula Heal */
    // this.casting(monster, () => {
    //   this.useAudio.play();
    //   toMonster.restoreHp(toMonster.maxHp * 0.05 * this.level);
    // });
  }
}
