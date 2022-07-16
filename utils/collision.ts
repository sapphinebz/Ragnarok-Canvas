import { Area, Monster } from '../monsters/Monster';

export const enum COLLISION_DIRECTION {
  NOTHING,
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
}

/**
 * @deprecated
 */
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

export function rectanglesIntersect(area: Area, monster: Monster) {
  const aLeftOfB = area.x + area.w < monster.x;
  const aRightOfB = area.x > monster.x + monster.width;
  const aAboveB = area.y > monster.y + monster.height;
  const aBelowB = area.y + area.h < monster.y;
  if (!(aLeftOfB || aRightOfB || aAboveB || aBelowB)) {
    return COLLISION_DIRECTION.RIGHT;
  }
  return COLLISION_DIRECTION.NOTHING;
}

export function isMouseHoverArea(event: MouseEvent, area: Area){
  if (
    event.x >= area.x &&
    event.y >= area.y &&
    event.x <=
      area.x +
      area.w &&
    event.y <=
      area.y +
      area.h
  ) {
    return true;
  }
  return false;
}
