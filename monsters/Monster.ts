import {
  animationFrameScheduler,
  BehaviorSubject,
  combineLatest,
  defer,
  EMPTY,
  from,
  fromEvent,
  interval,
  map,
  MonoTypeOperatorFunction,
  NEVER,
  Observable,
  ReplaySubject,
  startWith,
  Subject,
  take,
  tap,
  timer,
} from 'rxjs';
import {
  concatAll,
  filter,
  repeat,
  takeUntil,
  takeWhile,
} from 'rxjs/operators';
import { randomMinMax } from '../utils/random-minmax';
import { shuffle } from '../utils/shuffle';

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

// [order, offsetX, width, offsetY, height]
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
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  frameX = 0;
  frameY = 0;
  width: number;
  height: number;
  isDied$ = new BehaviorSubject<boolean>(false);

  onCleanup$ = new ReplaySubject<void>(1);
  onDamageArea$ = new Subject<Area>();
  direction$ = new BehaviorSubject<DIRECTION>(DIRECTION.LEFT);

  set direction(value: DIRECTION) {
    this.direction$.next(value);
  }
  get direction() {
    return this.direction$.value;
  }

  get isDie() {
    return this.isDied$.value;
  }
  set isDie(value: boolean) {
    this.isDied$.next(value);
  }
  onDied$ = this.isDied$.pipe(filter((isDied) => isDied === true));
  leftImage$ = new ReplaySubject<HTMLImageElement>(1);
  rightImage$ = new ReplaySubject<HTMLImageElement>(1);

  drawImage$ = new Subject<void>();

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
    const stopAnimation = new ReplaySubject<void>(1);
    return interval(delay, animationFrameScheduler).pipe(
      map(() => {
        if (this.frameX + 1 <= maxFrameX) {
          this.frameX++;
        } else {
          if (once) {
            stopAnimation.next();
          } else {
            this.frameX = minFrameX;
          }
        }
        return this.frameX;
      }),
      takeUntil(stopAnimation),
      startWith(0)
    );
  }

  /**
   * use for test only
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
   * use for test only
   */
  testArea(area: Area) {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'red';
    this.ctx.fillRect(area.x, area.y, area.w, area.h);
    this.ctx.closePath();
  }

  die() {
    if (this.isDied$.value === false) {
      this.isDied$.next(true);
      return this.dying();
    }
    return EMPTY;
  }

  walkingDown() {
    return defer(() => {
      this.direction = DIRECTION.LEFT;
      return this.walking().pipe(
        tap(() => {
          this.moveDown();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingUp() {
    return defer(() => {
      this.direction = DIRECTION.RIGHT;
      return this.walking().pipe(
        tap(() => {
          this.moveUp();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingLeft() {
    return defer(() => {
      this.direction = DIRECTION.LEFT;
      return this.walking().pipe(
        tap(() => {
          this.moveLeft();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingRight() {
    return defer(() => {
      this.direction = DIRECTION.RIGHT;
      return this.walking().pipe(
        tap(() => {
          this.moveRight();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingTopLeft() {
    return defer(() => {
      this.direction = DIRECTION.LEFT;
      return this.walking().pipe(
        tap(() => {
          this.moveTopLeft();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingTopRight() {
    return defer(() => {
      this.direction = DIRECTION.RIGHT;
      return this.walking().pipe(
        tap(() => {
          this.moveTopRight();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingBottomLeft() {
    return defer(() => {
      this.direction = DIRECTION.LEFT;
      return this.walking().pipe(
        tap(() => {
          this.moveBottomLeft();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingBottomRight() {
    return defer(() => {
      this.direction = DIRECTION.RIGHT;
      return this.walking().pipe(
        tap(() => {
          this.moveBottomRight();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  randomAction() {
    if (this.isDied$.value === true) {
      return NEVER;
    }
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
  }

  moveRight() {
    this.x += this.speedX;
  }

  moveLeft() {
    this.x -= this.speedX;
  }

  moveUp() {
    this.y -= this.speedY;
  }

  moveDown() {
    this.y += this.speedY;
  }

  moveTopLeft() {
    this.y -= this.speedY;
    this.x -= this.speedX;
  }

  moveBottomLeft() {
    this.y += this.speedY;
    this.x -= this.speedX;
  }

  moveTopRight() {
    this.y -= this.speedY;
    this.x += this.speedX;
  }

  moveBottomRight() {
    this.y += this.speedY;
    this.x += this.speedX;
  }

  cleanup() {
    this.onCleanup$.next();
    this.onCleanup$.complete();
  }

  takeWhileWithInCanvas<T>(): MonoTypeOperatorFunction<T> {
    return takeWhile(() => {
      if (this.x + this.width > this.canvas.width) {
        return false;
      } else if (this.x < 0) {
        return false;
      } else if (this.y + this.height > this.canvas.height) {
        return false;
      } else if (this.y < 0) {
        return false;
      }
      return true;
    });
  }
}
