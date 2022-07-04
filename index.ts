import './style.css';

import {
  fromEvent,
  startWith,
  tap,
  switchMap,
  animationFrameScheduler,
  interval,
  share,
  filter,
  Subject,
  timer,
  from,
  AsyncSubject,
  exhaustMap,
  merge,
  pipe,
  OperatorFunction,
  defer,
  ignoreElements,
  EMPTY,
  BehaviorSubject,
} from 'rxjs';
import {
  connect,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  mergeMap,
  onErrorResumeNext,
  repeat,
  shareReplay,
  takeLast,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { Acidus } from './monsters/Acidus';
import { Poring } from './monsters/Poring';
import { Monster } from './monsters/Monster';
import { GeffenMonk } from './monsters/GeffenMonk';
import { Fabre } from './monsters/Fabre';

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
// const monk = new GeffenMonk(canvas);

const porings = Array.from({ length: 20 }, () => new Poring(canvas));
const fabres = Array.from({ length: 7 }, () => new Fabre(canvas));
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
  acidus.drawImage();

  ctx.textAlign = 'center';
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(
    `kill: ${killCount$.value}`,
    canvas.width - canvas.width * 0.1,
    canvas.height * 0.05
  );

  // monk.drawImage();
});

// monk.standing().subscribe(() => tick());

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

onCanvasMount$.pipe(switchMap(() => onLoadMonster$)).subscribe((monster) => {
  monster.randomSpawn();
});

onLoadMonster$
  .pipe(
    mergeMap((monster) =>
      monster.randomAction().pipe(takeUntil(monster.onDied$))
    )
  )
  .subscribe(() => tick());

// const keydown$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
//   tap((event) => event.preventDefault()),
//   share()
// );

// keydown$
//   .pipe(
//     mergeMap(() =>
//       from(porings).pipe(
//         mergeMap((poring) => {
//           return poring.forceDie().pipe(
//             tap(() => tick()),
//             removeMonster(porings, poring)
//           );
//         })
//       )
//     )
//   )
//   .subscribe();

// const keyup$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
//   tap((event) => event.preventDefault()),
//   share()
// );

// const onKeydown = (
//   key: 'ArrowRight' | 'ArrowLeft' | 'ArrowUp' | 'ArrowDown',
//   updater: () => void
// ) => {
//   return keydown$.pipe(
//     filter((event) => event.key === key),
//     exhaustMap(() => {
//       return interval(80, animationFrameScheduler).pipe(
//         tap(() => {
//           updater();
//           tick();
//         }),
//         takeUntil(keyup$)
//       );
//     }),
//     share()
//   );
// };

// const arrowRight$ = onKeydown('ArrowRight', () => acidus.moveRight());
// const arrowLeft$ = onKeydown('ArrowLeft', () => acidus.moveLeft());
// const arrowUp$ = onKeydown('ArrowUp', () => acidus.moveUp());
// const arrowDown$ = onKeydown('ArrowDown', () => acidus.moveDown());

// const acidusMove$ = merge(arrowRight$, arrowLeft$, arrowUp$, arrowDown$).pipe(
//   map(() => acidus),
//   share()
// );

const onAcidusAttack$ = defer(() => {
  canvas.style.cursor = 'none';
  const mousemove$ = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(share());
  const mousedown$ = fromEvent<MouseEvent>(canvas, 'mousedown').pipe(share());
  const nextAction$ = new BehaviorSubject<string>('move');

  const actions$ = merge(
    mousedown$.pipe(map(() => 'attack')),
    nextAction$
  ).pipe(distinctUntilChanged(), shareReplay(1));

  const onAnimiationAsAction$ = actions$.pipe(
    switchMap((action) => {
      if (action === 'attack') {
        return acidus.attack().pipe(
          tap(() => tick()),
          finalize(() => nextAction$.next('move'))
        );
      } else if (action === 'move') {
        return acidus.standing().pipe(tap(() => tick()));
      }
      return EMPTY;
    })
  );

  const onAttackEmitCurrentPosition$ = actions$.pipe(
    filter((action) => action === 'attack'),
    withLatestFrom(mousemove$),
    map(([action, event]) => event)
  );
  const onMoveAcidusToMouse$ = mousemove$.pipe(
    tap((event) => {
      acidus.x = event.x - acidus.width / 2;
      acidus.y = event.y - acidus.height / 2;
      tick();
    })
  );
  return merge(
    onMoveAcidusToMouse$.pipe(ignoreElements()),
    onAttackEmitCurrentPosition$,
    onAnimiationAsAction$.pipe(ignoreElements())
  );
}).pipe(share());

onAcidusAttack$
  .pipe(
    map((attackEvent) => {
      let { x: sourceX, y: sourceY } = attackEvent;
      sourceX = sourceX - acidus.width / 2;

      return [...fabres, ...porings].filter((monster) => {
        if (!monster.isDie) {
          const { x: targetX, y: targetY } = monster;
          const distance = Math.sqrt(
            (sourceX - targetX) ** 2 + (sourceY - targetY) ** 2
          );
          return distance <= 80;
        }
        return false;
      });
    }),
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
    })
  )
  .subscribe();
