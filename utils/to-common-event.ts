import { MonoTypeOperatorFunction, pipe } from "rxjs";
import { share, tap } from "rxjs/operators";

export function toCommonEvent<T extends Event>(): MonoTypeOperatorFunction<T> {
  return pipe(
    tap((event) => {
      event.preventDefault();
    }),
    share()
  );
}
