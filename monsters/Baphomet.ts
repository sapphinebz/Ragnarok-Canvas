import { defer, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { EvilHorn } from "../items/EvilHorn";
import { WhiteHerb } from "../items/WhiteHerb";
import { YggdrasilBerry } from "../items/YggdrasilBerry";
import { ComeOn } from "../skills/ComeOn";
import { Heal } from "../skills/Heal";
import { HealAll } from "../skills/HealAll";
import { AudioSubject } from "../sounds/audio-subject";
import { loadBaphometAttackAudio } from "../sounds/baphomet-attack";
import { loadBaphometBreath } from "../sounds/baphomet-breath";
import { loadBaphometDamagedAudio } from "../sounds/baphomet-damaged";
import { loadBaphometDeadAudio } from "../sounds/baphomet-dead";
import { baphometSpriteLeft } from "../sprites/baphomet-sprite-left";
import { baphometSpriteRight } from "../sprites/baphomet-sprite-right";
import { BaphometJr } from "./BaphometJr";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class Baphomet extends Monster {
  x = 300;
  y = 300;
  speedX = 120;
  speedY = 120;
  frameX = 0;
  frameY = 0;

  width = 83;
  height = 118;

  respawnTimeMin = 20000;
  respawnTimeMax = 25000;

  atk = 150;
  visionRange = 150;
  trackRange = 500;
  isAggressiveOnVision = true;
  dps = 300;

  behaviorActions = this.walkingsAnyDirection(1000, 2000).concat([
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
  ]);

  attackAudio = new AudioSubject(this, loadBaphometAttackAudio());
  breathAudio = new AudioSubject(this, loadBaphometBreath());
  damagedAudio = new AudioSubject(this, loadBaphometDamagedAudio());
  deadAudio = new AudioSubject(this, loadBaphometDeadAudio());

  frames: CropImage[][] = [
    // standing
    [
      {
        order: 0,
        offsetX: 4,
        offsetY: 3,
        width: 83,
        height: 118,
        marginRightWidth: 29,
        marginRightHeight: 10,
      },
      {
        order: 1,
        offsetX: 109,
        offsetY: 5,
        width: 87,
        height: 117,
        marginLeftWidth: -6,
        marginLeftHeight: 1,
        marginRightWidth: 31,
        marginRightHeight: 11,
      },
      {
        order: 2,
        offsetX: 215,
        offsetY: 6,
        width: 91,
        height: 116,
        marginLeftWidth: -10,
        marginLeftHeight: 2,
        marginRightWidth: 31,
        marginRightHeight: 12,
      },
      {
        order: 3,
        offsetX: 332,
        offsetY: 8,
        width: 95,
        height: 112,
        marginLeftWidth: -14,
        marginLeftHeight: 6,
        marginRightWidth: 31,
        marginRightHeight: 16,
      },
      {
        order: 4,
        offsetX: 445,
        offsetY: 11,
        width: 93,
        height: 112,
        marginLeftWidth: -12,
        marginLeftHeight: 12,
        marginRightWidth: 31,
        marginRightHeight: 22,
      },
      {
        order: 5,
        offsetX: 561,
        offsetY: 10,
        width: 90,
        height: 112,
        marginLeftWidth: -9,
        marginLeftHeight: 11,
        marginRightWidth: 31,
        marginRightHeight: 21,
      },
      {
        order: 6,
        offsetX: 675,
        offsetY: 10,
        width: 85,
        height: 112,
        marginLeftWidth: -4,
        marginLeftHeight: 8,
        marginRightWidth: 31,
        marginRightHeight: 18,
      },
      {
        order: 7,
        offsetX: 783,
        offsetY: 8,
        width: 84,
        height: 114,
        marginLeftWidth: -2,
        marginLeftHeight: 4,
        marginRightWidth: 30,
        marginRightHeight: 14,
      },
    ],
    [],
    // walking
    [
      {
        order: 0,
        offsetX: 7,
        offsetY: 314,
        width: 88,
        height: 119,
        marginLeftWidth: -6,
        marginLeftHeight: -1,

        marginRightWidth: 30,
        marginRightHeight: 9,
      },
      {
        order: 1,
        offsetX: 121,
        offsetY: 319,
        width: 96,
        height: 110,
        marginLeftWidth: -9,
        marginLeftHeight: -1,
        marginRightWidth: 25,
        marginRightHeight: 9,
      },
      {
        order: 2,
        offsetX: 239,
        offsetY: 319,
        width: 88,
        height: 110,
        marginLeftWidth: -6,
        marginLeftHeight: -1,

        marginRightWidth: 30,
        marginRightHeight: 9,
      },
      {
        order: 3,
        offsetX: 353,
        offsetY: 310,
        width: 83,
        height: 121,
        marginLeftWidth: -2,
        marginLeftHeight: -2,

        marginRightWidth: 31,
        marginRightHeight: 8,
      },
      {
        order: 4,
        offsetX: 483,
        offsetY: 324,
        width: 82,
        height: 102,
        marginLeftWidth: 20,
        marginLeftHeight: 19,
        marginRightWidth: 11,
        marginRightHeight: 19,
      },
      {
        order: 5,
        offsetX: 585,
        offsetY: 319,
        width: 78,
        height: 112,
        marginLeftWidth: 7,
        marginLeftHeight: 9,
        marginRightWidth: 28,
        marginRightHeight: 9,
      },
      {
        order: 6,
        offsetX: 686,
        offsetY: 318,
        width: 67,
        height: 114,
        marginLeftWidth: -1,
        marginLeftHeight: 7,
        marginRightWidth: 47,
        marginRightHeight: 7,
      },
      {
        order: 7,
        offsetX: 775,
        offsetY: 323,
        width: 78,
        height: 103,
        marginLeftWidth: 6,
        marginLeftHeight: 18,
        marginRightWidth: 29,
        marginRightHeight: 18,
      },
    ],
    // attacking
    [
      {
        order: 0,
        offsetX: 11,
        offsetY: 479,
        width: 83,
        height: 118,
        marginRightWidth: 29,
        marginRightHeight: 10,
      },
      {
        order: 1,
        offsetX: 128,
        offsetY: 481,
        width: 90,
        height: 114,
        marginLeftWidth: 14,
        marginLeftHeight: 4,
        marginRightWidth: 8,
        marginRightHeight: 14,
      },
      {
        order: 2,
        offsetX: 244,
        offsetY: 483,
        width: 115,
        height: 112,
        marginLeftWidth: 0,
        marginLeftHeight: 6,
        marginRightWidth: -3,
        marginRightHeight: 16,
      },
      {
        order: 3,
        offsetX: 384,
        offsetY: 483,
        width: 115,
        height: 112,
        marginLeftWidth: 0,
        marginLeftHeight: 6,
        marginRightWidth: -3,
        marginRightHeight: 16,
      },
      {
        order: 4,
        offsetX: 525,
        offsetY: 487,
        width: 72,
        height: 97,
        marginLeftWidth: 14,
        marginLeftHeight: 23,
        marginRightWidth: 26,
        marginRightHeight: 33,
      },
      {
        order: 5,
        offsetX: 633,
        offsetY: 487,
        width: 72,
        height: 96,
        marginLeftWidth: 16,
        marginLeftHeight: 25,
        marginRightWidth: 24,
        marginRightHeight: 35,
      },
    ],
    [],
    // hurting / die
    [
      {
        order: 0,
        offsetX: 7,
        offsetY: 808,
        width: 83,
        height: 118,
        marginRightWidth: 29,
        marginRightHeight: 10,
      },
      {
        order: 1,
        offsetX: 113,
        offsetY: 808,
        width: 134,
        height: 118,
        marginLeftWidth: -21,
        marginLeftHeight: 1,
        marginRightWidth: -1,
        marginRightHeight: 10,
      },
      {
        order: 2,
        offsetX: 265,
        offsetY: 832,
        width: 123,
        height: 87,
        marginLeftWidth: 42,
        marginLeftHeight: 29,
        marginRightWidth: -53,
        marginRightHeight: 40,
      },
      {
        order: 3,
        offsetX: 421,
        offsetY: 814,
        width: 79,
        height: 111,
        marginLeftWidth: 26,
        marginLeftHeight: 23,
      },
      {
        order: 4,
        offsetX: 532,
        offsetY: 810,
        width: 77,
        height: 120,
        marginLeftWidth: 20,
        marginLeftHeight: 14,
      },
      {
        order: 5,
        offsetX: 637,
        offsetY: 829,
        width: 89,
        height: 88,
        marginLeftWidth: 31,
        marginLeftHeight: 114,
      },
    ],
  ];

  weaponSprite = { offsetX: 772, offsetY: 822, width: 74, height: 99 };

  healAllLevel15 = new HealAll(15);
  healLevel20 = new Heal(20);

  comeOnBaphometJrSkill = new ComeOn({
    level: 1,
    summonMonsters: () => {
      let i = 1;
      const amountMonster = 6;
      const summonMonsters: Monster[] = [];

      while (i <= amountMonster) {
        summonMonsters.push(new BaphometJr(this.canvas));
        i++;
      }
      return summonMonsters;
    },
  });

  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, baphometSpriteLeft, baphometSpriteRight);

    this.maxHp = 1000;
    this.hp = this.maxHp;

    this.dropItems = [
      [YggdrasilBerry, 10],
      [EvilHorn, 30],
      [WhiteHerb, 15],
    ];

    this.breathAudio.volume = 0.08;

    this.whenHp(
      (hp) => hp <= this.maxHp * 0.7,
      tap(() => {
        this.healAllLevel15.useWith(this, this);
      }),
      this.canUseAgainAfter(60000)
    ).subscribe();

    this.whenHp(
      (hp) => hp <= this.maxHp * 0.25,
      tap(() => {
        this.healLevel20.useWith(this, this);
      }),
      this.canUseAgainAfter(60000)
    ).subscribe();

    this.whenAggressiveAndHp(
      (hp) => hp <= this.maxHp * 0.9,
      tap(() => {
        this.comeOnBaphometJrSkill.useWith(this);
      }),
      this.comeOnBaphometJrSkill.allSummonDiedCanUseAfter(10000)
    ).subscribe();
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 3;
      return this.forwardFrameX(150, 0, 5, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 3) {
            this.attackAudio.play();
          }
          if (frameX === 4) {
            if (this.direction === DIRECTION.LEFT) {
              this.onDamageArea$.next({
                x: this.x - this.width / 4,
                y: this.y + this.height / 4,
                w: 60,
                h: 60,
              });
            } else if (this.direction === DIRECTION.RIGHT) {
              this.onDamageArea$.next({
                x: this.x + (this.width * 3) / 4,
                y: this.y,
                w: 60,
                h: 60,
              });
            }
          }
        })
      );
    });
  }

  walking() {
    return defer(() => {
      this.frameY = 2;
      return this.forwardFrameX(50, 0, 3);
    });
  }

  standing() {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(120, 0, 7).pipe(
        tap((frameX) => {
          if (frameX === 3) {
            this.breathAudio.play();
          }
        })
      );
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 5;
      return this.forwardFrameX(130, 0, 1, { once: true }).pipe(
        tap({
          next: (frameX) => {
            if (frameX === 0) {
              this.damagedAudio.play();
            }
          },
          unsubscribe: () => {
            this.damagedAudio.stop();
          },
        })
      );
    });
  }

  dying() {
    return defer(() => {
      this.frameY = 5;
      this.deadAudio.play();
      return this.forwardFrameX(130, 0, 2, { once: true });
    });
  }
}
