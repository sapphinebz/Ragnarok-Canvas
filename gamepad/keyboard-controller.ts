import {
  defer,
  fromEvent,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
  ReplaySubject,
  startWith,
  Subject,
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
import { Monster, WalkingStoppable } from '../monsters/Monster';
import { onDocumentKeydown } from '../utils/on-document-keydown';

export class KeyboardController {
  onCleanup$ = new ReplaySubject<void>(1);
  keydown$ = onDocumentKeydown('keydown');
  keyup$ = onDocumentKeydown('keyup');
  onAttack$ = new Subject<void>();

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(private canvas: HTMLCanvasElement, private monster: Monster) {}

  start(tick: () => void) {
    merge(
      this.movementAction(),
      this.attackAction()
    )
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
      map((key) => {
        this.onAttack$.next();
        return attackKeyMap[key];
      })
    );
  }

  private movementAction() {
    const walkConfig: WalkingStoppable = {
      stopIfOutOfCanvas: false,
    };
    const movementKeyMap = {
      KeyUp: this.monster.standing(),
      ArrowLeft: this.monster.walkingLeft(walkConfig),
      ArrowRight: this.monster.walkingRight(walkConfig),
      ArrowUp: this.monster.walkingUp(walkConfig),
      ArrowDown: this.monster.walkingDown(walkConfig),
      ArrowTopRight: this.monster.walkingTopRight(walkConfig),
      ArrowTopLeft: this.monster.walkingTopLeft(walkConfig),
      ArrowBottomRight: this.monster.walkingBottomRight(walkConfig),
      ArrowBottomLeft: this.monster.walkingBottomLeft(walkConfig),
    };

    const movementKeys = Object.keys(movementKeyMap);

    const keyboardCode$ = this.keydown$.pipe(
      this.mapToKeyCode(),
      this.filterKeys(movementKeys),
      this.collectKeydown({
        distributeWith: this.keyup$.pipe(this.filterKeys(movementKeys)),
        resetWith: this.onAttack$,
      }),
      this.sliceLastestKeydown(2),
      this.mapKeysToActualKey()
    );

    return keyboardCode$.pipe(
      distinctUntilChanged(),
      startWith('KeyUp'),
      map((key) => movementKeyMap[key])
    );
  }

  private mapToKeyCode(): OperatorFunction<KeyboardEvent, string> {
    return map((event) => event.code);
  }

  private filterKeys<T extends string | KeyboardEvent>(
    keys: string[]
  ): MonoTypeOperatorFunction<T> {
    return filter((eventOrKeyboardCode) => {
      let keyboardCode: string;
      if (eventOrKeyboardCode instanceof KeyboardEvent) {
        keyboardCode = eventOrKeyboardCode.code;
      } else {
        keyboardCode = eventOrKeyboardCode;
      }
      return keys.indexOf(keyboardCode) !== -1;
    });
  }

  private mapKeysToActualKey(): OperatorFunction<string[], string> {
    return map((keys) => {
      if (keys.length === 0) {
        return 'KeyUp';
      } else if (keys.length === 1) {
        return keys[0];
      }
      if (keys.indexOf('ArrowRight') !== -1 && keys.indexOf('ArrowUp') !== -1) {
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
      return keys[keys.length - 1];
    });
  }

  private sliceLastestKeydown(
    length: number
  ): MonoTypeOperatorFunction<string[]> {
    return map((keys) => {
      if (keys.length > length) {
        return keys.slice(keys.length - length, keys.length);
      }
      return keys;
    });
  }

  private collectKeydown(option: {
    distributeWith: Observable<KeyboardEvent>;
    resetWith: Observable<any>;
  }): OperatorFunction<string, string[]> {
    const { distributeWith: keyup$, resetWith: reset$ } = option;
    return (source: Observable<string>) =>
      new Observable((subscriber) => {
        let collections: string[] = [];

        const distributeSubscription = keyup$.subscribe((event) => {
          const index = collections.findIndex((key) => key === event.code);
          if (index > -1) {
            collections.splice(index, 1);
            subscriber.next(collections);
          }
        });

        const cleanupSubscription = reset$.subscribe(() => {
          collections = [];
        });

        const bufferSubscription = source.subscribe({
          next: (value) => {
            if (collections[collections.length - 1] !== value) {
              collections.push(value);
            }
            subscriber.next(collections);
          },
          error: (err) => {
            subscriber.error(err);
          },
          complete: () => {
            subscriber.complete();
          },
        });

        return () => {
          cleanupSubscription.unsubscribe();
          bufferSubscription.unsubscribe();
          distributeSubscription.unsubscribe();
        };
      });
  }
}
