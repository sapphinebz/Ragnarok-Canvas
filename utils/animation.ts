import { animationFrames } from "rxjs";
import { endWith, map, pairwise, takeWhile } from "rxjs/operators";

export function tween(duration: number) {
  return animationFrames().pipe(
    map((event) => event.elapsed / duration),
    takeWhile((t) => t < 1),
    endWith(1)
  );
}

/**
 * delta Time in millisecond
 * @returns delta time
 */
export function deltaTime() {
  return animationFrames().pipe(
    pairwise(),
    map(([prev, curr]) => (curr.elapsed - prev.elapsed) / 1000)
  );
}
