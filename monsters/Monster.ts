import {
  animationFrameScheduler,
  AsyncSubject,
  BehaviorSubject,
  combineLatest,
  defer,
  EMPTY,
  from,
  fromEvent,
  interval,
  map,
  MonoTypeOperatorFunction,
  Observable,
  pairwise,
  ReplaySubject,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import {
  concatAll,
  distinctUntilChanged,
  filter,
  repeat,
  takeUntil,
  takeWhile,
} from 'rxjs/operators';
import { loadCriticalAttack } from '../sounds/critical-attack';
import { playAudio } from '../utils/play-audio';
import { randomMinMax } from '../utils/random-minmax';
import { shuffle } from '../utils/shuffle';

export interface MoveLocation {
  x: number;
  y: number;
}

export interface WalkingConfig {
  faceDirection: DIRECTION;
  moveOption: () => MoveLocation;
  stopIfOutOfCanvas?: boolean;
}

export type WalkingStoppable = Pick<WalkingConfig, 'stopIfOutOfCanvas'>;

export const enum ACTION {
  IDLE,
  RANDOM,
  DIE,
  HURT,
}

export const enum DIRECTION {
  LEFT,
  RIGHT,
}

export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CropImage = {
  order: number;
  offsetX: number;
  offsetY?: number;
  width: number;
  height?: number;
  marginHeight?: number;
  marginLeftWidth?: number;
  marginRightWidth?: number;
};

export abstract class Monster {
  atk = 1;
  maxHp = 20;
  hp = this.maxHp;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  frameX = 0;
  frameY = 0;
  width: number;
  height: number;

  onCleanup$ = new ReplaySubject<void>(1);
  onDamageArea$ = new Subject<Area>();
  onMoving$ = new Subject<MoveLocation>();
  direction$ = new BehaviorSubject<DIRECTION>(DIRECTION.LEFT);

  set direction(value: DIRECTION) {
    this.direction$.next(value);
  }
  get direction() {
    return this.direction$.value;
  }

  leftImage$ = new ReplaySubject<HTMLImageElement>(1);
  rightImage$ = new ReplaySubject<HTMLImageElement>(1);

  actionChange$ = new BehaviorSubject<ACTION>(ACTION.IDLE);

  onDied$ = new AsyncSubject<void>();
  isDied = false;
  /**
   * on this monster need render
   */
  onActionTick$ = new Subject<void>();
  drawImage$ = new Subject<void>();

  criticalAttackSound = loadCriticalAttack();
  onPlayCriticalAttack$ = new Subject<void>();

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(
    public canvas: HTMLCanvasElement,
    public leftImage: HTMLImageElement,
    public rightImage: HTMLImageElement
  ) {
    fromEvent(leftImage, 'load')
      .pipe(take(1), takeUntil(this.onCleanup$))
      .subscribe(() => {
        this.leftImage$.next(leftImage);
      });

    fromEvent(rightImage, 'load')
      .pipe(take(1), takeUntil(this.onCleanup$))
      .subscribe(() => {
        this.rightImage$.next(rightImage);
      });

    this.criticalAttackSound.volume = 0.05;
    this.onPlayCriticalAttack$
      .pipe(
        switchMap(() => playAudio(this.criticalAttackSound)),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    this.actionChange$
      .pipe(
        distinctUntilChanged(),
        pairwise(),
        switchMap(([preAction, action]) => {
          if (this.isDied === true) {
            return EMPTY;
          } else if (action === ACTION.IDLE) {
            return EMPTY;
          } else if (action === ACTION.RANDOM) {
            return defer(() => {
              const randomTime = () => Math.random() * 3000 + 1000;
              const randomEndAction = () => takeUntil(timer(randomTime()));
              const actions = [
                this.walkingLeft().pipe(randomEndAction()),
                this.standing().pipe(randomEndAction()),
                this.walkingRight().pipe(randomEndAction()),
                this.standing().pipe(randomEndAction()),
                this.walkingUp().pipe(randomEndAction()),
                this.walkingDown().pipe(randomEndAction()),
                this.walkingTopLeft().pipe(randomEndAction()),
                this.walkingTopRight().pipe(randomEndAction()),
                this.walkingBottomLeft().pipe(randomEndAction()),
                this.walkingBottomRight().pipe(randomEndAction()),
              ];
              return from(shuffle(actions)).pipe(concatAll());
            }).pipe(repeat());
          } else if (action === ACTION.DIE) {
            this.isDied = true;
            return this.dying().pipe(
              tap({
                complete: () => {
                  this.onDied$.next();
                  this.onDied$.complete();
                },
              })
            );
          } else if (action === ACTION.HURT) {
            return this.hurting().pipe(
              tap({ complete: () => this.actionChange$.next(preAction) })
            );
          }
          return EMPTY;
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe(() => this.onActionTick$.next());

    combineLatest({
      direction: this.direction$,
      leftImage: this.leftImage$,
      rightImage: this.rightImage$,
      drawImage: this.drawImage$,
    })
      .pipe(takeUntil(this.onCleanup$))
      .subscribe(({ direction, leftImage, rightImage }) => {
        const frameXEntry = this.getFrameEntry(this.frameY, this.frameX);
        if (frameXEntry) {
          let {
            offsetX,
            offsetY,
            width,
            height,
            marginHeight,
            marginLeftWidth,
            marginRightWidth,
          } = frameXEntry;

          let image = direction === DIRECTION.RIGHT ? rightImage : leftImage;
          offsetY ??= this.height * this.frameY;
          height ??= this.height;
          marginHeight ??= 0;
          let marginWidth =
            direction === DIRECTION.RIGHT ? marginRightWidth : marginLeftWidth;
          marginWidth ??= 0;

          if (direction === DIRECTION.RIGHT) {
            offsetX = rightImage.width - (offsetX + width);
          }
          this.ctx.drawImage(
            image,
            offsetX,
            offsetY,
            width,
            height,
            this.x + marginWidth,
            this.y + marginHeight,
            width,
            height
          );
        }
      });
  }

  abstract getFrameEntry(frameY: number, frameX: number): CropImage;

  abstract drawEffect(): void;

  drawImage() {
    this.drawImage$.next();
  }

  randomSpawn(): void;
  randomSpawn(config?: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  }): void {
    if (config === undefined) {
      this.x = randomMinMax(0, this.canvas.width - this.width);
      this.y = randomMinMax(0, this.canvas.height - this.height);
    } else {
      const { minWidth, maxWidth, minHeight, maxHeight } = config;
      this.x = randomMinMax(minWidth, maxWidth - this.width);
      this.y = randomMinMax(minHeight, maxHeight - this.height);
    }
  }

  abstract standing(): Observable<any>;

  abstract walking(): Observable<any>;

  abstract dying(): Observable<any>;

  abstract attack(): Observable<any>;

  abstract hurting(): Observable<any>;

  createForwardFrame(
    delay: number,
    minFrameX: number,
    maxFrameX: number,
    option: { once: boolean } = { once: false }
  ) {
    this.frameX = minFrameX;
    const { once } = option;
    return interval(delay, animationFrameScheduler).pipe(
      map(() => this.frameX + 1),
      takeWhile((nextFrame) => {
        if (once && nextFrame > maxFrameX) {
          return false;
        }
        return true;
      }),
      map((nextFrame) => {
        if (nextFrame > maxFrameX) {
          return minFrameX;
        }
        return nextFrame;
      }),
      tap((nextFrame) => {
        this.frameX = nextFrame;
      }),
      startWith(this.frameX)
    );
  }

  /**
   * for test only
   */
  testSprites(frames: [number, number][], delay = 1000) {
    let index = 0;
    return interval(delay, animationFrameScheduler).pipe(
      map(() => {
        const [frameX, frameY] = frames[index];
        this.frameX = frameX;
        this.frameY = frameY;
        if (index + 1 > frames.length - 1) {
          index = 0;
        } else {
          index++;
        }
        return this.frameX;
      })
    );
  }

  /**
   * for test only
   */
  testArea(area: Area) {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(area.x, area.y, area.w, area.h);
    this.ctx.closePath();
  }

  die() {
    this.actionChange$.next(ACTION.DIE);
  }

  hurt() {
    this.actionChange$.next(ACTION.HURT);
  }

  walkingDown(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.LEFT,
      moveOption: () => this.moveDown(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingUp(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.RIGHT,
      moveOption: () => this.moveUp(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingLeft(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.LEFT,
      moveOption: () => this.moveLeft(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingRight(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.RIGHT,
      moveOption: () => this.moveRight(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingTopLeft(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.LEFT,
      moveOption: () => this.moveTopLeft(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingTopRight(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.RIGHT,
      moveOption: () => this.moveTopRight(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingBottomLeft(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.LEFT,
      moveOption: () => this.moveBottomLeft(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingBottomRight(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingAnimationFrames({
      faceDirection: DIRECTION.RIGHT,
      moveOption: () => this.moveBottomRight(),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  randomAction() {
    this.actionChange$.next(ACTION.RANDOM);
  }

  moveRight() {
    return { x: this.x + this.speedX, y: this.y };
  }

  moveLeft() {
    return { x: this.x - this.speedX, y: this.y };
  }

  moveUp() {
    return { x: this.x, y: this.y - this.speedY };
  }

  moveDown() {
    return { x: this.x, y: this.y + this.speedY };
  }

  moveTopLeft() {
    return { x: this.x - this.speedX, y: this.y - this.speedY };
  }

  moveBottomLeft() {
    return { x: this.x - this.speedX, y: this.y + this.speedY };
  }

  moveTopRight() {
    return { x: this.x + this.speedX, y: this.y - this.speedY };
  }

  moveBottomRight() {
    return { x: this.x + this.speedX, y: this.y + this.speedY };
  }

  cleanup() {
    this.onCleanup$.next();
    this.onCleanup$.complete();
  }

  playCriticalAudio() {
    this.onPlayCriticalAttack$.next();
  }

  private updateMove(): MonoTypeOperatorFunction<MoveLocation> {
    return tap((moveLocation) => {
      this.x = moveLocation.x;
      this.y = moveLocation.y;
      this.onMoving$.next(moveLocation);
    });
  }

  private walkingAnimationFrames(option: WalkingConfig) {
    const { faceDirection, stopIfOutOfCanvas = true, moveOption } = option;

    return defer(() => {
      this.direction = faceDirection;
      return this.walking().pipe(
        map(() => moveOption()),
        (source) => {
          if (stopIfOutOfCanvas) {
            return source.pipe(
              takeWhile((moveLocation) => !this.isOutOfCanvas(moveLocation))
            );
          }
          return source.pipe(
            filter((moveLocation) => !this.isOutOfCanvas(moveLocation))
          );
        },
        this.updateMove()
      );
    });
  }

  private isOutOfCanvas(moveLocation: MoveLocation) {
    if (moveLocation.x + this.width > this.canvas.width) {
      return true;
    } else if (moveLocation.x < 0) {
      return true;
    } else if (moveLocation.y + this.height > this.canvas.height) {
      return true;
    } else if (moveLocation.y < 0) {
      return true;
    }
    return false;
  }
}
