import { Observable, OperatorFunction } from 'rxjs';

export function comboResetWith<T>(
  reset$: Observable<any>
): OperatorFunction<T, T[]> {
  return (source: Observable<T>) =>
    new Observable((subscriber) => {
      let combo: T[] = [];

      const cleanupSubscription = reset$.subscribe((event) => {
        const index = combo.findIndex((key) => key === event.code);
        if (index >= -1) {
          combo.splice(index, 1);
          subscriber.next(combo);
        }
      });

      const bufferSubscription = source.subscribe({
        next: (value) => {
          if (combo.length === 0 || combo[combo.length - 1] !== value) {
            combo.push(value);
          }
          if (combo.length <= 2) {
            subscriber.next(combo);
          } else {
            combo = [combo[1], combo[2]];
            subscriber.next(combo);
          }
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
      };
    });
}
