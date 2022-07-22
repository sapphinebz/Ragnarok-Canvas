import { animationFrames, combineLatest } from "rxjs";
import { endWith, map, takeWhile, connect } from "rxjs/operators";

function animationDrop(option: { delay: number; x: number; y: number }) {
  return tween(option.delay).pipe(
    connect((t$) => {
      const x$ = t$.pipe(map((t) => t * option.x));
      const y$ = t$.pipe(
        map((t) => Math.sin(t * Math.PI * (3 / 2)) * -option.y)
      );
      return combineLatest({ x: x$, y: y$ });
    })
  );
}

function tween(duration: number) {
  return animationFrames().pipe(
    map((event) => event.elapsed / duration),
    takeWhile((t) => t < 1),
    endWith(1)
  );
}
