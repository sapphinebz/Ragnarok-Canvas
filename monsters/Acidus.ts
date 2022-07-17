import { defer, Observable, Subject, switchMap } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { loadAcidusAttackSound } from '../sounds/acidus-attack';
import { loadAcidusDeadSound } from '../sounds/acidus-dead';
import { loadAcidusLeftSprite } from '../sprites/load-acidus-left';
import { loadAcidusSpriteRight } from '../sprites/load-acidus-right';
import { distanceBetween } from '../utils/collision';
import { playAudio } from '../utils/play-audio';
import { ACTION, AggressiveCondition, CropImage, Monster } from './Monster';

export class Acidus extends Monster {
  maxHp = 120;
  hp = this.maxHp;
  x = 200;
  y = 200;
  speedX = 5;
  speedY = 5;
  frameX = 0;
  frameY = 0;
  width = 119;
  height = 120;

  attackAudio = loadAcidusAttackSound();
  deadAudio = loadAcidusDeadSound();

  onPlayDeadAudio$ = new Subject<void>();

  frames: CropImage[][] = [
    [
      {
        order: 0,
        offsetX: 6,
        offsetY: 26,
        width: 90,
        height: 71,
      },
      {
        order: 1,
        offsetX: 119,
        offsetY: 25,
        width: 101,
        height: 64,
        marginRightWidth: -12,
        // marginHeight: 1,
      },
      {
        order: 2,
        offsetX: 240,
        offsetY: 19,
        width: 132,
        height: 75,
        marginRightWidth: -43,
        // marginHeight: -10,
      },
      {
        order: 3,
        offsetX: 392,
        offsetY: 16,
        width: 116,
        height: 82,
        marginRightWidth: -27,
        // marginHeight: -17,
      },
      {
        order: 4,
        offsetX: 527,
        offsetY: 4,
        width: 104,
        height: 103,
        marginRightWidth: -15,
        // marginHeight: -38,
      },
      {
        order: 5,
        offsetX: 653,
        offsetY: 4,
        width: 111,
        height: 104,
        marginRightWidth: -22,
        // marginHeight: -39,
      },
      {
        order: 6,
        offsetX: 786,
        offsetY: 19,
        width: 113,
        height: 84,
        marginRightWidth: -24,
        // marginHeight: -19,
      },
      {
        order: 7,
        offsetX: 930,
        offsetY: 22,
        width: 99,
        height: 64,
        marginRightWidth: -10,
        // marginHeight: 1,
      },
    ],
    [],
    //Attack
    [
      { order: 0, offsetX: 6, offsetY: 276, width: 98, height: 67 },
      {
        order: 1,
        offsetX: 135,
        offsetY: 271,
        width: 130,
        height: 77,
        marginRightWidth: -32,
      },
      {
        order: 2,
        offsetX: 295,
        offsetY: 266,
        width: 115,
        height: 83,
        marginRightWidth: -18,
      },
      {
        order: 3,
        offsetX: 434,
        offsetY: 258,
        width: 100,
        height: 97,
        marginRightWidth: -5,
      },
      {
        order: 4,
        offsetX: 558,
        offsetY: 259,
        width: 109,
        height: 95,
        marginRightWidth: -14,
      },
      {
        order: 5,
        offsetX: 687,
        offsetY: 272,
        width: 114,
        height: 78,
        marginRightWidth: -8,
      },
      {
        order: 6,
        offsetX: 823,
        offsetY: 279,
        width: 104,
        height: 63,
        marginRightWidth: 2,
      },
      {
        order: 7,
        offsetX: 953,
        offsetY: 275,
        width: 87,
        height: 71,
        marginRightWidth: 20,
      },
    ],
    [],
    [],
    [
      {
        order: 0,
        offsetX: 9,
        offsetY: 651,
        width: 97,
        height: 72,
        marginLeftWidth: -3,
        marginRightWidth: -5,
      },
      {
        order: 1,
        offsetX: 130,
        offsetY: 650,
        width: 87,
        height: 73,
        marginLeftWidth: -1,
        marginRightWidth: 3,
      },
      {
        order: 2,
        offsetX: 245,
        offsetY: 662,
        width: 123,
        height: 49,
        marginLeftWidth: -3,
        marginRightWidth: -34,
        marginHeight: 20,
      },
    ],
  ];
  constructor(public canvas: HTMLCanvasElement) {
    super(canvas, loadAcidusLeftSprite(), loadAcidusSpriteRight());
    this.deadAudio.volume = 0.05;
    this.attackAudio.volume = 0.05;

    this.onPlayDeadAudio$
      .pipe(
        switchMap(() => playAudio(this.deadAudio)),
        takeUntil(this.onCleanup$)
      )
      .subscribe();
  }

  getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
  }

  attack(): Observable<any> {
    return defer(() => {
      this.frameY = 2;
      this.attackAudio.play();
      return this.createForwardFrame(60, 0, 7, { once: true });
    });
  }

  walking() {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(60, 0, 7);
    });
  }

  standing() {
    return defer(() => {
      this.frameY = 0;
      return this.createForwardFrame(60, 0, 7);
    });
  }

  drawEffect(): void {}

  checkAggressive(condition: AggressiveCondition) {
    const distance = distanceBetween(condition.target, this);
    if (distance <= this.visionRange) {
      this.aggressiveTarget = condition.target;
      this.actionChange$.next(ACTION.MOVE_TO_TARGET);
    }
  }

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 5;
      return this.createForwardFrame(120, 1, 2, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 0) {
            this.onPlayDeadAudio$.next();
          }
        })
      );
    });
  }

  dying() {
    return defer(() => {
      this.frameY = 5;
      return this.createForwardFrame(120, 0, 2, { once: true }).pipe(
        tap((frameX) => {
          if (frameX === 0) {
            this.onPlayDeadAudio$.next();
          }
        })
      );
    });
  }
}
