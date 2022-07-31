import {
  AsyncSubject,
  connectable,
  forkJoin,
  from,
  mergeMap,
  ReplaySubject,
  Subject,
  takeUntil,
} from "rxjs";
import { tap, switchMap, repeat, debounceTime } from "rxjs/operators";
import { Monster } from "../monsters/Monster";
import { CastingSkill } from "./CastingSkill";
import * as Field from "..";
import { randomLocationAroundTarget } from "../utils/random-minmax";

export class ComeOn extends CastingSkill {
  onCleanup$ = new AsyncSubject<void>();
  onSummon$ = new Subject<Monster[]>();
  allSummonDied$ = connectable(
    this.onSummon$.pipe(
      switchMap((monsters) => forkJoin(monsters.map((m) => m.onDied$))),
      takeUntil(this.onCleanup$)
    ),
    {
      resetOnDisconnect: false,
      connector: () => new ReplaySubject(1),
    }
  );

  constructor(
    public config: {
      level: number;
      summonMonsters: () => Monster[];
    }
  ) {
    super();
    this.castingTime = 500;

    this.allSummonDied$.connect();
  }

  useWith(user: Monster) {
    user.onCleanup$.subscribe(this.onCleanup$);

    this.casting("รุมโว้ย", user, () => {
      const summonMonsters = this.config.summonMonsters();
      this.onSummon$.next(summonMonsters);
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
                setTimeout(() => {
                  Field.removeMonsterFromField(summonMonster);
                }, 5000);
              })
            );
          }),
          takeUntil(this.onCleanup$)
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
      delay: () => this.allSummonDied$.pipe(debounceTime(duration)),
    });
  }
}
