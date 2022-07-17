import './style.css';

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
  of,
  NEVER,
  combineLatest,
  repeat,
  MonoTypeOperatorFunction,
} from 'rxjs';
import {
  connect,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  shareReplay,
  takeUntil,
  throttleTime,
} from 'rxjs/operators';
import { Poring } from './monsters/Poring';
import { ACTION, Area, DIRECTION, Monster } from './monsters/Monster';
import { Fabre } from './monsters/Fabre';
import { Thief } from './monsters/Thief';
import { KeyboardController } from './gamepad/keyboard-controller';
import {
  COLLISION_DIRECTION,
  distanceBetween,
  isMouseHoverArea,
  rectanglesIntersect,
} from './utils/collision';
import { Acidus } from './monsters/Acidus';
import { randomMinMax } from './utils/random-minmax';
import { audioIsOpenImage } from './sprites/audio-is-open-image';
import { audioIsCloseImage } from './sprites/audio-is-close-image';
import { loadProteraFieldVol2 } from './sounds/prontera-field-vol2';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
const ctx = canvas.getContext('2d');
const onCanvasMouseMove$ = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(
  share()
);

const onWindowResize$ = fromEvent(window, 'resize').pipe(
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
  [Acidus, 2],
  [Poring, 20],
  [Fabre, 7],
];

const onRespawnMonster$ = new Subject<Monster>();

const getMonsterClass = (monster: Monster) => {
  const fentry = monstersClass.find(
    (entry) => entry[0].name === monster.constructor.name
  );
  return fentry[0];
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
        onRespawnMonster$.next(new Class(canvas));
      })
    );
  });
};

const showAnimationDieAndRespawn = (monster: Monster) => {
  monster.die();
  return monster.onDied$.pipe(
    connect((dieAnimation$) => {
      const onRemoveMonsterFromField$ = dieAnimation$.pipe(
        corpseDisappearAfterAnimationEnd(monster)
      );
      const respawnMonster$ = onRemoveMonsterFromField$.pipe(
        respawnMonsterRandomTime(monster, 5000, 20000)
      );
      return merge(
        onRemoveMonsterFromField$.pipe(ignoreElements()),
        respawnMonster$.pipe(ignoreElements())
      );
    })
  );
};

const monstersBeHurtOrDie = (): OperatorFunction<Monster[], any> =>
  mergeMap((collision) => {
    return from(collision).pipe(
      mergeMap((monster) => {
        if (monster.hp <= 0) {
          killCount$.next(killCount$.value + 1);
          return showAnimationDieAndRespawn(monster);
        }
        monster.hurt();
        return EMPTY;
      })
    );
  });

const findMonstersBeAttacked = (): OperatorFunction<Area, Monster[]> => {
  return map((area) => {
    return monsters.filter((monster) => {
      if (!monster.isDied) {
        const collision = rectanglesIntersect(area, monster);
        return collision !== COLLISION_DIRECTION.NOTHING;
      }
      return false;
    });
  });
};

const monsters = generateMonsters();

/**
 * PLAYER
 */
const thief = new Thief(canvas);

thief.onDamageArea$
  .pipe(
    findMonstersBeAttacked(),
    thief.aggressiveMonsters(),
    thief.decreaseTargetsHp(),
    thief.forceTargetsFaceToMe(),
    monstersBeHurtOrDie()
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
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
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
      throttleTime(0, animationFrameScheduler),
      tap(() => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      })
    );
  }),
  share()
);

const isHoverBackgroundSoundToggler$ = onCanvasMouseMove$.pipe(
  map((event) => {
    if (
      isMouseHoverArea(event, {
        x: backgroundSoundTogglerImagePosition.x,
        y: backgroundSoundTogglerImagePosition.y,
        w: backgroundSoundTogglerImage.width,
        h: backgroundSoundTogglerImage.height,
      })
    ) {
      canvas.style.cursor = 'pointer';
      return true;
    } else {
      canvas.style.cursor = 'default';
    }
    return false;
  }),
  distinctUntilChanged(),
  shareReplay(1)
);

const onToggleBackgroundSound$ = isHoverBackgroundSoundToggler$.pipe(
  switchMap((isHover) => {
    if (isHover) {
      return fromEvent(canvas, 'click');
    }
    return NEVER;
  }),
  map(() => backgroundSoundTogglerImage === audioIsOpenImage),
  share()
);

let backgroundMusic: HTMLAudioElement;
onToggleBackgroundSound$.subscribe((isOpen) => {
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
  keyboardController.start(tick);
  // thief.direction = DIRECTION.RIGHT;
  // thief.hurting().subscribe(() => tick());
});

onCanvasMount$.pipe(switchMap(() => onLoadMonster$)).subscribe((monster) => {
  monster.randomSpawn();
});

// Monsters have agressive to Player
combineLatest({
  player: thief.onMoving$.pipe(
    startWith(0),
    map(() => thief)
  ),
  monster: onLoadMonster$.pipe(
    filter((monster) => monster.checkAggressive !== undefined),
    mergeMap((monster) => {
      const alreadyAggressive$ = monster.aggressiveTarget$.pipe(
        filter((isAggressive) => isAggressive !== null)
      );
      return monster.onMoving$.pipe(
        map(() => monster),
        takeUntil(alreadyAggressive$)
      );
    })
  ),
}).subscribe(({ player, monster }) => {
  if (monster.aggressiveTarget === null) {
    monster.checkAggressive({
      target: player,
    });
  }
});

// Monster Random Action
onLoadMonster$
  .pipe(
    mergeMap((monster) => {
      monster.randomAction();
      return monster.onActionTick$.pipe(takeUntil(monster.onDied$));
      // monster.direction = DIRECTION.LEFT;
      // return monster.hurting().pipe(repeat());
    })
  )
  .subscribe(() => tick());

// FOR ACIDUS MOUSE ATTACK

// const onAcidusAttack$ = defer(() => {
//   canvas.style.cursor = 'none';
//   const mousemove$ = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(share());
//   const mousedown$ = fromEvent<MouseEvent>(canvas, 'mousedown').pipe(share());
//   const nextAction$ = new BehaviorSubject<string>('move');

//   const actions$ = merge(
//     mousedown$.pipe(map(() => 'attack')),
//     nextAction$
//   ).pipe(distinctUntilChanged(), shareReplay(1));

//   const onAnimiationAsAction$ = actions$.pipe(
//     switchMap((action) => {
//       if (action === 'attack') {
//         return acidus.attack().pipe(
//           tap(() => tick()),
//           finalize(() => nextAction$.next('move'))
//         );
//       } else if (action === 'move') {
//         return acidus.standing().pipe(
//           tap(() => {
//             tick();
//           })
//         );
//       }
//       return EMPTY;
//     })
//   );

//   const onAttackEmitCurrentPosition$ = actions$.pipe(
//     filter((action) => action === 'attack'),
//     withLatestFrom(mousemove$),
//     map(([action, event]) => event)
//   );
//   const onMoveAcidusToMouse$ = mousemove$.pipe(
//     tap((event) => {
//       acidus.x = event.x - acidus.width / 2;
//       acidus.y = event.y - acidus.height / 2;
//       tick();
//     })
//   );
//   return merge(
//     onMoveAcidusToMouse$.pipe(ignoreElements()),
//     onAttackEmitCurrentPosition$,
//     onAnimiationAsAction$.pipe(ignoreElements())
//   );
// }).pipe(share());

// onAcidusAttack$
//   .pipe(
//     map((attackEvent) => {
//       let { x: sourceX, y: sourceY } = attackEvent;
//       sourceX = sourceX - acidus.width / 2;

//       return [...fabres, ...porings].filter((monster) => {
//         if (!monster.isDie) {
//           const { x: targetX, y: targetY } = monster;
//           const distance = Math.sqrt(
//             (sourceX - targetX) ** 2 + (sourceY - targetY) ** 2
//           );
//           return distance <= 80;
//         }
//         return false;
//       });
//     }),
//     monstersRecievedDamageAndDie()
//   )
//   .subscribe();
