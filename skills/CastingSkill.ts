import { Subscription, takeUntil } from "rxjs";
import { Monster } from "../monsters/Monster";
import { loadCastingSpellAudio } from "../sounds/casting-spell";
import { Skill } from "./Skill";
import { tween } from "../cores/core";

export abstract class CastingSkill extends Skill {
  castingTime = 0;
  passive = false;
  private castingSubscription?: Subscription;
  private castingAudio = loadCastingSpellAudio();
  constructor() {
    super();

    this.castingAudio.volume = 0.05;
  }

  casting(spellName: string, monster: Monster, onCompleteCast: () => void) {
    if (this.castingSubscription) {
      this.castingSubscription.unsubscribe();
    }

    this.castingAudio.play();

    this.castingSubscription = tween(this.castingTime)
      .pipe(takeUntil(monster.onDied$))
      .subscribe({
        next: (elapse) => {
          monster.onActionTick$.next();
          monster.drawCastingSpell(spellName, elapse);
        },
        complete: () => {
          onCompleteCast();
        },
      });
  }
}
