import "./style.css";

import {
  animationFrameScheduler,
  AsyncSubject,
  BehaviorSubject,
  combineLatest,
  EMPTY,
  from,
  fromEvent,
  ignoreElements,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  ReplaySubject,
  share,
  startWith,
  Subject,
  switchMap,
  takeWhile,
  tap,
  timer,
} from "rxjs";
import {
  connect,
  debounceTime,
  delay,
  filter,
  map,
  mergeMap,
  repeat,
  shareReplay,
  takeUntil,
} from "rxjs/operators";
import { KeyboardController } from "./gamepad/keyboard-controller";
import { drawDamage, drawRestoreHp } from "./gamepad/number-drawer";
import { FieldItem } from "./items/Item";
import { Acidus } from "./monsters/Acidus";
import { Angeling } from "./monsters/Angeling";
import { Baphomet } from "./monsters/Baphomet";
import { ChonChon } from "./monsters/ChonChon";
import { Fabre } from "./monsters/Fabre";
import { Area, DamageArea, DIRECTION, Monster } from "./monsters/Monster";
import { Pecopeco } from "./monsters/PecoPeco";
import { Poring } from "./monsters/Poring";
import { SantaPoring } from "./monsters/SantaPoring";
import { Thief } from "./monsters/Thief";
import { loadProteraFieldVol2 } from "./sounds/prontera-field-vol2";
import { audioIsCloseImage } from "./sprites/audio-is-close-image";
import { audioIsOpenImage } from "./sprites/audio-is-open-image";
import { canvasHover, onClickCanvasArea, zIndexMonsters } from "./utils/canvas";
import { rectanglesIntersect } from "./utils/collision";
import { randomMinMax } from "./utils/random-minmax";
import { Poporing } from "./monsters/Poporing";
import { BaphometJr } from "./monsters/BaphometJr";

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
  // [Acidus, 0],
  // [Poring, 10],
  // [SantaPoring, 0],
  // [Angeling, 1],
  // [Poporing, 0],
  // [Fabre, 7],
  // [Baphomet, 1],
  // [ChonChon, 7],
  [Pecopeco, 4],
];

export const onAddFieldItem$ = new Subject<FieldItem>();
export const onRemoveFieldItem$ = new Subject<FieldItem>();
export const fieldItems = new BehaviorSubject<FieldItem[]>([]);

const createDropedItem = (monster: Monster, ClassItem: any) => {
  const itemX = randomMinMax(monster.x, monster.x + monster.width);
  const itemY = randomMinMax(monster.y, monster.y + monster.height);
  const droppedItem: FieldItem = {
    class: ClassItem,
    item: new ClassItem(),
    location: {
      x: itemX,
      y: itemY,
    },
  };

  return droppedItem;
};

export const addItemToField = (fieldItem: FieldItem) => {
  onAddFieldItem$.next(fieldItem);
  fieldItems.next([...fieldItems.value, fieldItem]);
};

export const removeItemFromField = (fieldItem: FieldItem) => {
  const index = fieldItems.value.findIndex((i) => i === fieldItem);
  if (index > -1) {
    onRemoveFieldItem$.next(fieldItem);
    fieldItem.item.cleanup();
    fieldItems.value.splice(index, 1);
    fieldItems.next(fieldItems.value);
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
const respawnMonster = (monster: Monster) => {
  monstersOnField.push(monster);
  onRespawnMonster$.next(monster);
};

const onSummonMonster$ = new Subject<Monster>();
export const summonMonster = (monster: Monster) => {
  monstersOnField.push(monster);
  onSummonMonster$.next(monster);
};

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
  monster: Monster,
  duration: number
): OperatorFunction<T, any> => {
  return (source: Observable<T>) =>
    new Observable<any>((subscriber) => {
      let timeoutIndex: any;
      const subscription = source.subscribe({
        error: (err) => {
          subscriber.error(err);
        },
        complete: () => {
          timeoutIndex = setTimeout(() => {
            removeMonsterFromField(monster);
            subscriber.next(monstersOnField);
            subscriber.complete();
          }, duration);
        },
      });
      return {
        unsubscribe: () => {
          if (timeoutIndex) {
            clearTimeout(timeoutIndex);
          }
          subscription.unsubscribe();
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
    if (monster.summonBy !== undefined) {
      return EMPTY;
    }
    const respawnTime = randomMinMax(min, max);
    return timer(respawnTime).pipe(
      tap(() => {
        const Class = getMonsterClass(monster);
        if (Class) {
          respawnMonster(new Class(canvas));
        }
      })
    );
  });
};

const corpseDisappearAndRespawn = (monster: Monster) => {
  return monster.onDied$.pipe(
    connect((dieAnimation$) => {
      const onRemoveMonsterFromField$ = dieAnimation$.pipe(
        corpseDisappearAfterAnimationEnd(monster, 5000)
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
      return corpseDisappearAndRespawn(monster);
    })
  )
  .subscribe();

const onMonstersBeAttacked = (option: {
  onEachMonster: (monster: Monster, area?: DamageArea) => void;
  onPreviousDamagedMonsters: (latestDamagedMonster: Monster[]) => void;
}): MonoTypeOperatorFunction<Area> => {
  let latestDamagedMonster: Monster[];
  return tap((area) => {
    if (latestDamagedMonster) {
      option.onPreviousDamagedMonsters(latestDamagedMonster);
    }
    latestDamagedMonster = [];
    for (const monster of monstersOnField) {
      if (!monster.isDied) {
        const monsterIsBeAttacked = rectanglesIntersect(area, {
          x: monster.x,
          y: monster.y,
          w: monster.width,
          h: monster.height,
        });

        if (monsterIsBeAttacked) {
          option.onEachMonster(monster, area);
          latestDamagedMonster.push(monster);
        }
      }
    }
  });
};

export const monstersOnField = generateMonsters();

export const removeMonsterFromField = (monster: Monster) => {
  const index = monstersOnField.findIndex((p) => p === monster);
  if (index > -1) {
    monster.cleanup();
    monstersOnField.splice(index, 1);
    tick();
  }
};

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
          onEachMonster: (monster, area) => {
            player.aggressiveWith(monster);
            player.damageTo(monster, area?.skill);
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

// cache x score location
const scoreCanvasXMap = new Map();
// cache y score location
const scoreCanvasYMap = new Map();

let backgroundSoundTogglerImage = audioIsCloseImage;
const backgroundSoundTogglerImagePosition = { x: 16, y: 16 };

const drawScore = () => {
  ctx.textAlign = "center";
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "white";
  scoreCanvasXMap.set(
    canvas.width,
    scoreCanvasXMap.get(canvas.width) ?? canvas.width - canvas.width * 0.1
  );
  scoreCanvasYMap.set(
    canvas.height,
    scoreCanvasYMap.get(canvas.height) ?? canvas.height * 0.05
  );
  ctx.fillText(
    `kill: ${killCount$.value}`,
    scoreCanvasXMap.get(canvas.width),
    scoreCanvasYMap.get(canvas.height)
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
  for (const fieldItem of fieldItems.value) {
    ctx.drawImage(
      fieldItem.item.image,
      fieldItem.location.x,
      fieldItem.location.y
    );
  }

  for (const monster of zIndexMonsters([...monstersOnField, thief])) {
    monster.drawImage();
    if (monster !== thief) {
      drawDamage(monster);
    } else {
      drawDamage(monster, { style: "red" });
    }
    drawRestoreHp(monster);
  }

  drawScore();

  ctx.drawImage(
    backgroundSoundTogglerImage,
    backgroundSoundTogglerImagePosition.x,
    backgroundSoundTogglerImagePosition.y
  );
});

killCount$.subscribe(() => tick());

const onLoadMonster$ = merge(onRespawnMonster$, from(monstersOnField)).pipe(
  shareReplay()
);

onCanvasMount$.subscribe(() => {
  keyboardController.start();
});

onCanvasMount$.pipe(switchMap(() => onLoadMonster$)).subscribe((monster) => {
  monster.randomSpawn();
});

// DropItem to Field
const onMonsterDropedItems$ = merge(onLoadMonster$, onSummonMonster$).pipe(
  mergeMap((monster) =>
    monster.onDied$.pipe(
      switchMap(() => {
        const droppedItems: FieldItem[] = [];

        for (const ClassItem of monster.stolenItems) {
          const droppedItem = createDropedItem(monster, ClassItem);
          addItemToField(droppedItem);
          droppedItems.push(droppedItem);
        }

        const dropItems = monster.dropItems;

        for (const dropItem of dropItems) {
          const dropRate = dropItem[1];
          const ClassItem = dropItem[0];
          const randomRate = randomMinMax(0, 100);
          if (randomRate <= dropRate) {
            const droppedItem = createDropedItem(monster, ClassItem);
            addItemToField(droppedItem);
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
            return timer(20000).pipe(
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
              playerUseItem(player, fieldItem),
              takeUntil(fieldItem.item.onCleanUp$)
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
    // return monster.walking().pipe(repeat());
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
