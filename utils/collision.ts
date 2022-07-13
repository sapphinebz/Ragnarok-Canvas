import { Area, Monster } from '../monsters/Monster';

export const enum COLLISION_DIRECTION {
  NOTHING,
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
}

export function collideWithArea(area: Area, monster: Monster) {
  if (
    area.x > monster.x &&
    area.x < monster.x + monster.width &&
    area.y + area.h > monster.y &&
    area.y < monster.y
  ) {
    return COLLISION_DIRECTION.TOP;
  } else if (
    area.x > monster.x &&
    area.x < monster.x + monster.width &&
    area.y < monster.y + monster.height &&
    area.y > monster.y
  ) {
    return COLLISION_DIRECTION.BOTTOM;
  } else if (
    Math.abs(monster.x - area.x) <= area.w / 2 &&
    area.y + area.h > monster.y &&
    area.y < monster.y + monster.height
  ) {
    return COLLISION_DIRECTION.LEFT;
  } else if (
    Math.abs(monster.x + monster.width - area.x) <= area.w / 2 &&
    area.y + area.h > monster.y &&
    area.y < monster.y + monster.height
  ) {
    return COLLISION_DIRECTION.RIGHT;
  }
  return COLLISION_DIRECTION.NOTHING;
}
