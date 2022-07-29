import { Observable } from "rxjs";

export function stopAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
}

export function audioIsPlay(audio: HTMLAudioElement) {
  return (
    audio.currentTime > 0 &&
    !audio.paused &&
    !audio.ended &&
    audio.readyState > audio.HAVE_CURRENT_DATA
  );
}

export function playAudio(audio: HTMLAudioElement) {
  return new Observable((subscriber) => {
    if (!audioIsPlay(audio)) {
      audio.play();
    }
    // audio.play();

    const playHandler = (event: Event) => {
      subscriber.next(event);
    };
    const endHandler = (event: Event) => {
      subscriber.complete();
    };
    audio.addEventListener("playing", playHandler);
    audio.addEventListener("ended", endHandler);

    subscriber.next();
    return () => {
      audio.removeEventListener("playing", playHandler);
      audio.removeEventListener("ended", endHandler);
      if (audioIsPlay(audio)) {
        stopAudio(audio);
      }
    };
  });
}
