import './style.css';

import {
  fromEvent,
  startWith,
  tap,
  switchMap,
  animationFrameScheduler,
  share,
  filter,
  Subject,
  timer,
  from,
  AsyncSubject,
  merge,
  pipe,
  OperatorFunction,
  defer,
  ignoreElements,
  EMPTY,
  BehaviorSubject,
  Operator,
} from 'rxjs';
import {
  connect,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  mergeMap,
  onErrorResumeNext,
  shareReplay,
  takeLast,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { Acidus } from './monsters/Acidus';
import { Poring } from './monsters/Poring';
import { Monster } from './monsters/Monster';
import { Fabre } from './monsters/Fabre';
import { Thief } from './monsters/Thief';
import { KeyboardController } from './gamepad/keyboard-controller';
import {
  collideWithArea,
  COLLISION_DIRECTION,
  rectanglesIntersect,
} from './utils/collision';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
const ctx = canvas.getContext('2d');
const onWindowResize$ = fromEvent(window, 'resize').pipe(
  startWith(0),
  tap(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  })
);

const acidus = new Acidus(canvas);

const porings = Array.from({ length: 20 }, () => new Poring(canvas));
const fabres = Array.from({ length: 7 }, () => new Fabre(canvas));
const thief = new Thief(canvas);

const keyboardController = new KeyboardController(canvas, thief);

const onRespawnMonster$ = new Subject<Monster>();

const killCount$ = new BehaviorSubject(0);

const render$ = new Subject<void>();

// call this function to make render canvas
const tick = () => {
  render$.next();
};

const onEndAnimationRemoveMonster = <T>(
  findMonsters: () => Monster[],
  monster: Monster
): OperatorFunction<T, any> => {
  return pipe(
    onErrorResumeNext(
      timer(1500).pipe(
        tap(() => {
          const monsters = findMonsters();
          const index = monsters.findIndex((p) => p === monster);
          if (index > -1) {
            monsters.splice(index, 1);
            // tick();
          }
        })
      )
    )
  );
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

onCanvasRender$.subscribe(() => {
  porings.forEach((poring) => poring.drawImage());
  fabres.forEach((fabre) => fabre.drawImage());

  keyboardController.drawPlayer();
  // acidus.drawImage();

  ctx.textAlign = 'center';
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(
    `kill: ${killCount$.value}`,
    canvas.width - canvas.width * 0.1,
    canvas.height * 0.05
  );
});

killCount$.subscribe(() => tick());

const onLoadMonster$ = merge(
  onRespawnMonster$.pipe(
    tap((monster) => {
      if (monster instanceof Poring) {
        porings.push(monster);
      } else if (monster instanceof Fabre) {
        fabres.push(monster);
      }
    })
  ),
  from(porings),
  from(fabres)
).pipe(shareReplay());

onCanvasMount$.subscribe(() => {
  keyboardController.start(tick);
});

// thief.attack().subscribe(() => tick());

onCanvasMount$.pipe(switchMap(() => onLoadMonster$)).subscribe((monster) => {
  monster.randomSpawn();
});

onLoadMonster$
  .pipe(
    mergeMap((monster) =>
      monster.randomAction().pipe(takeUntil(monster.onDied$))
    )
  )
  .subscribe(() => {
    tick();
  });

const monstersRecievedDamageAndDie = (): OperatorFunction<Monster[], any> =>
  mergeMap((collision) => {
    return from(collision).pipe(
      mergeMap((monster) => {
        killCount$.next(killCount$.value + 1);
        return monster.die().pipe(
          connect((animate$) => {
            const render$ = animate$.pipe(tap(() => tick()));
            const removeMonsterOffScreen$ = animate$.pipe(
              onEndAnimationRemoveMonster(() => {
                if (monster instanceof Poring) {
                  return porings;
                } else if (monster instanceof Fabre) {
                  return fabres;
                }
                return [];
              }, monster),
              takeLast(1)
            );
            const respawnPoring$ = removeMonsterOffScreen$.pipe(
              switchMap(() => {
                const respawnTime = Math.random() * 20000 + 5000;
                return timer(respawnTime);
              }),
              tap(() => {
                if (monster instanceof Poring) {
                  onRespawnMonster$.next(new Poring(canvas));
                } else if (monster instanceof Fabre) {
                  onRespawnMonster$.next(new Fabre(canvas));
                }
              })
            );
            return merge(
              render$,
              removeMonsterOffScreen$.pipe(ignoreElements()),
              respawnPoring$.pipe(ignoreElements())
            );
          })
        );
      })
    );
  });

thief.onDamageArea$
  .pipe(
    map((area) => {
      return [...fabres, ...porings].filter((monster) => {
        if (!monster.isDie) {
          // const { x: targetX, y: targetY,width,height } = monster;
          const collision = rectanglesIntersect(area, monster);
          return collision !== COLLISION_DIRECTION.NOTHING;
        }
        return false;
      });
    }),
    monstersRecievedDamageAndDie()
  )
  .subscribe();

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
