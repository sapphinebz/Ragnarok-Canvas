import { fromEventPattern } from "rxjs";

export function visibilityChange() {
  const isVisible = () => {
    return document.visibilityState === "visible";
  };
  return fromEventPattern<boolean>(
    (handler) => {
      const abortController = new AbortController();

      handler(isVisible());
      document.addEventListener(
        "visibilitychange",
        () => {
          handler(isVisible());
        },
        {
          signal: abortController.signal,
        }
      );

      return abortController;
    },
    (handler, abortController: AbortController) => {
      abortController.abort();
    }
  );
}
