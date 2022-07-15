export const loadDamageNumbers = () => {
  const image = new Image();
  image.src =
    'data:image/png;base64,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';
  return image;
};