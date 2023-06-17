import { AsyncSubject } from "rxjs";
import { Monster, MoveLocation } from "../monsters/Monster";
import { wait } from "../cores/core";

export interface FieldItem {
  class: any;
  item: Item;
  location: MoveLocation;
}

export type DropItems = [any, number][];

export abstract class Item {
  usable = false;

  onCleanUp$ = new AsyncSubject<void>();

  get width() {
    return this.image.width;
  }

  get height() {
    return this.image.height;
  }

  get ctx() {
    return this.canvas.getContext("2d");
  }

  constructor(
    public canvas: HTMLCanvasElement,
    public image: HTMLImageElement
  ) {}

  abstract useWith(monster: Monster): void;

  addStatusEffect(
    monster: Monster,
    option: {
      statusEffect: string;
      timeout: number;
      onEffect: () => void;
      onTimeoutEffect: () => void;
    }
  ) {
    const { statusEffect, timeout, onEffect, onTimeoutEffect } = option;

    if (!monster.statusEffect.includes(statusEffect)) {
      onEffect();
      monster.statusEffect.push(statusEffect);
      wait(timeout).subscribe(() => {
        onTimeoutEffect();
        const index = monster.statusEffect.findIndex((e) => e === statusEffect);
        if (index > -1) {
          monster.statusEffect.splice(index, 1);
        }
      });
    }
  }

  cleanup() {
    this.onCleanUp$.next();
    this.onCleanUp$.complete();
  }
}
