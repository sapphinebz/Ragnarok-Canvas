import { Subject, merge, AsyncSubject } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";
import { Monster } from "../monsters/Monster";
import { playAudio } from "../utils/play-audio";
import { randomMinMax } from "../utils/random-minmax";

export class AudioSubject {
  private onPlayAudio$ = new Subject<void>();
  private onStopAudio$ = new Subject<void>();
  audio!: HTMLAudioElement;

  set volume(value: number) {
    this.audio.volume = value;
  }

  constructor(
    public monster: Monster,
    public audioOrAudios: HTMLAudioElement | HTMLAudioElement[]
  ) {
    if (Array.isArray(this.audioOrAudios)) {
      const index = randomMinMax(0, this.audioOrAudios.length - 1);
      this.audio = this.audioOrAudios[index];
    } else {
      this.audio = this.audioOrAudios;
    }
    this.audio.volume = 0.05;
    this.onPlayAudio$
      .pipe(
        switchMap(() =>
          playAudio(this.audio).pipe(takeUntil(this.onStopAudio$))
        ),
        takeUntil(this.monster.onCleanup$)
      )
      .subscribe();
  }

  play() {
    this.onPlayAudio$.next();
  }

  stop() {
    this.onStopAudio$.next();
  }
}
