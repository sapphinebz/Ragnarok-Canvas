import {
  defer,
  fromEvent,
  merge,
  ReplaySubject,
  startWith,
  switchAll,
  switchMap,
} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  onErrorResumeNext,
  share,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { Monster } from '../monsters/Monster';
import { comboResetWith } from '../utils/combo-reset-with';

export class KeyboardController {
  onCleanup$ = new ReplaySubject<void>(1);
  keydown$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    tap((event) => {
      event.preventDefault();
      event.stopPropagation();
    }),
    share()
  );

  keyup$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
    tap((event) => {
      event.preventDefault();
      event.stopPropagation();
    }),
    share()
  );

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(private canvas: HTMLCanvasElement, private monster: Monster) {}

  start(tick: () => void) {
    merge(this.movementAction(), this.attackAction())
      .pipe(switchAll(), takeUntil(this.onCleanup$))
      .subscribe(() => tick());
  }

  drawPlayer() {
    this.monster.drawImage();
    if (this.monster.drawEffect) {
      this.monster.drawEffect();
    }
  }

  cleanup() {
    this.onCleanup$.next();
    this.onCleanup$.complete();
  }

  private attackAction() {
    const attackKeyMap = {
      KeyX: this.monster
        .attack()
        .pipe(onErrorResumeNext(this.monster.standing())),
      KeyZ: this.monster
        .attack()
        .pipe(onErrorResumeNext(this.monster.standing())),
    };

    const attackKeys = Object.keys(attackKeyMap);

    return this.keydown$.pipe(
      map((event) => event.code),
      filter((keyboardCode) => {
        return attackKeys.indexOf(keyboardCode) !== -1;
      }),
      map((key) => attackKeyMap[key])
    );
  }

  private movementAction() {
    const movementKeyMap = {
      KeyUp: this.monster.standing(),
      ArrowLeft: this.monster.walkingLeft(),
      ArrowRight: this.monster.walkingRight(),
      ArrowUp: this.monster.walkingUp(),
      ArrowDown: this.monster.walkingDown(),
      ArrowTopRight: this.monster.walkingTopRight(),
      ArrowTopLeft: this.monster.walkingTopLeft(),
      ArrowBottomRight: this.monster.walkingBottomRight(),
      ArrowBottomLeft: this.monster.walkingBottomLeft(),
    };

    const movementKeys = Object.keys(movementKeyMap);
    const keyup$ = fromEvent<KeyboardEvent>(document, 'keyup').pipe(
      tap((event) => {
        event.preventDefault();
        event.stopPropagation();
      }),
      share()
    );

    const keyboardCode$ = this.keydown$.pipe(
      map((event) => event.code),
      filter((keyboardCode) => {
        return movementKeys.indexOf(keyboardCode) !== -1;
      }),
      distinctUntilChanged(),
      comboResetWith(keyup$),
      map((keys) => {
        if (keys.length === 1) {
          return keys[0];
        }
        if (
          keys.indexOf('ArrowRight') !== -1 &&
          keys.indexOf('ArrowUp') !== -1
        ) {
          return 'ArrowTopRight';
        } else if (
          keys.indexOf('ArrowRight') !== -1 &&
          keys.indexOf('ArrowDown') !== -1
        ) {
          return 'ArrowBottomRight';
        } else if (
          keys.indexOf('ArrowLeft') !== -1 &&
          keys.indexOf('ArrowUp') !== -1
        ) {
          return 'ArrowTopLeft';
        } else if (
          keys.indexOf('ArrowLeft') !== -1 &&
          keys.indexOf('ArrowDown') !== -1
        ) {
          return 'ArrowBottomLeft';
        }
        return 'KeyUp';
      })
    );
    const keyboardCodeCanceller$ = keyboardCode$
      .pipe(switchMap(() => keyup$.pipe(take(1))))
      .pipe(map(() => 'KeyUp'));

    return merge(keyboardCode$, keyboardCodeCanceller$).pipe(
      distinctUntilChanged(),
      startWith('KeyUp'),
      map((key) => movementKeyMap[key])
    );
  }
}
