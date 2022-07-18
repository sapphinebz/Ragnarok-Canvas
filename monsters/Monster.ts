import {
  AsyncSubject,
  BehaviorSubject,
  combineLatest,
  defer,
  EMPTY,
  from,
  fromEvent,
  ignoreElements,
  interval,
  map,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  OperatorFunction,
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
  connect,
  distinctUntilChanged,
  filter,
  mergeAll,
  repeat,
  takeUntil,
  takeWhile,
} from 'rxjs/operators';
import { loadCriticalAttack } from '../sounds/critical-attack';
import { distanceBetween } from '../utils/collision';
import { playAudio } from '../utils/play-audio';
import { randomMinMax } from '../utils/random-minmax';
import { shuffle } from '../utils/shuffle';

export interface MoveLocation {
  x: number;
  y: number;
}

export interface WalkingConfig {
  faceDirection?: DIRECTION;
  moveOption: () => MoveLocation;
  stopIfOutOfCanvas?: boolean;
}

export type WalkingStoppable = Pick<WalkingConfig, 'stopIfOutOfCanvas'>;

export const enum ACTION {
  IDLE,
  RANDOM,
  HURT,
  MOVE_TO_TARGET,
  ATTACK,
  STANDING,
  WALKING_LEFT,
  WALKING_RIGHT,
  WALKING_UP,
  WALKING_DOWN,
  WALKING_TOP_RIGHT,
  WALKING_TOP_LEFT,
  WALKING_BOTTOM_RIGHT,
  WALKING_BOTTOM_LEFT,
}

export const enum DIRECTION {
  LEFT,
  RIGHT,
}

export interface Area extends MoveLocation {
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
  // damage per second
  dps = 800;
  attackSpeed = 120;

  onCleanup$ = new ReplaySubject<void>(1);
  onDamageArea$ = new Subject<Area>();
  onMoving$ = new Subject<MoveLocation>();
  /**
   * if aggressive true will move to player and attack
   */
  aggressiveTarget$ = new BehaviorSubject<Monster | null>(null);
  visionRange = 150;
  attackRange = 70;
  isAggressiveOnVision = false;

  get aggressiveTarget() {
    return this.aggressiveTarget$.value;
  }
  set aggressiveTarget(value: Monster | null) {
    this.aggressiveTarget$.next(value);
  }

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

    const action$ = this.actionChange$.pipe(
      pairwise(),
      filter(([preAction, action]) => {
        if (preAction === ACTION.ATTACK && action === ACTION.HURT) {
          return false;
        } else if (preAction === ACTION.HURT && action === ACTION.HURT) {
          return false;
        }
        return true;
      }),
      switchMap(([preAction, action]) => {
        if (action === ACTION.STANDING) {
          return this.standing();
        } else if (action === ACTION.IDLE) {
          return EMPTY;
        } else if (action === ACTION.WALKING_LEFT) {
          return this.walkingLeft({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_RIGHT) {
          return this.walkingRight({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_UP) {
          return this.walkingUp({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_DOWN) {
          return this.walkingDown({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_TOP_RIGHT) {
          return this.walkingTopRight({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_TOP_LEFT) {
          return this.walkingTopLeft({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_BOTTOM_RIGHT) {
          return this.walkingBottomRight({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.WALKING_BOTTOM_LEFT) {
          return this.walkingBottomLeft({ stopIfOutOfCanvas: false });
        } else if (action === ACTION.MOVE_TO_TARGET) {
          return this.aggressiveTarget$.pipe(
            switchMap((target) => {
              if (target === null || target.isDied) {
                this.actionChange$.next(ACTION.RANDOM);
                return EMPTY;
              }
              return this.walkingToTarget(target).pipe(
                connect((walking$) => {
                  const nextAttack$ = walking$.pipe(
                    distinctUntilChanged(),
                    switchMap((isCloseTarget) => {
                      if (isCloseTarget) {
                        return timer(this.dps).pipe(
                          tap(() => {
                            if (this.aggressiveTarget !== null) {
                              this.actionChange$.next(ACTION.ATTACK);
                            }
                          })
                        );
                      }
                      return EMPTY;
                    })
                  );
                  return merge(walking$, nextAttack$.pipe(ignoreElements()));
                }),
                takeUntil(
                  target.onDied$.pipe(
                    tap(() => {
                      this.aggressiveTarget$.next(null);
                      this.actionChange$.next(ACTION.RANDOM);
                    })
                  )
                )
              );
            })
          );
        } else if (action === ACTION.ATTACK) {
          return this.attack().pipe(
            tap({
              complete: () => {
                if (this.aggressiveTarget !== null) {
                  this.actionChange$.next(ACTION.MOVE_TO_TARGET);
                } else {
                  this.actionChange$.next(ACTION.STANDING);
                }
              },
            })
          );
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
        } else if (action === ACTION.HURT) {
          return this.hurting().pipe(
            tap({
              complete: () => {
                this.actionChange$.next(preAction);
              },
            })
          );
        }
        return EMPTY;
      }),
      takeUntil(this.onDied$)
    );

    const dieAnimation$ = this.onDied$.pipe(
      switchMap(() => this.dying()),
      takeUntil(this.onCleanup$)
    );

    merge(action$, dieAnimation$)
      .pipe(takeUntil(this.onCleanup$))
      .subscribe(() => this.onActionTick$.next());

    // Aggressive do damage to target
    this.aggressiveTarget$
      .pipe(
        switchMap((target) => {
          if (target !== null) {
            return this.onDamageArea$.pipe(
              map(() => [target]),
              this.decreaseTargetsHp(),
              this.forceTargetsFaceToMe(),
              this.targetsBeHurtOrDie(),
              takeUntil(target.onDied$)
            );
          }
          return EMPTY;
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

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

  autoAggressiveOnVisionTarget(target$: Observable<Monster>) {
    if (this.isAggressiveOnVision) {
      const onTargetsMoving$ = target$.pipe(
        map((target) =>
          target.onMoving$.pipe(
            startWith(0),
            map(() => {
              return target;
            })
          )
        ),
        mergeAll()
      );
      const onSelfMoving$ = this.onMoving$.pipe(
        startWith(0),
        map(() => {
          return this as Monster;
        })
      );
      combineLatest({ target: onTargetsMoving$, self: onSelfMoving$ })
        .pipe(
          map(({ target, self }) => {
            const distance = distanceBetween(target, self);
            if (distance <= this.visionRange) {
              return target;
            }
            return null;
          }),
          distinctUntilChanged(),
          takeUntil(this.onDied$),
          takeUntil(this.onCleanup$)
        )
        .subscribe((aggressiveTarget) => {
          this.aggressiveTarget = aggressiveTarget;

          if (aggressiveTarget !== null) {
            this.actionChange$.next(ACTION.MOVE_TO_TARGET);
          } else {
            this.actionChange$.next(ACTION.RANDOM);
          }
        });
    }
  }

  createForwardFrame(
    delay: number,
    minFrameX: number,
    maxFrameX: number,
    option: { once: boolean } = { once: false }
  ) {
    this.frameX = minFrameX;
    const { once } = option;
    return interval(delay).pipe(
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
    return interval(delay).pipe(
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
    this.isDied = true;
    this.onDied$.next();
    this.onDied$.complete();
  }

  hurt() {
    this.actionChange$.next(ACTION.HURT);
  }

  walkingToTarget(target: Monster) {
    return defer(() => {
      return this.walking().pipe(
        map(() => {
          const currentMoveLocation = { x: this.x, y: this.y };
          let moveNextLocation = { ...currentMoveLocation };

          let targetIsLeftSide = target.x < this.x;
          let targetIsTopSide = target.y < this.y;

          if (targetIsLeftSide) {
            moveNextLocation.x -= this.speedX;
          } else {
            moveNextLocation.x += this.speedX;
          }

          if (targetIsTopSide) {
            moveNextLocation.y -= this.speedY;
          } else {
            moveNextLocation.y += this.speedY;
          }

          if (targetIsLeftSide) {
            this.direction = DIRECTION.LEFT;
          } else {
            this.direction = DIRECTION.RIGHT;
          }

          const targetX = target.x + target.width / 2;
          const targetY = target.y + target.height / 2;

          const sourceX = moveNextLocation.x + this.width / 2;
          const sourceY = moveNextLocation.y + this.height / 2;

          const distance = distanceBetween(
            { x: targetX, y: targetY },
            { x: sourceX, y: sourceY }
          );
          if (distance <= this.attackRange) {
            return true;
          }

          this.x = moveNextLocation.x;
          this.y = moveNextLocation.y;
          this.onMoving$.next(moveNextLocation);

          return false;
        })
      );
    });
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

  damageTo(monster: Monster) {
    const randomNumber = randomMinMax(0, 100);
    const criticalRate = 10;
    let damage = this.atk;
    if (randomNumber <= criticalRate) {
      monster.playCriticalAudio();
      damage += damage;
    }

    monster.hp -= damage;
    if (monster.hp < 0) {
      monster.hp = 0;
    }
  }

  aggressiveMonsters(): MonoTypeOperatorFunction<Monster[]> {
    return tap((monsters) => {
      for (const monster of monsters) {
        monster.aggressiveTarget = this;
        monster.actionChange$.next(ACTION.MOVE_TO_TARGET);
      }
    });
  }

  targetsBeHurtOrDie(): OperatorFunction<Monster[], any> {
    return tap((monsters) => {
      for (const monster of monsters) {
        if (monster.hp <= 0) {
          monster.die();
        } else {
          monster.hurt();
        }
      }
    });
  }

  decreaseTargetsHp(): OperatorFunction<Monster[], Monster[]> {
    return tap((monsters) => {
      for (const monster of monsters) {
        this.damageTo(monster);
      }
    });
  }

  forceTargetsFaceToMe(): OperatorFunction<Monster[], Monster[]> {
    return tap((monsters) => {
      for (const monster of monsters) {
        if (monster.x > this.x) {
          monster.direction = DIRECTION.LEFT;
        } else if (monster.x < this.x) {
          monster.direction = DIRECTION.RIGHT;
        }
      }
    });
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
      if (faceDirection !== undefined) {
        this.direction = faceDirection;
      }
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
