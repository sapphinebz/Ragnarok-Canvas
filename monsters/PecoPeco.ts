import { defer, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { BillsOfBird } from "../items/BillsOfBird";
import { RedHerb } from "../items/RedHerb";
import { YellowHerb } from "../items/YellowHerb";
import { AudioSubject } from "../sounds/audio-subject";
import { loadPecoPecoAttack } from "../sounds/pecopeco-attack";
import { loadPecopecoDamaged } from "../sounds/pecopeco-damaged";
import { loadPecopecoDieAudio } from "../sounds/pecopeco-die";
import { loadPecoPecoMoveAudio } from "../sounds/pecopeco-move";
import { loadPecopecoStandAudio } from "../sounds/pecopeco-stand";
import { loadPecopecoStandAudio2 } from "../sounds/pecopeco-stand2";
import { pecopecoLeftImage } from "../sprites/pecopeco-left-image";
import { pecopecoRightImage } from "../sprites/pecopeco-right-image";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class Pecopeco extends Monster {
  x = 150;
  y = 150;
  atk = 70;
  speedX = 120;
  speedY = 120;
  frameX = 0;
  frameY = 0;
  width = 64;
  height = 89;

  attackRange = 30;
  visionRange = 150;
  trackRange = 700;
  isAggressiveOnVision = true;
  dps = 400;

  respawnTimeMin = 10000;
  respawnTimeMax = 15000;

  behaviorActions = this.walkingsAnyDirection(1000, 3000).concat([
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
    this.standingDuration(3000, 6000),
  ]);

  standAudio = new AudioSubject(this, [
    loadPecopecoStandAudio(),
    loadPecopecoStandAudio2(),
  ]);

  attackAudio = new AudioSubject(this, loadPecoPecoAttack());

  moveAudio = new AudioSubject(this, loadPecoPecoMoveAudio());
  damagedAudio = new AudioSubject(this, loadPecopecoDamaged());

  diedAudio = loadPecopecoDieAudio();

  frames: CropImage[][] = [
    [
      {
        order: 0,
        offsetX: 11,
        offsetY: 11,
        width: 64,
        height: 90,
      },
      {
        order: 1,
        offsetX: 87,
        offsetY: 12,
        width: 64,
        height: 89,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
      },
      {
        order: 2,
        offsetX: 163,
        offsetY: 13,
        width: 64,
        height: 88,
        marginLeftWidth: 0,
        marginLeftHeight: 2,
      },
      {
        order: 3,
        offsetX: 239,
        offsetY: 12,
        width: 64,
        height: 89,
        marginLeftWidth: 0,
        marginLeftHeight: 1,
      },
      {
        order: 4,
        offsetX: 755,
        offsetY: 11,
        width: 64,
        height: 90,
      },
      {
        order: 5,
        offsetX: 831,
        offsetY: 16,
        width: 59,
        height: 85,
        marginLeftWidth: 5,
        marginLeftHeight: 5,
        marginRightHeight: 5,
        marginRightWidth: 0,
      },
      {
        order: 6,
        offsetX: 901,
        offsetY: 21,
        width: 99,
        height: 81,
        marginLeftWidth: -32,
        marginLeftHeight: 42,
        marginRightWidth: -8,
        marginRightHeight: 38,
      },
    ],
    [],
    [
      {
        order: 0,
        offsetX: 11,
        offsetY: 262,
        width: 62,
        height: 81,
        marginRightWidth: 2,
        marginRightHeight: 0,
      },
      {
        order: 1,
        offsetX: 85,
        offsetY: 255,
        width: 62,
        height: 88,
        marginRightWidth: 2,
        marginRightHeight: 0,
      },
      {
        order: 2,
        offsetX: 159,
        offsetY: 267,
        width: 74,
        height: 76,
        marginRightWidth: -10,
        marginRightHeight: 0,
      },
      {
        order: 3,
        offsetX: 245,
        offsetY: 267,
        width: 62,
        height: 76,
        marginRightWidth: 2,
        marginRightHeight: 0,
      },

      {
        order: 4,
        offsetX: 671,
        offsetY: 253,
        width: 64,
        height: 90,
      },
      {
        order: 5,
        offsetX: 747,
        offsetY: 250,
        width: 64,
        height: 93,
        marginLeftWidth: 2,
        marginLeftHeight: -3,
        marginRightWidth: -2,
        marginRightHeight: -3,
      },
      {
        order: 6,
        offsetX: 823,
        offsetY: 241,
        width: 65,
        height: 102,
        marginLeftWidth: 1,
        marginLeftHeight: -10,
        marginRightWidth: -2,
        marginRightHeight: -10,
      },
      {
        order: 7,
        offsetX: 900,
        offsetY: 278,
        width: 98,
        height: 65,
        marginLeftWidth: -34,
        marginLeftHeight: 27,
        marginRightWidth: 0,
        marginRightHeight: 27,
      },
    ],
  ];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, pecopecoLeftImage, pecopecoRightImage);

    this.maxHp = 250;
    this.hp = this.maxHp;

    this.dropItems = [
      [RedHerb, 20],
      [BillsOfBird, 40],
      [YellowHerb, 10],
    ];

    this.standAudio.volume = 0.02;
    this.attackAudio.volume = 0.05;
    this.moveAudio.volume = 0.03;
    this.damagedAudio.volume = 0.05;
    this.diedAudio.volume = 0.05;
  }

  standing(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(150, 0, 3).pipe(
        tap((frameX) => {
          if (frameX === 0) {
            this.standAudio.play();
          }
        })
      );
    });
  }

  dying(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(150, 4, 6, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 4) {
            this.diedAudio.play();
          }
        })
      );
    });
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      return this.forwardFrameX(150, 4, 7, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 4) {
            this.attackAudio.play();
          } else if (frameX === 7) {
            if (this.direction === DIRECTION.LEFT) {
              this.onDamageArea$.next({
                x: this.x - this.width / 2,
                y: this.y + this.height / 4,
                w: 30,
                h: 20,
              });
            } else if (this.direction === DIRECTION.RIGHT) {
              this.onDamageArea$.next({
                x: this.x + (this.width * 1) / 2,
                y: this.y + this.height / 4,
                w: 30,
                h: 20,
              });
            }
          }
        })
      );
    });
  }

  drawEffect(): void {}

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 0;
      return this.forwardFrameX(150, 4, 5, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 4) {
            this.damagedAudio.play();
          }
        })
      );
    });
  }

  walking(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      return this.forwardFrameX(60, 0, 3).pipe(
        tap({
          next: (frameX) => {
            if (frameX === 0) {
              this.moveAudio.play();
            }
          },
          complete: () => {
            this.moveAudio.stop();
          },
        })
      );
    });
  }
}
