import { CropImage, DrawDamage, Monster } from '../monsters/Monster';
import { loadDamageNumbersImage } from '../sprites/load-damage-numbers';

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

export const damageMapSprite: { [numberStr: string]: CropImage } = {
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

export const redDamageMapSprite: { [numberStr: string]: CropImage } = {
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

export function drawDamage(
  monster: Monster,
  config: { style: 'red' | 'white' } = { style: 'white' }
) {
  const { style } = config;
  const receivedDamages = monster.receivedDamages;
  const ctx = monster.ctx;
  let spriteMap = style === 'white' ? damageMapSprite : redDamageMapSprite;
  let image = style === 'white' ? loadDamageNumbersImage : redDamageNumberImage;

  for (const drawDamage of receivedDamages) {
    const { damage, location, scale } = drawDamage;
    let x = location.x;
    for (const num of `${damage}`) {
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
