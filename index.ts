import "./style.css";

import {
  AsyncSubject,
  BehaviorSubject,
  combineLatest,
  defer,
  EMPTY,
  from,
  fromEvent,
  ignoreElements,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  ReplaySubject,
  Subject,
  switchMap,
  takeWhile,
  tap,
  using,
} from "rxjs";
import {
  audit,
  connect,
  debounce,
  delay,
  filter,
  map,
  mergeMap,
  shareReplay,
  take,
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
import { requireResurrectChatRoomImage } from "./sprites/require-resurrect-chat-room";
import { loadResurrectionSkill } from "./sounds/resurrection-skill";
import { backSlideImage } from "./sprites/back-slide-image";
import {
  canvas,
  context,
  deltaTime$,
  loadSprite,
  loopFrameIndex,
  onKeyPress,
  onResourceInit$,
  throttleTime,
  wait,
  windowSize$,
} from "./cores/core";
import { thiefLeftSpriteImage } from "./sprites/load-thief-left";
import { thiefRightSpriteImage } from "./sprites/load-thief-right";

loadSprite("theif", thiefLeftSpriteImage);
loadSprite("thief", thiefRightSpriteImage);

/**
 * MONSTERS
 */
// number monster in field & class
const monstersClass: [any, number][] = [
  [Acidus, 0],
  [Poring, 10],
  [SantaPoring, 0],
  [Angeling, 1],
  [Poporing, 0],
  [Fabre, 7],
  [Baphomet, 1],
  [ChonChon, 7],
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
  return (dieAnimation$: Observable<T>) => {
    const animateCompleted = new AsyncSubject<any>();
    return using(
      () => {
        return dieAnimation$.subscribe(animateCompleted);
      },
      () =>
        animateCompleted.pipe(
          audit(() => wait(duration)),
          map(() => {
            removeMonsterFromField(monster);
            return monstersOnField;
          })
        )
    );
  };
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
    return wait(respawnTime).pipe(
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
  }
};

/**
 * PLAYER
 */
const thief = new Thief(canvas);

const onLoadPlayer$ = new ReplaySubject<Monster>(1);
const players$ = new BehaviorSubject<Monster[]>([]);
const getAllPlayer = () => {
  return players$.value;
};

const addPlayer = (player: Monster) => {
  player.isPlayer = true;
  onLoadPlayer$.next(player);
  players$.next([...players$.value, player]);
};

const removePlayer = (player: Monster) => {
  const players = players$.value;
  const index = players.findIndex((p) => p === player);
  if (index > -1) {
    players.splice(index, 1);
    players$.next([...players$.value]);
    player.cleanup();
  }
};

const resurrectPlayer = (player: Monster) => {
  const audio = loadResurrectionSkill();
  audio.volume = 0.05;
  audio.play();
  const newPlayer = new Thief(canvas);
  newPlayer.x = player.x;
  newPlayer.y = player.y;
  removePlayer(player);
  addPlayer(newPlayer);
};

addPlayer(thief);

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
        }),
        takeUntil(player.onCleanup$)
      );
    })
  )
  .subscribe();

/**
 * GAME
 */

const killCount$ = new BehaviorSubject(0);

// cache x score location
const scoreCanvasXMap = new Map();
// cache y score location
const scoreCanvasYMap = new Map();

let backgroundSoundTogglerImage = audioIsCloseImage;
const onLoadedImageSoundToggler$ = fromEvent(
  backgroundSoundTogglerImage,
  "load"
).pipe(take(1));
const backgroundSoundTogglerImagePosition = { x: 16, y: 16 };

const drawScore = () => {
  context.textAlign = "center";
  context.font = "bold 24px Arial";
  context.fillStyle = "white";
  scoreCanvasXMap.set(
    canvas.width,
    scoreCanvasXMap.get(canvas.width) ?? canvas.width - canvas.width * 0.1
  );
  scoreCanvasYMap.set(
    canvas.height,
    scoreCanvasYMap.get(canvas.height) ?? canvas.height * 0.05
  );
  context.fillText(
    `kill: ${killCount$.value}`,
    scoreCanvasXMap.get(canvas.width),
    scoreCanvasYMap.get(canvas.height)
  );
};

let backgroundMusic: HTMLAudioElement;

onLoadedImageSoundToggler$
  .pipe(
    switchMap(() => windowSize$),
    switchMap(() => {
      return canvasHover(canvas, {
        x: backgroundSoundTogglerImagePosition.x,
        y: backgroundSoundTogglerImagePosition.y,
        w: backgroundSoundTogglerImage.width,
        h: backgroundSoundTogglerImage.height,
      }).pipe(
        onClickCanvasArea(canvas),
        map(() => backgroundSoundTogglerImage === audioIsOpenImage)
      );
    })
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
        backgroundMusic.volume = 0.1;
        backgroundMusic.loop = true;
      }
      if (backgroundMusic) {
        backgroundMusic.play();
      }
    }
  });

const onDrawAfter$ = new Subject<void>();

deltaTime$.subscribe(() => {
  for (const fieldItem of fieldItems.value) {
    context.drawImage(
      fieldItem.item.image,
      fieldItem.location.x,
      fieldItem.location.y
    );
  }

  for (const monster of zIndexMonsters([
    ...monstersOnField,
    ...getAllPlayer(),
  ])) {
    monster.drawImage();
    if (!monster.isPlayer) {
      drawDamage(monster);
    } else {
      drawDamage(monster, { style: "red" });
    }
    drawRestoreHp(monster);
  }

  drawScore();

  context.drawImage(
    backgroundSoundTogglerImage,
    backgroundSoundTogglerImagePosition.x,
    backgroundSoundTogglerImagePosition.y
  );

  context.drawImage(backSlideImage, 75, 18);
  context.textAlign = "center";
  context.font = "normal 18px Arial";
  context.fillStyle = "white";
  context.fillText(`C`, 87, 60);

  if (onDrawAfter$.observed) {
    onDrawAfter$.next();
  }
});

// Display ChatRoom and Resurrection
onLoadPlayer$
  .pipe(
    mergeMap((player) => {
      return player.onDied$.pipe(
        delay(1500),
        switchMap(() => {
          const displayChatRoom$ = onDrawAfter$.pipe(
            tap(() => {
              if (player.direction === DIRECTION.RIGHT) {
                context.drawImage(
                  requireResurrectChatRoomImage,
                  player.x - 100,
                  player.y - 25
                );
              } else if (player.direction === DIRECTION.LEFT) {
                context.drawImage(
                  requireResurrectChatRoomImage,
                  player.x,
                  player.y - 25
                );
              }
            })
          );

          const hoverChatRoom$ = defer(() => {
            if (player.direction === DIRECTION.RIGHT) {
              return canvasHover(canvas, {
                x: player.x - 100,
                y: player.y - 25,
                w: requireResurrectChatRoomImage.width,
                h: requireResurrectChatRoomImage.height,
              });
            } else if (player.direction === DIRECTION.LEFT) {
              return canvasHover(canvas, {
                x: player.x,
                y: player.y - 25,
                w: requireResurrectChatRoomImage.width,
                h: requireResurrectChatRoomImage.height,
              });
            }
            return EMPTY;
          }).pipe(
            onClickCanvasArea(canvas),
            tap(() => {
              resurrectPlayer(player);
            })
          );

          return merge(displayChatRoom$, hoverChatRoom$);
        }),
        takeUntil(player.onCleanup$)
      );
    })
  )
  .subscribe();

// killCount$.subscribe(() => tick());

const onLoadMonster$ = merge(onRespawnMonster$, from(monstersOnField)).pipe(
  shareReplay()
);

let keyboardController: KeyboardController;
onLoadPlayer$
  .pipe(
    debounce(() => onResourceInit$),
    tap((player) => {
      if (keyboardController) {
        keyboardController.cleanup();
      }
      keyboardController = new KeyboardController(canvas, player);
      keyboardController.start();
    })
  )
  .subscribe();

onResourceInit$.pipe(switchMap(() => onLoadMonster$)).subscribe((monster) => {
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
            return wait(20000).pipe(
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
              throttleTime(50),
              checkPlayerCollideItem(player, fieldItem),
              playerUseItem(player, fieldItem),
              takeUntil(fieldItem.item.onCleanUp$),
              takeUntil(player.onCleanup$)
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

merge(onLoadMonster$, onSummonMonster$).subscribe((monster) => {
  if (!monster.summonBy) {
    monster.randomAction();
  }
  monster.autoAggressiveOnVisionTarget(onLoadPlayer$);
});

onMonsterDropedItems$.subscribe();
