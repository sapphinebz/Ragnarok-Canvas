import { tap } from 'rxjs/operators';
import { CropImage, DIRECTION, DrawNumber, Monster } from '../monsters/Monster';
import { loadDamageNumbersImage } from '../sprites/load-damage-numbers';

type CropNumber = { [numberStr: string]: CropImage };

type NumberStyle = 'red' | 'white' | 'green';

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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAALCAYAAAA9ZhyRAAAAAXNSR0IArs4c6QAAAhZJREFUaEPNWctOxDAMTPcHFnFCIC78/zdxQaA9Ib5gu0paW46bPuyMRfeCslqmM+OJ8+iQ6s+oxoMaW4aE5cGI4EHcPXzWdPdozJhaJ4Ijyrs1br0cUfyIxyqeLPT4+VLX8ONWxtYwlIcRlgMDxaOEB6SpFW7GdmhscqOHOPHQehfenYzfrl4KbhHyfEnp6WeS8Pea0u89JaPRjENGzHhHJwiKRxGeNeSP1CTGRzk1g03YHXgLfuJBHm4RequuqPy0ckTWloO9lVkONzAIxRCnEdLMzE0XzGzoHBgEFi+DMtgB4bZqrHhdh5SG79Z8NK/AEqS3DhHNZncyc7jHt0kLGaPGVsPHzv8vZgAwuPAFsNZo1cRYGSf71InH+mSKZv893NB4Vbg7tU71fL9MGfu6l79qbNWs87Gox1nDDQ02FUZMXquRi2ADJstucZr9d/1LNF6lGeBd1bAIvGMyN/EkzzOGGxlsZOeOCI+8benVHcEPuYKG8eMiq5U5Ys/d2l8d7ZSIvV21nM4DxJ6buenmaTw0h/MDHqCR9djdI1tXKvH7Zn3RtyU8ibwHSn2wVYKPTpLWBPMeclthLN85NbJHoBuqKLyeJtXK6b/dlhQhwDth7x0w+m4VqUkXzKuxmixAz9E1rPCMV8JrTRhdj0083QmRb4+8b+/Qb+2QmhYBF9se46rKP0fzi8KzrJpbXkTxo2cyzwd4tHgb3Mm63AAAAABJRU5ErkJggg==';

export const greenRestoreNumberImage = new Image();
greenRestoreNumberImage.src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALcAAAALCAYAAAA9ZhyRAAAAAXNSR0IArs4c6QAAAhZJREFUaEPVWTFSxDAMTKrMQUFFdz/g/0/hB3RUFMCkIUxsy7EUexJJ6yFc55vJZrVay7IyDvy3iPUo1polYVkwevAg7hY+rbg9Ma6YMk4ER5R2LW5ejih+xKOJVyZ6mV4fWBLnl691rTVDeNn09hiw5vunFgPFI5gHFFPN3BnbqpPkRi8x4qHj3Wl3MX6H8ZJxYyBPI5kxmvNjGZRCZ5wshM7cKB4xcL7BPBtOmjtjGzdwlV/xEm1B6RUvq4qOgrUZ0e+xXLGPPLuZG2cET+UuxVy5SYNqk162DV6sTdSklXED73DS6eY+7oP5pp9hfv6unTRa7UoMhHboYnOIt5n7/RbbiCTMxNdaYRbn83Gn+ziw5IRWCYMXeK06OfFyfCXRpL9Wb6YXCI+b26+dzCdMv5Znr2puqLHJhMXmtZgnG6hTAeie7Fo5P/Fft1yg8iFjoAJxRXMjxcwtAKByoytP2CyJYGzBfNWxBz/kCdqNHyVZ6tej565dbs5WSkRvt2tH0sTHi80ukezo112au/OjHt55AfTksXYgHPbIJ06Rmnbrf9X7GXpakiulUdidACLgs5uklhjEtORfTw+U5sGbGzOR2zx2gNdjzh1FSTNz0yixkgUlDhegwDPi1CuRLUZWfcBzePRc35rH1j7qxo9eWOZXVkLk1yPr1zv0VztkTDJp1hhbxysdsYYimx9Bx4uI8U/i/QWPH+8bpk7+sgAAAABJRU5ErkJggg==';

const r_zero: CropImage = { offsetX: 1, offsetY: 0, width: 8, height: 11 };
const r_one: CropImage = { offsetX: 21, offsetY: 0, width: 5, height: 11 };
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
};

export function drawDamage(
  monster: Monster,
  config: { style: NumberStyle } = { style: 'white' }
) {
  const receivedDamages = monster.receivedDamages;
  drawNumber(monster, receivedDamages, config);
}

export function drawRestoreHp(monster: Monster) {
  const restoredHp = monster.restoredHp;
  drawNumber(monster, restoredHp, { style: 'green' });
}

export function drawNumber(
  monster: Monster,
  drawNumbers: DrawNumber[],
  config: { style: NumberStyle } = { style: 'white' }
) {
  const { style } = config;
  const ctx = monster.ctx;
  const theme = numberTheme[style];
  let image = theme[0];
  let spriteMap = theme[1];

  for (const drawDamage of drawNumbers) {
    const { number, location, scale } = drawDamage;
    let x = location.x;
    for (const num of `${number}`) {
      const sprite = spriteMap[num];
      ctx.drawImage(
        image,
        sprite.offsetX,
        sprite.offsetY,
        sprite.width,
        sprite.height,
        x,
        location.y,
        sprite.width * scale,
        sprite.height * scale
      );

      x += sprite.width * scale + 1;
    }
  }
}

export function animateRestoreHp(restore: number, monster: Monster) {
  const maxScale = 4;
  const minScale = 1.5;
  const dropYDistance = 80;
  let dropXDistance = 80;
  if (monster.direction === DIRECTION.RIGHT) {
    dropXDistance = -dropXDistance;
  }
  const maxLocationY = monster.y;
  // const startY = randomMinMax(maxLocationY - 20, maxLocationY + 20);
  const startY = maxLocationY - 20;
  const startX = monster.x;
  const drawNumber: DrawNumber = {
    number: restore,
    location: {
      x: startX,
      y: startY,
    },
    scale: maxScale,
  };
  monster.restoredHp.push(drawNumber);

  return monster.tween(
    800,
    tap({
      next: (t) => {
        drawNumber.scale = maxScale - t * (maxScale - minScale);
        drawNumber.location.y = startY + Math.sin(t * Math.PI) * -dropYDistance;

        drawNumber.location.x = startX + t * dropXDistance;
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

export function animateReceivedDamage(damage: number, monster: Monster) {
  const maxScale = 4;
  const minScale = 1.5;
  const dropYDistance = 80;
  let dropXDistance = 80;
  if (monster.direction === DIRECTION.RIGHT) {
    dropXDistance = -dropXDistance;
  }
  const maxLocationY = monster.y;
  // const startY = randomMinMax(maxLocationY - 20, maxLocationY + 20);
  const startY = maxLocationY - 20;
  const startX = monster.x;
  const drawNumber: DrawNumber = {
    number: damage,
    location: {
      x: startX,
      y: startY,
    },
    scale: maxScale,
  };
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
