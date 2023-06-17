import { forkJoin, from, merge, mergeMap, Subject, takeUntil } from "rxjs";
import {
  tap,
  switchMap,
  repeat,
  debounceTime,
  ignoreElements,
} from "rxjs/operators";
import { Monster } from "../monsters/Monster";
import { CastingSkill } from "./CastingSkill";
import * as Field from "..";
import { randomLocationAroundTarget } from "../utils/random-minmax";
import { wait } from "../cores/core";

export class ComeOn extends CastingSkill {
  onSummon$ = new Subject<Monster[]>();
  onAllSummonDied$ = this.onSummon$.pipe(
    switchMap((monsters) => forkJoin(monsters.map((m) => m.onDied$)))
  );

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
      this.onSummon$.next(summonMonsters);
      const groupAggressiveTarget$ = new Subject<Monster>();
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

            const tellFiendsAboutAggressive$ =
              summonMonster.aggressiveTarget$.pipe(
                tap((player) => {
                  if (player) {
                    groupAggressiveTarget$.next(player);
                    if (!user.aggressiveTarget) {
                      player.aggressiveWith(user);
                      user.faceTo(player);
                    }
                  }
                })
              );

            const aggressiveWithFriends$ = groupAggressiveTarget$.pipe(
              tap((player) => {
                if (!summonMonster.aggressiveTarget) {
                  player.aggressiveWith(summonMonster);
                  summonMonster.faceTo(player);
                }
              })
            );

            return merge(
              tellFiendsAboutAggressive$.pipe(ignoreElements()),
              aggressiveWithFriends$.pipe(ignoreElements()),
              user.onDied$
              // autoToHostAggressive$.pipe(ignoreElements())
            ).pipe(
              tap(() => {
                summonMonster.die();
                wait(5000).subscribe(() => {
                  Field.removeMonsterFromField(summonMonster);
                });
              })
            );
          }),
          takeUntil(user.onCleanup$)
        )
        .subscribe();
    });
  }

  /**
   * for skill behavior
   * after all summon died will re-cooldown this skill
   */
  allSummonDiedCanUseAfter(duration: number) {
    return repeat({
      delay: () => this.onAllSummonDied$.pipe(debounceTime(duration)),
    });
  }
}
