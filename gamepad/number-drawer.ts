import { concat } from "rxjs";
import { tap } from "rxjs/operators";
import {
  CropImage,
  DamageNumber,
  DIRECTION,
  DrawNumber,
  Monster,
} from "../monsters/Monster";
import { loadDamageNumbersImage } from "../sprites/load-damage-numbers";

type CropNumber = { [numberStr: string]: CropImage };

type DrawNumberConfig = { style: NumberStyle };
type NumberStyle = "red" | "white" | "green" | "yellow";

const zero: CropImage = { offsetX: 9, offsetY: 10, width: 8, height: 11 };
const one: CropImage = { offsetX: 27, offsetY: 10, width: 6, height: 11 };
const two: CropImage = { offsetX: 43, offsetY: 10, width: 8, height: 11 };
const three: CropImage = { offsetX: 62, offsetY: 10, width: 8, height: 11 };
const four: CropImage = { offsetX: 82, offsetY: 10, width: 8, height: 11 };
const five: CropImage = { offsetX: 102, offsetY: 10, width: 8, height: 11 };
const six: CropImage = { offsetX: 122, offsetY: 10, width: 8, height: 11 };
const seven: CropImage = { offsetX: 142, offsetY: 10, width: 8, height: 11 };
const eight: CropImage = { offsetX: 162, offsetY: 10, width: 8, height: 11 };
const nine: CropImage = { offsetX: 182, offsetY: 10, width: 8, height: 11 };

export const damageMapSprite: CropNumber = {
  0: zero,
  1: one,
  2: two,
  3: three,
  4: four,
  5: five,
  6: six,
  7: seven,
  8: eight,
  9: nine,
};

export const redDamageNumberImage = new Image();
redDamageNumberImage.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAALCAYAAAA9ZhyRAAAAAXNSR0IArs4c6QAAAhZJREFUaEPNWctOxDAMTPcHFnFCIC78/zdxQaA9Ib5gu0paW46bPuyMRfeCslqmM+OJ8+iQ6s+oxoMaW4aE5cGI4EHcPXzWdPdozJhaJ4Ijyrs1br0cUfyIxyqeLPT4+VLX8ONWxtYwlIcRlgMDxaOEB6SpFW7GdmhscqOHOPHQehfenYzfrl4KbhHyfEnp6WeS8Pea0u89JaPRjENGzHhHJwiKRxGeNeSP1CTGRzk1g03YHXgLfuJBHm4RequuqPy0ckTWloO9lVkONzAIxRCnEdLMzE0XzGzoHBgEFi+DMtgB4bZqrHhdh5SG79Z8NK/AEqS3DhHNZncyc7jHt0kLGaPGVsPHzv8vZgAwuPAFsNZo1cRYGSf71InH+mSKZv893NB4Vbg7tU71fL9MGfu6l79qbNWs87Gox1nDDQ02FUZMXquRi2ADJstucZr9d/1LNF6lGeBd1bAIvGMyN/EkzzOGGxlsZOeOCI+8benVHcEPuYKG8eMiq5U5Ys/d2l8d7ZSIvV21nM4DxJ6buenmaTw0h/MDHqCR9djdI1tXKvH7Zn3RtyU8ibwHSn2wVYKPTpLWBPMeclthLN85NbJHoBuqKLyeJtXK6b/dlhQhwDth7x0w+m4VqUkXzKuxmixAz9E1rPCMV8JrTRhdj0083QmRb4+8b+/Qb+2QmhYBF9se46rKP0fzi8KzrJpbXkTxo2cyzwd4tHgb3Mm63AAAAABJRU5ErkJggg==";

export const yellowNumberImage = new Image();
yellowNumberImage.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAALCAYAAAA9ZhyRAAAAAXNSR0IArs4c6QAAAi5JREFUaEPNWcFSxCAMpePeO3rXb/Kwn+nBb9K7Tj2rdciWGAK0EB4z7a27w+MleSQhnVz8rOp9Uu8trwHLgjGCR+Bu4VOyu8dGj6ntRHBE+a7ErZcjil/gUcSTgV4/3p6jID48vfr3VjHQZgHLgIHiQeIB2ZQTN2MbbMxyC5sY8dD2Jr47Gb9De4NwyZB5vri7+YVs+Fmublm+XaOjCef+8cJimCbCqz0gvH5b59b16j7fm3mw4Z6LxCIybZyywva8OIXZ8NaAEfiJjWr9JbkleD6G/tliasKUG3TioTTGGftIsyxuRZzEbXQMZW4VuFrHyhLj1+iA1eLokoXAYkwp7I7DUhJ3q40Jr8xhaUkw2cPcoQfmB9QYSewIj8Wts4hRnCVHWwLWK+woq3UcOB1s4uUFhPKR3KCjqrC/QHh7VQERT5j/SpX5rOKGChvQQkSHFtTmJJkbdVhA/JCJCl31iniykp5R3EhhR+3JCcUjpy29dqMPC1rcw/j9E7210qH6jei5bx3AduFqLLPWdbk+kXhsfyB6bu7x9GaACxuUnxwKGO9NaGFX9cilIBZ+T+5n+l6AnpaULg+1PdreBKH1UpSdvMiT3ehMeVhoaeclK5ke+ITw+2WebqCnET1JKudaNL9DvBFzbnKKcc6Nnq2eec4d+SmooXH0qkWEttcax2IlBX932LVXZ1Tk1yPr1zv0VzukTYmYRNtjKAS0BM1vFF5t9T3ywyh+YV/m+QeI5vYbUvll0AAAAABJRU5ErkJggg==";

export const greenRestoreNumberImage = new Image();
greenRestoreNumberImage.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAALCAYAAAA9ZhyRAAAAAXNSR0IArs4c6QAAAhZJREFUaEPVWTFSxDAMTKrMQUFFdz/g/0/hB3RUFMCkIUxsy7EUexJJ6yFc55vJZrVay7IyDvy3iPUo1polYVkwevAg7hY+rbg9Ma6YMk4ER5R2LW5ejih+xKOJVyZ6mV4fWBLnl691rTVDeNn09hiw5vunFgPFI5gHFFPN3BnbqpPkRi8x4qHj3Wl3MX6H8ZJxYyBPI5kxmvNjGZRCZ5wshM7cKB4xcL7BPBtOmjtjGzdwlV/xEm1B6RUvq4qOgrUZ0e+xXLGPPLuZG2cET+UuxVy5SYNqk162DV6sTdSklXED73DS6eY+7oP5pp9hfv6unTRa7UoMhHboYnOIt5n7/RbbiCTMxNdaYRbn83Gn+ziw5IRWCYMXeK06OfFyfCXRpL9Wb6YXCI+b26+dzCdMv5Znr2puqLHJhMXmtZgnG6hTAeie7Fo5P/Fft1yg8iFjoAJxRXMjxcwtAKByoytP2CyJYGzBfNWxBz/kCdqNHyVZ6tej565dbs5WSkRvt2tH0sTHi80ukezo112au/OjHt55AfTksXYgHPbIJ06Rmnbrf9X7GXpakiulUdidACLgs5uklhjEtORfTw+U5sGbGzOR2zx2gNdjzh1FSTNz0yixkgUlDhegwDPi1CuRLUZWfcBzePRc35rH1j7qxo9eWOZXVkLk1yPr1zv0VztkTDJp1hhbxysdsYYimx9Bx4uI8U/i/QWPH+8bpk7+sgAAAABJRU5ErkJggg==";

const r_zero: CropImage = { offsetX: 1, offsetY: 0, width: 8, height: 11 };
const r_one: CropImage = { offsetX: 19, offsetY: 0, width: 7, height: 11 };
const r_two: CropImage = { offsetX: 35, offsetY: 0, width: 8, height: 11 };
const r_three: CropImage = { offsetX: 54, offsetY: 0, width: 8, height: 11 };
const r_four: CropImage = { offsetX: 74, offsetY: 0, width: 8, height: 11 };
const r_five: CropImage = { offsetX: 94, offsetY: 0, width: 8, height: 11 };
const r_six: CropImage = { offsetX: 114, offsetY: 0, width: 8, height: 11 };
const r_seven: CropImage = { offsetX: 134, offsetY: 0, width: 8, height: 11 };
const r_eight: CropImage = { offsetX: 154, offsetY: 0, width: 8, height: 11 };
const r_nine: CropImage = { offsetX: 174, offsetY: 0, width: 8, height: 11 };

export const redDamageMapSprite: CropNumber = {
  0: r_zero,
  1: r_one,
  2: r_two,
  3: r_three,
  4: r_four,
  5: r_five,
  6: r_six,
  7: r_seven,
  8: r_eight,
  9: r_nine,
};

const numberTheme: {
  [style: string]: [HTMLImageElement, CropNumber];
} = {
  red: [redDamageNumberImage, redDamageMapSprite],
  white: [loadDamageNumbersImage, damageMapSprite],
  green: [greenRestoreNumberImage, redDamageMapSprite],
  yellow: [yellowNumberImage, redDamageMapSprite],
};

const criticalCrop = { offsetX: 9, offsetY: 29, width: 68, height: 57 };

const missCrop = { offsetX: 37, offsetY: 118, width: 49, height: 16 };

export function drawDamage(
  monster: Monster,
  config: DrawNumberConfig = { style: "white" }
) {
  const receivedDamages = monster.receivedDamages;
  drawNumber(monster, receivedDamages, config);

  if (monster.comboDamages.length > 0) {
    drawNumber(monster, monster.comboDamages, { style: "yellow" });
  }
}

export function drawRestoreHp(monster: Monster) {
  const restoredHp = monster.restoredHp;
  drawNumber(monster, restoredHp, { style: "green" });
}

export function drawNumber(
  monster: Monster,
  drawNumbers: DrawNumber[],
  config: { style: NumberStyle } = { style: "white" }
) {
  const { style } = config;
  const ctx = monster.ctx;

  for (const drawDamage of drawNumbers) {
    const { isCritical, isMiss } = drawDamage;

    if (isMiss === true) {
      drawMissImage(ctx, drawDamage);
    } else {
      if (isCritical) {
        drawCriticalBackgroundImage(ctx, drawDamage);
      }
      drawNumberImage(ctx, drawDamage, style);
    }
  }
}

function drawMissImage(ctx: CanvasRenderingContext2D, drawDamage: DrawNumber) {
  const { location, scale } = drawDamage;
  const x = location.x;
  const standardTheme = numberTheme["white"];
  const standardImage = standardTheme[0];

  ctx.drawImage(
    standardImage,
    missCrop.offsetX,
    missCrop.offsetY ?? 0,
    missCrop.width,
    missCrop.height ?? 0,
    x,
    location.y,
    missCrop.width * scale,
    (missCrop.height ?? 0) * scale
  );
}

function drawNumberImage(
  ctx: CanvasRenderingContext2D,
  drawDamage: DrawNumber,
  style: NumberStyle
) {
  const { number, location, scale, isCritical } = drawDamage;

  let x = location.x;
  const criticalTheme = numberTheme["yellow"];
  const criticalImage = criticalTheme[0];
  const criticalSpriteMap = criticalTheme[1];

  const defaultTheme = numberTheme[style];
  const defaultImage = defaultTheme[0];
  const defaultSpriteMap = defaultTheme[1];

  for (const num of `${number}`) {
    const sprite = isCritical ? criticalSpriteMap[num] : defaultSpriteMap[num];
    const image = isCritical ? criticalImage : defaultImage;

    ctx.drawImage(
      image,
      sprite.offsetX,
      sprite.offsetY ?? 0,
      sprite.width,
      sprite.height ?? 0,
      x,
      location.y,
      sprite.width * scale,
      (sprite.height ?? 0) * scale
    );

    x += sprite.width * scale + 1;
  }
}

function drawCriticalBackgroundImage(
  ctx: CanvasRenderingContext2D,
  drawDamage: DrawNumber
) {
  const { location, scale } = drawDamage;
  const x = location.x;
  const width = (criticalCrop.width * scale) / 2;
  const height = (criticalCrop.height * scale) / 2;
  ctx.drawImage(
    loadDamageNumbersImage,
    criticalCrop.offsetX,
    criticalCrop.offsetY,
    criticalCrop.width,
    criticalCrop.height,
    x - width / 3.5,
    location.y - height / 3.5,
    width,
    height
  );
}

export function animateComboDamage(damage: number, monster: Monster) {
  const maxScale = 3.5;
  const minScale = 2;

  const startY = monster.y - 55;
  const startX = monster.x;
  const drawNumber: DrawNumber = {
    number: damage,
    isCritical: false,
    location: {
      x: startX,
      y: startY,
    },
    scale: minScale,
  };

  const remove = () => {
    const index = monster.comboDamages.findIndex((d) => d === drawNumber);
    if (index > -1) {
      monster.comboDamages.splice(index, 1);
    }
  };

  // push data for rendering
  // look at rendering function "drawRestoreHp"
  monster.comboDamages.push(drawNumber);
  const scale = monster.tween(
    200,
    tap({
      next: (t) => {
        drawNumber.scale = minScale + (maxScale - minScale) * t;
        drawNumber.location.y = startY;
      },
      unsubscribe: () => {
        remove();
      },
    })
  );

  const location = monster.tween(
    1500,
    tap({
      next: (t) => {
        drawNumber.location.y = startY - t * 80;
      },
      unsubscribe: () => {
        remove();
      },
      complete: () => {
        remove();
      },
    })
  );
  return concat(scale, location);
}

export function animateRestoreHp(restore: number, monster: Monster) {
  const maxScale = 2.5;

  const startY = monster.y + monster.height / 2;
  const startX = monster.x;
  const drawNumber: DrawNumber = {
    number: restore,
    isCritical: false,
    location: {
      x: startX,
      y: startY,
    },
    scale: maxScale,
  };

  // push data for rendering
  // look at rendering function "drawRestoreHp"
  monster.restoredHp.push(drawNumber);

  return monster.tween(
    1000,
    tap({
      next: (t) => {
        drawNumber.scale = maxScale;
        drawNumber.location.y = startY - t * 130;
      },
      complete: () => {
        const index = monster.restoredHp.findIndex((d) => d === drawNumber);
        if (index > -1) {
          monster.restoredHp.splice(index, 1);
        }
      },
    })
  );
}

export function animateMissDamage(monster: Monster) {
  const maxScale = 0.6;

  const startY = monster.y + monster.height / 2;
  const startX = monster.x;
  const targetY = 130;
  const drawNumber: DrawNumber = {
    number: 0,
    isCritical: false,
    location: {
      x: startX,
      y: startY,
    },
    scale: maxScale,
    isMiss: true,
  };

  // push data for rendering
  // look at rendering function "drawDamage"
  monster.receivedDamages.push(drawNumber);

  return monster.tween(
    1000,
    tap({
      next: (t) => {
        drawNumber.scale = maxScale;
        drawNumber.location.y = startY - t * targetY;
      },
      complete: () => {
        const index = monster.receivedDamages.findIndex(
          (d) => d === drawNumber
        );
        if (index > -1) {
          monster.receivedDamages.splice(index, 1);
        }
      },
    })
  );
}

export function animateReceivedDamage(damage: DamageNumber, monster: Monster) {
  const maxScale = 4;
  const minScale = 1.5;
  const dropYDistance = 80;
  let dropXDistance = 80;
  if (monster.direction === DIRECTION.RIGHT) {
    dropXDistance = -dropXDistance;
  }
  const startY = monster.y - 10;
  const startX = monster.x;
  const drawNumber: DrawNumber = {
    isCritical: damage.isCritical,
    number: damage.number,
    location: {
      x: startX,
      y: startY,
    },
    scale: maxScale,
  };

  // push data for rendering
  // look at rendering function "drawDamage"
  monster.receivedDamages.push(drawNumber);

  return monster.tween(
    800,
    tap({
      next: (t) => {
        drawNumber.scale = maxScale - t * (maxScale - minScale);
        drawNumber.location.y = startY + Math.sin(t * Math.PI) * -dropYDistance;

        drawNumber.location.x = startX + t * dropXDistance;
      },
      complete: () => {
        const index = monster.receivedDamages.findIndex(
          (d) => d === drawNumber
        );
        if (index > -1) {
          monster.receivedDamages.splice(index, 1);
        }
      },
    })
  );
}
