import { EMPTY, timer } from "rxjs";
import { filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { Monster } from "../monsters/Monster";
import { randomMinMax } from "../utils/random-minmax";
import { Skill } from "./Skill";

export class DoubleAttack extends Skill {
  passive: boolean = true;
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
          const doubleAttackRate = 25;
          if (randomNumber <= doubleAttackRate) {
            return timer(monster.delayAnimationAttack).pipe(
              tap(() => {
                monster.onDamageArea$.next({ ...area, skill: "DoubleAttack" });
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
