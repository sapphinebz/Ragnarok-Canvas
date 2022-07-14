import { defer, fromEvent, merge, startWith, switchAll, switchMap } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  onErrorResumeNext,
  share,
  take,
  tap,
} from 'rxjs/operators';
import { Monster } from '../monsters/Monster';

export class KeyboardController {
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
    merge(this.movementAction(), this.attactAction())
      .pipe(switchAll())
      .subscribe(() => tick());
  }

  drawPlayer() {
    this.monster.drawImage();
    if (this.monster.drawEffect) {
      this.monster.drawEffect();
    }
  }

  private attactAction() {
    const attackKeyMap = {
      KeyX: defer(() => {
        // this.monster.direction = 'right';
        return this.monster
          .attack()
          .pipe(onErrorResumeNext(this.monster.standing()));
      }),
      KeyZ: defer(() => {
        // this.monster.direction = 'left';
        return this.monster
          .attack()
          .pipe(onErrorResumeNext(this.monster.standing()));
      }),
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
