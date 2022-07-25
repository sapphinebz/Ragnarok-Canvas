import "./style.css";

import {
  fromEvent,
  startWith,
  tap,
  switchMap,
  animationFrameScheduler,
  share,
  Subject,
  timer,
  from,
  AsyncSubject,
  merge,
  OperatorFunction,
  ignoreElements,
  BehaviorSubject,
  Observable,
  ReplaySubject,
  EMPTY,
  MonoTypeOperatorFunction,
  combineLatest,
  takeWhile,
} from "rxjs";
import {
  connect,
  debounceTime,
  delay,
  filter,
  map,
  mergeMap,
  shareReplay,
  takeUntil,
} from "rxjs/operators";
import { Poring } from "./monsters/Poring";
import { Area, Monster } from "./monsters/Monster";
import { Fabre } from "./monsters/Fabre";
import { Thief } from "./monsters/Thief";
import { KeyboardController } from "./gamepad/keyboard-controller";
import { rectanglesIntersect } from "./utils/collision";
import { Acidus } from "./monsters/Acidus";
import { randomMinMax } from "./utils/random-minmax";
import { audioIsOpenImage } from "./sprites/audio-is-open-image";
import { audioIsCloseImage } from "./sprites/audio-is-close-image";
import { loadProteraFieldVol2 } from "./sounds/prontera-field-vol2";
import { Baphomet } from "./monsters/Baphomet";
import { Angeling } from "./monsters/Angeling";
import { SantaPoring } from "./monsters/SantaPoring";
import { FieldItem } from "./items/Item";
import { drawDamage, drawRestoreHp } from "./gamepad/number-drawer";
import { canvasHover, onClickCanvasArea } from "./utils/canvas";
import { ChonChon } from "./monsters/ChonChon";

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const ctx = canvas.getContext("2d")!;

const onWindowResize$ = fromEvent(window, "resize").pipe(
  startWith(0),
  tap(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  })
);

/**
 * MONSTERS
 */
// number monster in field & class
const monstersClass: [any, number][] = [
  [Acidus, 1],
  [Poring, 5],
  [SantaPoring, 5],
  [Angeling, 1],
  [Fabre, 7],
  [Baphomet, 1],
  [ChonChon, 5],
];

const fieldItems: FieldItem[] = [];

const addAddItemToField = (fieldItem: FieldItem) => {
  fieldItems.push(fieldItem);
};

const removeItemFromField = (fieldItem: FieldItem) => {
  const index = fieldItems.findIndex((i) => i === fieldItem);
  if (index > -1) {
    fieldItems.splice(index, 1);
  }
};

const playerUseItem = <T>(
  player: Monster,
  fieldItem: FieldItem
): MonoTypeOperatorFunction<T> => {
  return takeWhile((isCollsion) => {
    if (isCollsion) {
      removeItemFromField(fieldItem);
      fieldItem.item.useWith(player);
    }
    return !isCollsion;
  });
};

const checkPlayerCollideItem = (
  player: Monster,
  fieldItem: FieldItem
): OperatorFunction<any, boolean> => {
  return map(() => {
    return rectanglesIntersect(
      {
        x: fieldItem.location.x,
        y: fieldItem.location.y,
        w: fieldItem.item.width,
        h: fieldItem.item.height,
      },
      {
        x: player.x + player.width / 4,
        y: player.y + player.height / 2,
        w: player.width / 2,
        h: player.height,
      }
    );
  });
};

const onRespawnMonster$ = new Subject<Monster>();

const getMonsterClass = (monster: Monster) => {
  const fentry = monstersClass.find(
    (entry) => entry[0].name === monster.constructor.name
  );
  return fentry && fentry[0];
};

const generateMonsters = () =>
  monstersClass.reduce((mons, entry) => {
    const Class = entry[0];
    const amount = entry[1];
    Array.from({ length: amount }, () => {
      mons.push(new Class(canvas));
    });
    return mons;
  }, [] as Monster[]);

const corpseDisappearAfterAnimationEnd = <T>(
  monster: Monster
): OperatorFunction<T, any> => {
  return (source: Observable<T>) =>
    new Observable<any>((subscriber) => {
      const unsubscribe$ = new ReplaySubject<void>(1);
      source.pipe(takeUntil(unsubscribe$)).subscribe({
        error: (err) => {
          subscriber.error(err);
        },
        complete: () => {
          timer(1500)
            .pipe(takeUntil(unsubscribe$))
            .subscribe(() => {
              const index = monsters.findIndex((p) => p === monster);
              if (index > -1) {
                monster.cleanup();
                monsters.splice(index, 1);
                tick();
              }
              subscriber.next(monsters);
              subscriber.complete();
            });
        },
      });
      return {
        unsubscribe: () => {
          unsubscribe$.next();
          unsubscribe$.complete();
        },
      };
    });
};

const respawnMonsterRandomTime = (
  monster: Monster,
  min: number,
  max: number
) => {
  return switchMap(() => {
    const respawnTime = randomMinMax(min, max);
    return timer(respawnTime).pipe(
      tap(() => {
        const Class = getMonsterClass(monster);
        if (Class) {
          onRespawnMonster$.next(new Class(canvas));
        }
      })
    );
  });
};

const showAnimationDieAndRespawn = (monster: Monster) => {
  return monster.onDied$.pipe(
    connect((dieAnimation$) => {
      const onRemoveMonsterFromField$ = dieAnimation$.pipe(
        corpseDisappearAfterAnimationEnd(monster)
      );
      const respawnMonster$ = onRemoveMonsterFromField$.pipe(
        respawnMonsterRandomTime(
          monster,
          monster.respawnTimeMin,
          monster.respawnTimeMax
        )
      );
      return merge(
        onRemoveMonsterFromField$.pipe(ignoreElements()),
        respawnMonster$.pipe(ignoreElements())
      );
    })
  );
};

const onMonsterDied$ = new Subject<Monster>();

onMonsterDied$
  .pipe(
    mergeMap((monster) => {
      killCount$.next(killCount$.value + 1);
      return showAnimationDieAndRespawn(monster);
    })
  )
  .subscribe();

const onMonstersBeAttacked = (option: {
  onEachMonster: (monster: Monster) => void;
  onPreviousDamagedMonsters: (latestDamagedMonster: Monster[]) => void;
}): MonoTypeOperatorFunction<Area> => {
  let latestDamagedMonster: Monster[];
  return tap((area) => {
    if (latestDamagedMonster) {
      option.onPreviousDamagedMonsters(latestDamagedMonster);
    }
    latestDamagedMonster = [];
    for (const monster of monsters) {
      if (!monster.isDied) {
        const monsterIsBeAttacked = rectanglesIntersect(area, {
          x: monster.x,
          y: monster.y,
          w: monster.width,
          h: monster.height,
        });

        if (monsterIsBeAttacked) {
          option.onEachMonster(monster);
          latestDamagedMonster.push(monster);
        }
      }
    }
  });
};

const monsters = generateMonsters();

/**
 * PLAYER
 */
const thief = new Thief(canvas);

const onLoadPlayer$ = new BehaviorSubject<Monster>(thief);

onLoadPlayer$
  .pipe(
    mergeMap((player) => {
      return player.onDamageArea$.pipe(
        onMonstersBeAttacked({
          onPreviousDamagedMonsters: (monsters) => {
            for (const monster of monsters) {
              monster.showHpGauge = false;
            }
          },
          onEachMonster: (monster) => {
            player.aggressiveWith(monster);
            player.damageTo(monster);
            monster.faceTo(player);
            monster.showHpGauge = true;
            const isDied = monster.animateDieOrHurt();
            if (isDied) {
              onMonsterDied$.next(monster);
            }
          },
        })
      );
    })
  )
  .subscribe();

/**
 * GAME
 */

const keyboardController = new KeyboardController(canvas, thief);

const killCount$ = new BehaviorSubject(0);

let backgroundSoundTogglerImage = audioIsCloseImage;
const backgroundSoundTogglerImagePosition = { x: 16, y: 16 };

const drawScore = () => {
  ctx.textAlign = "center";
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(
    `kill: ${killCount$.value}`,
    canvas.width - canvas.width * 0.1,
    canvas.height * 0.05
  );
};

const render$ = new Subject<void>();

// call this function to make render canvas
const tick = () => {
  render$.next();
};

const onCanvasMount$ = new AsyncSubject<void>();

const onCanvasRender$ = onWindowResize$.pipe(
  switchMap(() => {
    onCanvasMount$.next();
    onCanvasMount$.complete();

    return render$.pipe(
      debounceTime(0, animationFrameScheduler),
      tap(() => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      })
    );
  }),
  share()
);

let backgroundMusic: HTMLAudioElement;
canvasHover(canvas, {
  x: backgroundSoundTogglerImagePosition.x,
  y: backgroundSoundTogglerImagePosition.y,
  w: backgroundSoundTogglerImage.width,
  h: backgroundSoundTogglerImage.height,
})
  .pipe(
    tap((isHover) => {
      if (isHover) {
        canvas.style.cursor = "pointer";
      } else {
        canvas.style.cursor = "default";
      }
    }),
    onClickCanvasArea(canvas),
    map(() => backgroundSoundTogglerImage === audioIsOpenImage)
  )
  .subscribe((isOpen) => {
    if (isOpen) {
      backgroundSoundTogglerImage = audioIsCloseImage;
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    } else {
      backgroundSoundTogglerImage = audioIsOpenImage;
      if (!backgroundMusic) {
        backgroundMusic = loadProteraFieldVol2();
        backgroundMusic.volume = 0.05;
        backgroundMusic.loop = true;
      }
      if (backgroundMusic) {
        backgroundMusic.play();
      }
    }
    tick();
  });

onCanvasRender$.subscribe(() => {
  for (const fieldItem of fieldItems) {
    ctx.drawImage(
      fieldItem.item.image,
      fieldItem.location.x,
      fieldItem.location.y
    );
  }

  monsters.sort(
    (monsterA, monsterB) =>
      monsterA.y + monsterA.height - (monsterB.y + monsterB.height)
  );
  for (const monster of monsters) {
    monster.drawImage();
  }

  keyboardController.drawPlayer();

  drawScore();

  ctx.drawImage(
    backgroundSoundTogglerImage,
    backgroundSoundTogglerImagePosition.x,
    backgroundSoundTogglerImagePosition.y
  );

  for (const monster of monsters) {
    drawDamage(monster);
  }

  drawDamage(thief, { style: "red" });
  drawRestoreHp(thief);
});

killCount$.subscribe(() => tick());

const onLoadMonster$ = merge(
  onRespawnMonster$.pipe(
    tap((monster) => {
      monsters.push(monster);
    })
  ),
  from(monsters)
).pipe(shareReplay());

onCanvasMount$.subscribe(() => {
  keyboardController.start();
});

onCanvasMount$.pipe(switchMap(() => onLoadMonster$)).subscribe((monster) => {
  monster.randomSpawn();
});

// DropItem to Field
const onMonsterDropedItems$ = onLoadMonster$.pipe(
  mergeMap((monster) =>
    monster.onDied$.pipe(
      switchMap(() => {
        const dropItems = monster.dropItems;
        const droppedItems: FieldItem[] = [];

        for (const dropItem of dropItems) {
          const dropRate = dropItem[1];
          const ClassItem = dropItem[0];
          const randomRate = randomMinMax(0, 100);
          if (randomRate <= dropRate) {
            const itemX = randomMinMax(monster.x, monster.x + monster.width);
            const itemY = randomMinMax(monster.y, monster.y + monster.height);
            const droppedItem = {
              item: new ClassItem(),
              location: {
                x: itemX,
                y: itemY,
              },
            };
            addAddItemToField(droppedItem);
            droppedItems.push(droppedItem);
          }
        }

        return from(droppedItems);
      }),
      connect((droppedItem$) => {
        const delayCanPick = 400;

        const removeUselessItem$ = droppedItem$.pipe(
          filter((fieldItem) => {
            return fieldItem.item.usable === false;
          }),
          mergeMap((fieldItem) => {
            return timer(10000).pipe(
              tap(() => {
                removeItemFromField(fieldItem);
              })
            );
          })
        );

        const playerCanPick$ = combineLatest([
          onLoadPlayer$,
          droppedItem$.pipe(
            filter((fieldItem) => fieldItem.item.usable === true),
            delay(delayCanPick)
          ),
        ]).pipe(
          mergeMap(([player, fieldItem]) => {
            return player.onMoving$.pipe(
              checkPlayerCollideItem(player, fieldItem),
              playerUseItem(player, fieldItem)
            );
          })
        );
        return merge(
          droppedItem$,
          playerCanPick$.pipe(ignoreElements()),
          removeUselessItem$.pipe(ignoreElements())
        );
      })
    )
  )
);

// Monster Random Action
const onMonsterTickRender$ = onLoadMonster$.pipe(
  mergeMap((monster) => {
    monster.randomAction();
    monster.autoAggressiveOnVisionTarget(onLoadPlayer$);
    return monster.onActionTick$.pipe(takeUntil(monster.onCleanup$));
    // monster.direction = DIRECTION.RIGHT;
    // return monster.standing().pipe(repeat());
  })
);

const onPlayerTickRender$ = onLoadPlayer$.pipe(
  mergeMap((player) => player.onActionTick$.pipe(takeUntil(player.onDied$)))
);

merge(
  onMonsterTickRender$,
  onPlayerTickRender$,
  onMonsterDropedItems$
).subscribe(() => tick());
