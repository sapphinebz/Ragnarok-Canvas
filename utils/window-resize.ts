import { fromEventPattern } from "rxjs";
export interface WindowChange {
  width: number;
  height: number;
}
export function windowResize() {
  return fromEventPattern<WindowChange>(
    (handler) => {
      const controller = new AbortController();
      handler();
      window.addEventListener("resize", handler, { signal: controller.signal });
      return controller;
    },
    (_, controller: AbortController) => {
      controller.abort();
    },
    () => ({ width: window.innerWidth, height: window.innerHeight })
  );
}
