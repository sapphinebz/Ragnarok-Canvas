import { Subject } from "rxjs";
import { Monster } from "../monsters/Monster";
export type Skills = "DoubleAttack";

export abstract class Skill {
  onUse = new Subject<void>();
  abstract passive: boolean;

  level = 1;

  constructor() {}

  abstract useWith(monster: Monster, toMonster?: Monster): void;
}
