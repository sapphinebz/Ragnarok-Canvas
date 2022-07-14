import { Observable } from 'rxjs';

export function playAudio(audio: HTMLAudioElement) {
  return new Observable((subscriber) => {
    audio.play();

    const playHandler = (event: Event) => {
      subscriber.next(event);
    };
    const endHandler = (event: Event) => {
      subscriber.complete();
    };
    audio.addEventListener('playing', playHandler);
    audio.addEventListener('ended', endHandler);

    subscriber.next();
    return () => {
      audio.removeEventListener('playing', playHandler);
      audio.removeEventListener('ended', endHandler);
      audio.pause();
      audio.currentTime = 0;
    };
  });
}
