import { defer, EMPTY, Observable, Subject, switchMap } from 'rxjs';
import { takeUntil, takeWhile, tap } from 'rxjs/operators';
import { loadAcidusAttackSound } from '../sounds/acidus-attack';
import { loadAcidusDeadSound } from '../sounds/acidus-dead';
import { loadAcidusLeftSprite } from '../sprites/load-acidus-left';
import { loadAcidusSpriteRight } from '../sprites/load-acidus-right';
import { playAudio } from '../utils/play-audio';
import { CropImage, DIRECTION, Monster } from './Monster';

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
        offsetX: 0,
        width: 119,
        marginLeftWidth: -6,
        marginRightWidth: 6,
      },
      { order: 1, offsetX: 119, width: 119 },
      { order: 2, offsetX: 240, width: 135, marginRightWidth: -16 },
      { order: 3, offsetX: 392, width: 135, marginRightWidth: -16 },
      { order: 4, offsetX: 527, width: 120, marginRightWidth: -2 },
      { order: 5, offsetX: 653, width: 130, marginRightWidth: -12 },
      { order: 6, offsetX: 783, width: 135, marginRightWidth: -14 },
      { order: 7, offsetX: 930, width: 110, marginRightWidth: 9 },
    ],
    [],
    [
      { order: 0, offsetX: 120, width: 140 },
      { order: 1, offsetX: 280, width: 140 },
      { order: 2, offsetX: 420, width: 135 },
      { order: 3, offsetX: 540, width: 140 },
      { order: 4, offsetX: 680, width: 130 },
      { order: 5, offsetX: 815, width: 135 },
      { order: 6, offsetX: 950, width: 100 },
      { order: 7, offsetX: 1075, width: 135 },
    ],
    [],
    [],
    [
      {
        order: 0,
        offsetX: 0,
        width: 106,
        height: 122,
        marginLeftWidth: -11,
        marginRightWidth: 22,
      },
      {
        order: 1,
        offsetX: 117,
        width: 106,
        height: 122,
        marginLeftWidth: -11,
        marginRightWidth: 22,
      },
      {
        order: 2,
        offsetX: 228,
        width: 137,
        height: 122,
        marginLeftWidth: -11,
        marginRightWidth: -3,
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
      return this.createForwardFrame(50, 0, 7).pipe(
        takeWhile((frameX) => frameX + 1 <= 7)
      );
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

  hurting(): Observable<any> {
    return defer(() => {
      this.frameY = 5;
      return this.createForwardFrame(120, 0, 1, { once: true }).pipe(
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
