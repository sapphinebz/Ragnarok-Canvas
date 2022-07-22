import { Observable, Subscription } from "rxjs";
import { take } from "rxjs/operators";

export function repeatUntil<T>(endToggler$: Observable<any>) {
  return (source: Observable<T>) =>
    new Observable((subscriber) => {
      let subscription: Subscription;
      let endRepeat = false;
      const toggleSubscription = endToggler$.pipe(take(1)).subscribe(() => {
        endRepeat = true;
      });
      const doSubscribe = () => {
        subscription = source.subscribe({
          next: (value) => {
            subscriber.next(value);
          },
          error: (err) => {
            subscriber.next(err);
          },
          complete: () => {
            if (endRepeat) {
              subscriber.complete();
            } else {
              doSubscribe();
            }
          },
        });
      };
      doSubscribe();

      return {
        unsubscribe: () => {
          if (subscription) {
            subscription.unsubscribe();
          }
          toggleSubscription.unsubscribe();
        },
      };
    });
}
