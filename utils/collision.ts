import { Area, MoveLocation, TargetLocation } from "../monsters/Monster";

export function rectanglesIntersect(area1: Area, area2: Area) {
  const aLeftOfB = area1.x + area1.w < area2.x;
  const aRightOfB = area1.x > area2.x + area2.w;
  const aAboveB = area1.y > area2.y + area2.h;
  const aBelowB = area1.y + area1.h < area2.y;
  if (!(aLeftOfB || aRightOfB || aAboveB || aBelowB)) {
    return true;
  }
  return false;
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

export function distanceBetweenTarget(
  source: TargetLocation,
  target: TargetLocation
) {
  const targetX = target.x + target.width / 2;
  const targetY = target.y + target.height / 2;

  const sourceX = source.x + source.width / 2;
  const sourceY = source.y + source.height / 2;

  const distance = distanceBetween(
    { x: targetX, y: targetY },
    { x: sourceX, y: sourceY }
  );

  return { distance, targetX, targetY, sourceX, sourceY };
}
