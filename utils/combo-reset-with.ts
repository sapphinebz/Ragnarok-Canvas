import { Observable, OperatorFunction } from 'rxjs';

export function comboResetWith<T>(
  reset$: Observable<any>
): OperatorFunction<T, T[]> {
  return (source: Observable<T>) =>
    new Observable((subscriber) => {
      let combo: T[] = [];

      const cleanupSubscription = reset$.subscribe(() => {
        combo = [];
      });

      const bufferSubscription = source.subscribe({
        next: (value) => {
          combo.push(value);
          if (combo.length <= 2) {
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
