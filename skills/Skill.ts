import { Monster } from "../monsters/Monster";
export type Skills = "DoubleAttack";

export abstract class Skill {
  abstract passive: boolean;
  abstract useWith(monster: Monster): void;
}
