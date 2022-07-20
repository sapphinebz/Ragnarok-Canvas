import { Area, Monster, MoveLocation } from '../monsters/Monster';

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

export function rectanglesIntersect(area1: Area, area2: Area) {
  const aLeftOfB = area1.x + area1.w < area2.x;
  const aRightOfB = area1.x > area2.x + area2.w;
  const aAboveB = area1.y > area2.y + area2.h;
  const aBelowB = area1.y + area1.h < area2.y;
  if (!(aLeftOfB || aRightOfB || aAboveB || aBelowB)) {
    return COLLISION_DIRECTION.RIGHT;
  }
  return COLLISION_DIRECTION.NOTHING;
}

export function isMouseHoverArea(event: MouseEvent, area: Area) {
  if (
    event.x >= area.x &&
    event.y >= area.y &&
    event.x <= area.x + area.w &&
    event.y <= area.y + area.h
  ) {
    return true;
  }
  return false;
}

export function distanceBetween(
  location1: MoveLocation,
  location2: MoveLocation
) {
  return Math.sqrt(
    (location1.x - location2.x) ** 2 + (location1.y - location2.y) ** 2
  );
}
