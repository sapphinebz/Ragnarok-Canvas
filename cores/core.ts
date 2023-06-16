import {
  map,
  share,
  startWith,
  take,
  tap,
  throttle as rxThrottle,
} from "rxjs/operators";
import { createDeltaTime } from "../utils/delta-time";
import {
  AsyncSubject,
  Observable,
  ReplaySubject,
  Subject,
  connectable,
  fromEvent,
} from "rxjs";
import { WindowChange, windowResize } from "../utils/window-resize";
import { toCommonEvent } from "../utils/to-common-event";
import { fromKeyPress } from "../utils/from-key-press";
import { fromLoop } from "../utils/from-loop";
import { fromFrameIndexLoop } from "../utils/from-frame-index-loop";
import { fromTimer } from "../utils/from-timer";

export const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
export const context = canvas.getContext("2d")!;

const _onBeforeRender = new Subject<void>();
export const onBeforeRender$ = _onBeforeRender.asObservable();

export const deltaTime$ = createDeltaTime().pipe(
  tap(() => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    _onBeforeRender.next();
  }),
  share()
);

const _windowSize = new ReplaySubject<WindowChange>(1);
export const windowSize$ = _windowSize.asObservable();

const _onResourceInit = new AsyncSubject<void>();
export const onResourceInit$ = _onResourceInit.asObservable();
windowSize$.pipe(take(1)).subscribe({
  next: () => {
    _onResourceInit.next();
    _onResourceInit.complete();
  },
});

connectable(
  windowResize().pipe(
    tap(() => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    })
  ),
  { resetOnDisconnect: false, connector: () => _windowSize }
).connect();

export const keydown$ = fromEvent<KeyboardEvent>(window, "keydown").pipe(
  toCommonEvent()
);

export const keyup$ = fromEvent<KeyboardEvent>(window, "keyup").pipe(
  toCommonEvent()
);

export const loop = fromLoop(deltaTime$);
export const wait = fromTimer(deltaTime$);
export const onKeyPress = fromKeyPress(keydown$, keyup$, deltaTime$);
export const loopFrameIndex = fromFrameIndexLoop(loop);
export const throttleTime = (duration: number) =>
  rxThrottle(() => loop(duration));
