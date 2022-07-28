import { Subscription, takeUntil } from "rxjs";
import { Monster } from "../monsters/Monster";
import { loadCastingSpellAudio } from "../sounds/casting-spell";
import { tween } from "../utils/animation";
import { Skill } from "./Skill";

export abstract class CastingSkill extends Skill {
  castingTime = 0;
  castingAudio = loadCastingSpellAudio();
  castingSubscription?: Subscription;
  passive = false;
  constructor() {
    super();

    this.castingAudio.volume = 0.05;
  }

  casting(monster: Monster, onCompleteCast: () => void) {
    if (this.castingSubscription) {
      this.castingSubscription.unsubscribe();
    }

    this.castingAudio.play();

    this.castingSubscription = tween(this.castingTime)
      .pipe(takeUntil(monster.onDied$))
      .subscribe({
        next: (elapse) => {
          monster.drawCastingSpell("Heal", elapse);
          monster.onActionTick$.next();
        },
        complete: () => {
          onCompleteCast();
        },
      });
  }
}
