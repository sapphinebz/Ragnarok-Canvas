import { combineLatest, filter, take, takeUntil, tap } from "rxjs";
import { Apple } from "../items/Apple";
import { ConcentrationPotion } from "../items/ConcentrationPotion";
import { WhiteHerb } from "../items/WhiteHerb";
import { WhitePotion } from "../items/WhitePotion";
import { ComeOn } from "../skills/ComeOn";
import { Heal } from "../skills/Heal";
import { HealAll } from "../skills/HealAll";
import { poringSpriteLeftImage } from "../sprites/load-poring-left";
import { poringSpriteRightImage } from "../sprites/load-poring-right";
import { randomMinMax } from "../utils/random-minmax";
import { CropImage, DIRECTION, Monster } from "./Monster";
import { Poporing } from "./Poporing";
import { Poring } from "./Poring";
import { SantaPoring } from "./SantaPoring";

export class Angeling extends Poring {
  atk = 120;
  speedX = 70;
  speedY = 70;

  respawnTimeMin = 50000;
  respawnTimeMax = 60000;

  isAggressiveOnVision = true;
  visionRange = 300;
  trackRange = 500;
  dps = 400;

  haloFrame = 0;
  haloY = -5;
  // Halo as direction
  haloSprite: CropImage[][] = [
    [{ order: 0, offsetX: 523, offsetY: 480, width: 27, height: 9 }],
    [{ order: 1, offsetX: 79, offsetY: 481, width: 26, height: 8 }],
  ];

  // WingA as direction
  wingA_Y: number = 0;
  wingASprite: CropImage[][] = [
    [
      { order: 0, offsetX: 232, offsetY: 474, width: 14, height: 19 },
      {
        order: 1,
        offsetX: 255,
        offsetY: 473,
        width: 14,
        height: 19,
        marginLeftWidth: 0,
        marginLeftHeight: 7,
      },
    ],
    [
      { order: 0, offsetX: 383, offsetY: 474, width: 14, height: 19 },
      {
        order: 1,
        offsetX: 360,
        offsetY: 473,
        width: 14,
        height: 19,
        marginRightHeight: 7,
      },
    ],
  ];

  // WingB as direction
  wingB_Y: number = 0;
  wingBSprite: CropImage[][] = [
    [
      { order: 0, offsetX: 278, offsetY: 476, width: 18, height: 19 },
      {
        order: 1,
        offsetX: 301,
        offsetY: 476,
        width: 15,
        height: 21,
        marginLeftWidth: 0,
        marginLeftHeight: 7,
      },
    ],
    [
      { order: 0, offsetX: 333, offsetY: 476, width: 18, height: 19 },
      {
        order: 1,
        offsetX: 313,
        offsetY: 476,
        width: 15,
        height: 21,
        marginRightHeight: 7,
      },
    ],
  ];

  frameXFlip = 1;
  flipWingFrame$ = this.timelineFrames(this.walkSpeed * 4, 0, 1).pipe(
    tap({
      next: (frameX) => (this.frameXFlip = frameX),
    })
  );

  get ctx() {
    return this.canvas.getContext("2d")!;
  }

  healAllSkill = new HealAll(15);
  healSkill = new Heal(15);
  comeonMyPoringSkill = new ComeOn({
    level: 1,
    summonMonsters: () => {
      let i = 1;
      const amountMonster = 6;
      const summonMonsters: Monster[] = [];
      const monsters = [Poring, Poporing, SantaPoring];
      while (i <= amountMonster) {
        const randomMonsterClassIndex = randomMinMax(0, monsters.length - 1);
        const MonsterClass = monsters[randomMonsterClassIndex];
        summonMonsters.push(new MonsterClass(this.canvas));
        i++;
      }
      return summonMonsters;
    },
  });

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.maxHp = 450;
    this.hp = this.maxHp;

    this.dropItems = [
      [ConcentrationPotion, 10],
      [WhiteHerb, 40],
      [Apple, 70],
      [Apple, 30],
      [WhitePotion, 15],
    ];

    this.whenHp(
      (hp) => hp <= this.maxHp * 0.5,
      tap(() => {
        this.healAllSkill.useWith(this, this);
      }),
      this.canUseAgainAfter(20000)
    ).subscribe();

    this.whenHp(
      (hp) => hp <= this.maxHp * 0.3,
      tap(() => {
        this.healSkill.useWith(this, this);
      }),
      this.canUseAgainAfter(60000)
    ).subscribe();

    this.whenAggressiveAndHp(
      (hp) => hp <= this.maxHp * 0.9,
      tap(() => {
        this.comeonMyPoringSkill.useWith(this);
      }),
      this.comeonMyPoringSkill.allSummonDiedCanUseAfter(15000)
    );

    this.flipWingFrame$
      .pipe(takeUntil(this.onDied$), takeUntil(this.onCleanup$))
      .subscribe();

    this.onDieChangeValueEffect({
      init: () => this.haloY,
      targetValue: this.height,
      updated: (y) => (this.haloY = y),
    })
      .pipe(takeUntil(this.onCleanup$))
      .subscribe();

    this.onDieChangeValueEffect({
      init: () => this.wingA_Y,
      targetValue: this.height,
      updated: (y) => (this.wingA_Y = y),
    })
      .pipe(takeUntil(this.onCleanup$))
      .subscribe();

    this.onDieChangeValueEffect({
      init: () => this.wingB_Y,
      targetValue: this.height,
      updated: (y) => (this.wingB_Y = y),
    })
      .pipe(takeUntil(this.onCleanup$))
      .subscribe();
  }

  drawEffect(): void {
    let image: HTMLImageElement | null = null;
    if (this.direction === DIRECTION.RIGHT) {
      image = poringSpriteRightImage;
    } else if (this.direction === DIRECTION.LEFT) {
      image = poringSpriteLeftImage;
    }

    if (this.haloFrame !== null) {
      let margin: { x: number; y: number } = { x: 0, y: this.haloY };
      let directionFrame: number = 0;
      if (this.direction === DIRECTION.LEFT) {
        directionFrame = 0;
        margin = { x: 7, y: this.haloY };
      } else if (this.direction === DIRECTION.RIGHT) {
        directionFrame = 1;
        margin = { x: 3, y: this.haloY };
      }

      if (image !== null) {
        this.drawCropImage(
          image,
          this.haloSprite[directionFrame][this.haloFrame],
          margin
        );
      }
    }

    if (this.frameXFlip !== null) {
      let marginWingA: { x?: number; y?: number } = {
        x: this.width,
        y: this.wingA_Y,
      };
      let marginWingB: { x?: number; y?: number } = {
        x: this.width,
        y: this.wingB_Y,
      };
      let directionFrame: number = 0;
      if (this.direction === DIRECTION.LEFT) {
        directionFrame = 0;
        if (this.isDied === false) {
          this.wingA_Y = -5;
          this.wingB_Y = 1;
        }

        marginWingA = { x: -12, y: this.wingA_Y };
        marginWingB = { x: this.width, y: this.wingB_Y };
      } else if (this.direction === DIRECTION.RIGHT) {
        directionFrame = 1;
        if (this.isDied === false) {
          this.wingA_Y = -3;
          this.wingB_Y = 0;
        }

        marginWingA = { x: this.width - 3, y: this.wingA_Y };
        marginWingB = { x: -18, y: this.wingB_Y };
      }

      if (image !== null) {
        this.drawCropImage(
          image,
          this.wingASprite[directionFrame][this.frameXFlip],
          marginWingA
        );
        this.drawCropImage(
          image,
          this.wingBSprite[directionFrame][this.frameXFlip],
          marginWingB
        );
      }
    }
  }
}
