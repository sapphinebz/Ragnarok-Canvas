import { Observable } from "rxjs";

export function loadImage(image: HTMLImageElement | null) {
  return new Observable<HTMLImageElement>((subscriber) => {
    if (image) {
      if (image.complete) {
        subscriber.next(image);
        subscriber.complete();
        return;
      }
      const abortController = new AbortController();

      image.addEventListener(
        "load",
        (event: Event) => {
          subscriber.next(image);
          subscriber.complete();
        },
        { once: true, signal: abortController.signal }
      );
      image.addEventListener(
        "error",
        (event: Event) => {
          subscriber.error(event);
        },
        { once: true, signal: abortController.signal }
      );

      return {
        unsubscribe: () => {
          abortController.abort();
        },
      };
    } else {
      subscriber.complete();
    }
  });
}
