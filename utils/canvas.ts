import { fromEvent, NEVER, Observable } from "rxjs";
import { map, distinctUntilChanged, switchMap } from "rxjs/operators";
import { Area, Monster } from "../monsters/Monster";
import { isMouseHoverArea } from "./collision";

export function canvasHover(canvas: HTMLCanvasElement, area: Area) {
  return fromEvent<MouseEvent>(canvas, "mousemove").pipe(
    map((event) => {
      return isMouseHoverArea(event, {
        x: area.x,
        y: area.y,
        w: area.w,
        h: area.h,
      });
    }),
    distinctUntilChanged()
  );
}

export function onClickCanvasArea(canvas: HTMLCanvasElement) {
  return (isHover$: Observable<boolean>) =>
    isHover$.pipe(
      switchMap((isHover) => {
        if (isHover) {
          return fromEvent(canvas, "click");
        }
        return NEVER;
      })
    );
}

export function zIndexMonsters(monsters: Monster[]) {
  return monsters.sort(
    (monsterA, monsterB) =>
      monsterA.y + monsterA.height - (monsterB.y + monsterB.height)
  );
}
