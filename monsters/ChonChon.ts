import { defer, interval, merge, Observable, Subject, timer } from "rxjs";
import {
  connect,
  ignoreElements,
  map,
  tap,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import { ConcentrationPotion } from "../items/ConcentrationPotion";
import { Jellopy } from "../items/Jellopy";
import { RedHerb } from "../items/RedHerb";
import { Shell } from "../items/Shell";
import { loadChonchonAttackAudio } from "../sounds/chonchon-attack";
import { loadChonchonDamaged } from "../sounds/chonchon-damaged";
import { loadChonchonDieAudio } from "../sounds/chonchon-die";
import { loadChonchonFlyingAudio } from "../sounds/chonchon-flying";
import { chonchonLeftImage } from "../sprites/chonchon-left-image";
import { chonchonRightImage } from "../sprites/chonchon-right-image";
import { playAudio } from "../utils/play-audio";
import { CropImage, DIRECTION, Monster } from "./Monster";

export class ChonChon extends Monster {
  x = 100;
  y = 100;
  maxHp = 150;
  hp = this.maxHp;
  atk = 25;
  speedX = 3.5;
  speedY = 3.5;
  frameX = 0;
  frameY = 0;
  width = 30;
  height = 26;

  attackRange = 30;
  visionRange = 250;
  trackRange = 250;

  isAggressiveOnVision = true;
  dps = 300;

  frames: CropImage[][] = [
    // standing
    [{ order: 0, offsetX: 12, offsetY: 10, width: 19, height: 26 }],
    // attacking
    [
      { order: 0, offsetX: 11, offsetY: 47, width: 19, height: 26 },
      {
        order: 1,
        offsetX: 46,
        offsetY: 47,
        width: 24,
        height: 26,
        marginLeftWidth: -4,
        marginLeftHeight: 0,
      },
      {
        order: 2,
        offsetX: 90,
        offsetY: 48,
        width: 24,
        height: 26,
        marginLeftWidth: -4,
        marginLeftHeight: 0,
      },
      {
        order: 3,
        offsetX: 135,
        offsetY: 52,
        width: 34,
        height: 22,

        marginLeftWidth: -9,
        marginLeftHeight: 1,
      },
    ],
    [],
    // hurting / dying
    [
      { order: 0, offsetX: 8, offsetY: 141, width: 20, height: 25 },
      {
        order: 1,
        offsetX: 42,
        offsetY: 141,
        width: 24,
        height: 26,
        marginLeftWidth: -5,
        marginLeftHeight: 0,
      },
      {
        order: 2,
        offsetX: 79,
        offsetY: 143,
        width: 25,
        height: 22,
        marginLeftWidth: -5,
        marginLeftHeight: 2,
      },
    ],
  ];

  wingIndex = 0;
  hideWing = false;
  wingFlip: CropImage[][] = [
    [
      {
        order: 0,
        offsetX: 33,
        offsetY: 210,
        width: 14,
        height: 8,
        marginLeftWidth: 20,
        marginLeftHeight: 3,
      },
      {
        order: 1,
        offsetX: 33,
        offsetY: 210,
        width: 14,
        height: 8,
        marginLeftWidth: 20,
        marginLeftHeight: 7,
      },
    ],
    [
      {
        order: 0,
        offsetX: 228,
        offsetY: 210,
        width: 14,
        height: 8,
        marginRightWidth: -10,
        marginRightHeight: 2,
      },
      {
        order: 1,
        offsetX: 228,
        offsetY: 210,
        width: 14,
        height: 8,
        marginRightWidth: -10,
        marginRightHeight: 6,
      },
    ],
  ];

  wingLeft: CropImage[][] = [
    [
      {
        order: 0,
        offsetX: 13,
        offsetY: 211,
        width: 9,
        height: 6,
        marginLeftWidth: -1,
        marginLeftHeight: -3,
      },
      {
        order: 1,
        offsetX: 13,
        offsetY: 211,
        width: 9,
        height: 6,
        marginLeftWidth: -3,
        marginLeftHeight: -2,
      },
    ],
    [
      {
        order: 0,
        offsetX: 253,
        offsetY: 211,
        width: 9,
        height: 6,
        marginRightWidth: 12,
        marginRightHeight: -4,
      },
      {
        order: 1,
        offsetX: 253,
        offsetY: 211,
        width: 9,
        height: 6,
        marginRightWidth: 10,
        marginRightHeight: -3,
      },
    ],
  ];

  wingRightDown: CropImage[][] = [
    [
      {
        order: 0,
        offsetX: 73,
        offsetY: 210,
        width: 12,
        height: 8,
        marginLeftWidth: 19,
        marginLeftHeight: 10,
      },
      {
        order: 1,
        offsetX: 73,
        offsetY: 210,
        width: 12,
        height: 8,
        marginLeftWidth: 18,
        marginLeftHeight: 13,
      },
    ],
    [
      {
        offsetX: 190,
        offsetY: 210,
        width: 12,
        height: 8,
        marginRightWidth: -12,
        marginRightHeight: 10,
      },

      {
        offsetX: 190,
        offsetY: 210,
        width: 12,
        height: 8,
        marginRightWidth: -11,
        marginRightHeight: 13,
      },
    ],
  ];

  attackAudio = loadChonchonAttackAudio();
  damagedAudio = loadChonchonDamaged();
  flyingAudio = loadChonchonFlyingAudio();
  dieAudio = loadChonchonDieAudio();
  onPlayAttackAudio$ = new Subject<void>();
  onPlayDamagedAudio$ = new Subject<void>();
  onPlayFlyingAudio$ = new Subject<void>();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, chonchonLeftImage, chonchonRightImage);

    this.attackAudio.volume = 0.05;
    this.damagedAudio.volume = 0.05;
    this.flyingAudio.volume = 0.05;
    this.dieAudio.volume = 0.05;

    this.dropItems = [
      [Jellopy, 70],
      [Jellopy, 70],
      [Shell, 40],
      [RedHerb, 15],
      [ConcentrationPotion, 5],
    ];

    this.onPlayAttackAudio$
      .pipe(
        switchMap(() => playAudio(this.attackAudio)),
        takeUntil(this.onCleanup$)
      )
      .subscribe();
    this.onPlayDamagedAudio$
      .pipe(
        switchMap(() => playAudio(this.damagedAudio)),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    this.onPlayFlyingAudio$
      .pipe(
        switchMap(() =>
          playAudio(this.flyingAudio).pipe(
            takeUntil(merge(this.onPlayAttackAudio$, this.onPlayDamagedAudio$))
          )
        ),
        takeUntil(this.onCleanup$)
      )
      .subscribe();
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
  }
  standing(): Observable<any> {
    return defer(() => {
      this.hideWing = false;
      this.onPlayFlyingAudio$.next();
      return this.flyingVibrateAnimation(50);
    });
  }

  dying(): Observable<any> {
    return defer(() => {
      this.hideWing = false;
      this.frameY = 3;
      this.dieAudio.play();

      return this.forwardFrameX(100, 0, 2, { once: true });
    });
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 1;
      this.hideWing = true;

      const maxFrameX = 3;
      const minFrameX = 0;
      return this.forwardFrameX(100, minFrameX, maxFrameX, {
        once: true,
      }).pipe(
        tap((frameX) => {
          if (frameX === 0) {
            this.onPlayAttackAudio$.next();
          } else if (frameX === 3) {
            if (this.direction === DIRECTION.RIGHT) {
              this.onDamageArea$.next({
                x: this.x + (this.width * 3) / 4,
                y: this.y,
                w: 40,
                h: 40,
              });
            } else if (this.direction === DIRECTION.LEFT) {
              this.onDamageArea$.next({
                x: this.x - this.width / 4,
                y: this.y,
                w: 40,
                h: 40,
              });
            }
          }
        })
      );
    });
  }

  drawEffect(): void {
    let image: HTMLImageElement | null = null;
    if (this.direction === DIRECTION.RIGHT) {
      image = chonchonRightImage;
    } else if (this.direction === DIRECTION.LEFT) {
      image = chonchonLeftImage;
    }

    if (this.hideWing === false) {
      if (image) {
        if (this.direction === DIRECTION.LEFT) {
          this.drawCropImage(image, this.wingLeft[0][this.wingIndex], {
            x: this.frames[0][0].marginLeftWidth ?? 0,
            y: this.frames[0][0].marginHeight,
          });
          this.drawCropImage(image, this.wingFlip[0][this.wingIndex], {
            x: (this.frames[0][0].marginLeftWidth ?? 0) - 3,
            y: this.frames[0][0].marginHeight,
          });

          this.drawCropImage(image, this.wingRightDown[0][this.wingIndex], {
            x: this.frames[0][0].marginLeftWidth ?? 0,
            y: this.frames[0][0].marginHeight,
          });
        } else if (this.direction === DIRECTION.RIGHT) {
          this.drawCropImage(image, this.wingLeft[1][this.wingIndex], {
            x: this.frames[0][0].marginRightWidth ?? 0,
            y: this.frames[0][0].marginHeight,
          });
          this.drawCropImage(image, this.wingFlip[1][this.wingIndex], {
            x: (this.frames[0][0].marginRightWidth ?? 0) - 3,
            y: this.frames[0][0].marginHeight,
          });

          this.drawCropImage(image, this.wingRightDown[1][this.wingIndex], {
            x: this.frames[0][0].marginRightWidth ?? 0,
            y: this.frames[0][0].marginHeight,
          });
        }
      }
      this.wingIndex = this.wingIndex === 0 ? 1 : 0;
    }
  }

  hurting(): Observable<any> {
    return defer(() => {
      this.hideWing = true;
      this.frameY = 3;
      this.onPlayDamagedAudio$.next();

      return this.forwardFrameX(100, 0, 1, { once: true });
    });
  }

  walking(): Observable<any> {
    return defer(() => {
      this.hideWing = false;
      this.onPlayFlyingAudio$.next();
      return this.flyingVibrateAnimation(50);
    });
  }

  flyingVibrateAnimation<T>(delay: number) {
    this.frameY = 0;
    const update$ = interval(delay).pipe(
      connect((t$) => {
        let marginWidthDirection = 1;
        let marginWidth = -1;

        const vibrateWidth$ = t$.pipe(
          tap(() => {
            marginWidth += marginWidthDirection;
            if (marginWidth === 5) {
              marginWidthDirection = -marginWidthDirection;
            } else if (marginWidth === -1) {
              marginWidthDirection = -marginWidthDirection;
              marginWidth = 1;
            }
            this.frames[0][0].marginLeftWidth = marginWidth;
            this.frames[0][0].marginRightWidth = marginWidth;
          })
        );

        let marginHeightDirection = 1;
        let marginHeight = -1;
        const vibrateHeight$ = t$.pipe(
          tap(() => {
            marginHeight += marginHeightDirection;
            if (marginHeight === 3) {
              marginHeightDirection = -marginHeightDirection;
            } else if (marginHeight === -1) {
              marginHeightDirection = -marginHeightDirection;
              marginHeight = 1;
            }
            this.frames[0][0].marginHeight = marginHeight;
          })
        );

        return merge(vibrateWidth$, vibrateHeight$);
      })
    );
    return merge(
      this.forwardFrameX(delay, 0, 0),
      update$.pipe(ignoreElements())
    );
  }
}