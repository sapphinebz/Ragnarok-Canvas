import { Observable } from "rxjs";

export function fromFrameIndexLoop(
  loop: (period: number) => Observable<number>
) {
  return (options: {
    minIndex?: number;
    maxIndex: number;
    delay: number;
    once?: boolean;
  }) =>
    new Observable<number>((subscriber) => {
      const _minIndex = options.minIndex ?? 0;
      const _once = options.once ?? false;
      let frameIndex = _minIndex;
      subscriber.next(frameIndex);
      return loop(options.delay).subscribe({
        next: () => {
          if (frameIndex + 1 > options.maxIndex) {
            if (_once) {
              subscriber.complete();
            }
            frameIndex = _minIndex - 1;
          }
          frameIndex++;
          subscriber.next(frameIndex);
        },
      });
    });
}
