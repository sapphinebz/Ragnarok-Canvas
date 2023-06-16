import { fromEventPattern } from "rxjs";

export function createDeltaTime() {
  return fromEventPattern<number>(
    (handler) => {
      let prev = 0;
      let animationIndex: number;
      const callback = (elapse: number) => {
        if (prev) {
          handler(elapse - prev);
        }
        prev = elapse;
        animationIndex = requestAnimationFrame(callback);
      };

      animationIndex = requestAnimationFrame(callback);
      return () => cancelAnimationFrame(animationIndex);
    },
    (handler, cleanup) => cleanup()
  );
}
