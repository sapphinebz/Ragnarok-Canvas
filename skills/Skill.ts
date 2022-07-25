import { Subject } from "rxjs";
import { Monster } from "../monsters/Monster";
export type Skills = "DoubleAttack";

export abstract class Skill {
  onUse = new Subject<void>();
  abstract passive: boolean;
  abstract useWith(monster: Monster): void;
}
