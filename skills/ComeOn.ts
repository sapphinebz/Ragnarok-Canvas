import { from, mergeMap, takeUntil } from "rxjs";
import { tap } from "rxjs/operators";
import { Monster } from "../monsters/Monster";
import { CastingSkill } from "./CastingSkill";
import * as Field from "..";
import { randomLocationAroundTarget } from "../utils/random-minmax";

export class ComeOn extends CastingSkill {
  constructor(
    public config: {
      level: number;
      summonMonsters: () => Monster[];
    }
  ) {
    super();
    this.castingTime = 500;
  }
  useWith(user: Monster) {
    this.casting("รุมโว้ย", user, () => {
      const summonMonsters = this.config.summonMonsters();

      from(summonMonsters)
        .pipe(
          mergeMap((summonMonster) => {
            if (user.aggressiveTarget) {
              randomLocationAroundTarget(user.aggressiveTarget, summonMonster);
            } else {
              randomLocationAroundTarget(user, summonMonster);
            }
            Field.summonMonster(summonMonster);
            summonMonster.summonBy = user;

            if (user.aggressiveTarget) {
              const player = user.aggressiveTarget;
              player.aggressiveWith(summonMonster);
              summonMonster.faceTo(player);
            }
            return user.onDied$.pipe(
              tap(() => {
                summonMonster.die();
              })
            );
          }),
          takeUntil(user.onCleanup$)
        )
        .subscribe();
    });
  }
}
