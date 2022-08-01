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

export function randomLocationAroundTarget(target: Monster, monster: Monster) {
  const distance = monster.attackRange + monster.width / 2;
  monster.x = randomMinMax(target.x - distance, target.x + distance);
  monster.y = Math.sqrt(distance ** 2 - (monster.x - target.x) ** 2) + target.y;
}
