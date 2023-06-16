import { Observable } from "rxjs";

export function fromLoop(deltaTime$: Observable<number>) {
  return (period: number) =>
    new Observable<number>((subscriber) => {
      let _time = 0;
      return deltaTime$.subscribe((t) => {
        _time += t;
        if (_time >= period) {
          subscriber.next(period);
          _time = _time - period;
        }
      });
    });
}
