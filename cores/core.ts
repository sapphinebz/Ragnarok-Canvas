import {
  map,
  share,
  startWith,
  take,
  tap,
  throttle as rxThrottle,
  mergeWith,
  mergeAll,
  scan,
  takeWhile,
  endWith,
  distinctUntilChanged,
  switchMap,
  filter,
  exhaustMap,
  takeUntil,
  window as rxwindow,
  pairwise,
  withLatestFrom,
} from "rxjs/operators";
import { createDeltaTime } from "../utils/delta-time";
import {
  AsyncSubject,
  EMPTY,
  NEVER,
  Observable,
  ReplaySubject,
  Subject,
  Subscriber,
  combineLatest,
  connectable,
  defer,
  from,
  fromEvent,
  merge,
  using,
} from "rxjs";
import { WindowChange, windowResize } from "../utils/window-resize";
import { toCommonEvent } from "../utils/to-common-event";
import { fromKeyPress } from "../utils/from-key-press";
import { fromLoop } from "../utils/from-loop";
import { fromFrameIndexLoop } from "../utils/from-frame-index-loop";
import { fromTimer } from "../utils/from-timer";
import { loadImage } from "../utils/load-image";
import { visibilityChange } from "../utils/visibility-change";
import { ACTION, Monster } from "../monsters/Monster";

export const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
export const context = canvas.getContext("2d")!;

const _onBeforeRender = new Subject<void>();
export const onBeforeRender$ = _onBeforeRender.asObservable();

export const deltaTime$ = visibilityChange().pipe(
  switchMap((visibility) => {
    if (visibility) {
      return createDeltaTime();
    }
    return NEVER;
  }),
  tap(() => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    _onBeforeRender.next();
  }),
  share()
);

const _windowSize = new ReplaySubject<WindowChange>(1);
export const windowSize$ = _windowSize.asObservable();

const _requireLoadResources: Observable<any>[] = [windowSize$.pipe(take(1))];

const _onResourceInit = new AsyncSubject<void>();
export const onResourceInit$ = _onResourceInit.asObservable();

from(_requireLoadResources)
  .pipe(mergeAll())
  .subscribe({
    complete: () => {
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

export const onKeydown$ = fromEvent<KeyboardEvent>(window, "keydown").pipe(
  toCommonEvent()
);

export const onKeyup$ = fromEvent<KeyboardEvent>(window, "keyup").pipe(
  toCommonEvent()
);

export const loop = fromLoop(deltaTime$);
export const wait = fromTimer(deltaTime$);
export const onKeydownCode = (code: string) =>
  onKeydown$.pipe(filter((event) => event.code === code));
export const onKeyPress = fromKeyPress(onKeydown$, onKeyup$, deltaTime$);
export const onKeyDown = (code: string) =>
  onKeydown$.pipe(filter((event) => event.code === code));
export const loopFrameIndex = fromFrameIndexLoop(loop);
export const throttleTime = (duration: number) =>
  rxThrottle(() => loop(duration));

export const loadSprite = (tag: string, image: HTMLImageElement) => {
  _requireLoadResources.push(loadImage(image));
};

export const tween = (duration: number) =>
  deltaTime$.pipe(
    scan((elaspe, deltaTime) => deltaTime + elaspe, 0),
    map((elapse) => elapse / duration),
    takeWhile((ratio) => ratio <= 1),
    endWith(1),
    distinctUntilChanged()
  );

export function onSwitchingKey(key: string) {
  const ofKey = filter<KeyboardEvent>((event) => {
    return event.key === key;
  });
  const _keydown$ = onKeydown$.pipe(ofKey);
  const _keyup$ = onKeyup$.pipe(ofKey);
  return _keydown$.pipe(
    exhaustMap(() =>
      NEVER.pipe(startWith(key), takeUntil(_keyup$), endWith(`${key}_KeyUp`))
    )
  );
}

export function onKeyboardControl(player: Monster) {
  return using(
    () => {
      const cleanup$ = new AsyncSubject<void>();

      merge(onKeyDown("KeyX"), onKeyDown("KeyZ"))
        .pipe(takeUntil(cleanup$))
        .subscribe(() => {
          player.actionChange$.next(ACTION.ATTACK);
        });

      const actionMap = new Map([
        ["ArrowDown", ACTION.WALKING_DOWN],
        ["ArrowRight", ACTION.WALKING_RIGHT],
        ["ArrowLeft", ACTION.WALKING_LEFT],
        ["ArrowUp", ACTION.WALKING_UP],
        // Down + Right
        ["ArrowRightArrowDown", ACTION.WALKING_BOTTOM_RIGHT],
        ["ArrowDownArrowRight", ACTION.WALKING_BOTTOM_RIGHT],
        // Down + Left
        ["ArrowLeftArrowDown", ACTION.WALKING_BOTTOM_LEFT],
        ["ArrowDownArrowLeft", ACTION.WALKING_BOTTOM_LEFT],
        // Up + Right
        ["ArrowRightArrowUp", ACTION.WALKING_TOP_RIGHT],
        ["ArrowUpArrowRight", ACTION.WALKING_TOP_RIGHT],
        // Up + Left
        ["ArrowLeftArrowUp", ACTION.WALKING_TOP_LEFT],
        ["ArrowUpArrowLeft", ACTION.WALKING_TOP_LEFT],
      ]);

      const onRelease = combineLatest([
        onSwitchingKey("ArrowDown").pipe(startWith("_KeyUp")),
        onSwitchingKey("ArrowRight").pipe(startWith("_KeyUp")),
        onSwitchingKey("ArrowUp").pipe(startWith("_KeyUp")),
        onSwitchingKey("ArrowLeft").pipe(startWith("_KeyUp")),
      ]).pipe(
        filter((keys) => keys.every((key) => key.endsWith("_KeyUp"))),
        withLatestFrom(player.actionChange$),
        tap(([_, lastAction]) => {
          if (lastAction !== ACTION.ATTACK) {
            player.actionChange$.next(ACTION.STANDING);
          }
        })
      );

      merge(
        onSwitchingKey("ArrowDown"),
        onSwitchingKey("ArrowRight"),
        onSwitchingKey("ArrowUp"),
        onSwitchingKey("ArrowLeft")
      )
        .pipe(
          filter((key) => key !== "KeyUp"),
          rxwindow(onRelease),
          exhaustMap((event$) => {
            const keydowns: string[] = [];

            return event$.pipe(
              map((key) => {
                if (key.endsWith("_KeyUp")) {
                  const keyUp = key.replace("_KeyUp", "");
                  const index = keydowns.findIndex((key) => key === keyUp);
                  if (index > -1) {
                    keydowns.splice(index, 1);
                  }
                } else {
                  keydowns.push(key);
                }
                const keyRef = keydowns.slice(-2).join("");

                const action = actionMap.get(keyRef);
                if (action) {
                  return action;
                } else {
                  const keyRef = keydowns.slice(-1).join("");
                  const action = actionMap.get(keyRef);
                  return action;
                }
              })
            );
          })
        )
        .subscribe((action) => {
          if (action) {
            player.actionChange$.next(action);
          }
        });

      return {
        unsubscribe: () => {
          cleanup$.next();
          cleanup$.complete();
        },
      };
    },
    () => NEVER
  );
}
