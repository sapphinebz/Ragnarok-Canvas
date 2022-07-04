import {
  animationFrameScheduler,
  BehaviorSubject,
  defer,
  EMPTY,
  first,
  from,
  fromEvent,
  interval,
  map,
  MonoTypeOperatorFunction,
  NEVER,
  Observable,
  ReplaySubject,
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
import { shuffle } from '../utils/shuffle';

// [order, offsetX, width, offsetY, height]
export type CropImage = {
  order: number;
  offsetX: number;
  offsetY?: number;
  width: number;
  height?: number;
  marginHeight?: number;
  marginWidth?: number;
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
  get isDie() {
    return this.isDied$.value;
  }
  set isDie(value: boolean) {
    this.isDied$.next(value);
  }
  onDied$ = this.isDied$.pipe(filter((isDied) => isDied === true));
  image$ = new ReplaySubject<HTMLImageElement>(1);

  get ctx() {
    return this.canvas.getContext('2d');
  }

  constructor(public canvas: HTMLCanvasElement, public src: string) {
    const image = new Image();
    image.src = src;
    fromEvent(image, 'load')
      .pipe(map(() => image))
      .pipe(take(1))
      .subscribe((value) => {
        this.image$.next(value);
      });
  }

  abstract getFrameEntry(frameY: number, frameX: number): CropImage;

  drawImage() {
    this.image$.pipe(first()).subscribe((image) => {
      const frameXEntry = this.getFrameEntry(this.frameY, this.frameX);
      if (frameXEntry) {
        let { offsetX, offsetY, width, height, marginHeight, marginWidth } =
          frameXEntry;
        offsetY ??= this.height * this.frameY;
        height ??= this.height;
        marginHeight ??= 0;
        marginWidth ??= 0;
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

  randomSpawn(): void;
  randomSpawn(config?: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  }): void {
    if (config === undefined) {
      this.x = Math.random() * this.canvas.width - this.width;
      this.y = Math.random() * this.canvas.height - this.height;
    } else {
      const { minWidth, maxWidth, minHeight, maxHeight } = config;
      this.x = Math.random() * maxWidth + minWidth;
      this.y = Math.random() * maxHeight + minHeight;
    }
  }

  abstract standing(): Observable<any>;

  abstract walking(): Observable<any>;

  abstract dying(): Observable<any>;

  abstract attack(): Observable<any>;

  createForwardFrame(delay: number, minFrameX: number, maxFrameX: number) {
    this.frameX = minFrameX;
    return interval(delay, animationFrameScheduler).pipe(
      map(() => {
        if (this.frameX + 1 <= maxFrameX) {
          this.frameX++;
        } else {
          this.frameX = minFrameX;
        }
        return this.frameX;
      })
    );
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
      if (this.canvas.height - this.y <= 80) {
        return EMPTY;
      }
      return this.walking().pipe(
        tap(() => {
          this.moveDown();
        }),
        this.takeWhileWithInCanvas()
      );
    });
  }

  walkingUp() {
    if (this.y <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveUp();
      }),
      this.takeWhileWithInCanvas()
    );
  }

  walkingLeft() {
    if (this.x <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveLeft();
      }),
      this.takeWhileWithInCanvas()
    );
  }

  walkingRight() {
    if (this.canvas.width - this.x <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveRight();
      }),
      this.takeWhileWithInCanvas()
    );
  }

  walkingTopLeft() {
    if (this.y <= 80 || this.x <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveTopLeft();
      }),
      this.takeWhileWithInCanvas()
    );
  }

  walkingTopRight() {
    if (this.y <= 80 || this.canvas.width - this.x <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveTopRight();
      }),
      this.takeWhileWithInCanvas()
    );
  }

  walkingBottomLeft() {
    if (this.canvas.height - this.y <= 80 || this.x <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveBottomLeft();
      }),
      this.takeWhileWithInCanvas()
    );
  }

  walkingBottomRight() {
    if (this.canvas.height - this.y <= 80 || this.canvas.width - this.x <= 80) {
      return EMPTY;
    }
    return this.walking().pipe(
      tap(() => {
        this.moveBottomRight();
      }),
      this.takeWhileWithInCanvas()
    );
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
    this.y -= this.speedY;
    this.x += this.speedX;
  }

  moveTopRight() {
    this.y += this.speedY;
    this.x -= this.speedX;
  }

  moveBottomRight() {
    this.y += this.speedY;
    this.x += this.speedX;
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
