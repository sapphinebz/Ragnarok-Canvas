import { CropImage } from "../monsters/Monster";


const zero:CropImage = { offsetX: 9, offsetY: 10, width: 8, height: 11 };
const one:CropImage = { offsetX: 27, offsetY: 10, width: 6, height: 11 };
const two:CropImage = { offsetX: 43, offsetY: 10, width: 8, height: 11 };
const three:CropImage = { offsetX: 62, offsetY: 10, width: 8, height: 11 };
const four:CropImage = { offsetX: 82, offsetY: 10, width: 8, height: 11 };
const five:CropImage = { offsetX: 102, offsetY: 10, width: 8, height: 11 };
const six: CropImage= { offsetX: 122, offsetY: 10, width: 8, height: 11 };
const seven:CropImage = { offsetX: 142, offsetY: 10, width: 8, height: 11 };
const eight:CropImage = { offsetX: 162, offsetY: 10, width: 8, height: 11 };
const nine:CropImage = { offsetX: 182, offsetY: 10, width: 8, height: 11 };

export const damageMapSprite:{[numberStr:string]: CropImage} = {
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

