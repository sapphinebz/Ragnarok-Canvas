import { Observable } from "rxjs";
import { exhaustMap, filter, takeUntil } from "rxjs/operators";

export function fromKeyPress(
  keydown$: Observable<KeyboardEvent>,
  keyup$: Observable<KeyboardEvent>,
  deltaTime$: Observable<number>
) {
  return (key: string) => {
    const _keydown$ = keydown$.pipe(
      filter((event) => {
        console.log(event);
        return event.key === key;
      })
    );
    const _keyup$ = keyup$.pipe(filter((event) => event.key === key));
    return _keydown$.pipe(
      exhaustMap(() => deltaTime$.pipe(takeUntil(_keyup$)))
    );
  };
}
