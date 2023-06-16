import { Observable, concat } from "rxjs";
import { fromLoop } from "./from-loop";

export function fromTimer(deltaTime$: Observable<number>) {
  return function (
    duration: number,
    nextDuration?: number
  ): Observable<number> {
    const _nextDuration = nextDuration ?? 0;
    return new Observable<number>((subscriber) => {
      let _time = 0;
      if (_nextDuration === 0) {
        return deltaTime$.subscribe({
          next: (t) => {
            _time += t;
            if (_time >= duration) {
              subscriber.next(_time);
              subscriber.complete();
            }
          },
        });
      }
      const firstTimer$ = fromTimer(deltaTime$)(duration);
      const loop$ = fromLoop(deltaTime$)(_nextDuration);
      return concat(firstTimer$, loop$).subscribe({
        next: (value) => subscriber.next(value),
      });
    });
  };
}
