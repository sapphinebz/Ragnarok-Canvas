import { MonoTypeOperatorFunction, takeUntil, timer } from "rxjs";
import { Monster } from "../monsters/Monster";

export function randomMinMax(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomTimer(min: number, max: number) {
  return timer(randomMinMax(min, max));
}

export function randomEnd<T>(
  min: number,
  max: number
): MonoTypeOperatorFunction<T> {
  return takeUntil(randomTimer(min, max));
}
