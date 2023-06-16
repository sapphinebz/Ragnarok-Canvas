import { EMPTY } from "rxjs";
import { filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { Monster } from "../monsters/Monster";
import { randomMinMax } from "../utils/random-minmax";
import { Skill } from "./Skill";
import { wait } from "../cores/core";

export class DoubleAttack extends Skill {
  passive: boolean = true;
  constructor(public level: number) {
    super();
  }
  useWith(monster: Monster) {
    monster.onDamageArea$
      .pipe(
        filter((area) => {
          if (area.skill && area.skill === "DoubleAttack") {
            return false;
          }
          return true;
        }),
        switchMap((area) => {
          const randomNumber = randomMinMax(0, 100);
          const doubleAttackRate = 5 * this.level;
          if (randomNumber <= doubleAttackRate) {
            return wait(monster.delayAnimationAttack).pipe(
              tap(() => {
                monster.onDamageArea$.next({ ...area, skill: "DoubleAttack" });
                this.onUse.next();
              })
            );
          }

          return EMPTY;
        }),
        takeUntil(monster.onCleanup$)
      )
      .subscribe();
  }
}
