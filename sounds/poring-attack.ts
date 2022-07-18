export const loadPoringAttackAudio = () =>
  new Audio(
    'data:audio/mp4;base64,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'
  );