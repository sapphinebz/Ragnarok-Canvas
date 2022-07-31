import {
  animationFrames,
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
  of,
  OperatorFunction,
  pairwise,
  ReplaySubject,
  startWith,
  Subject,
  switchMap,
  take,
  tap,
  timer,
} from "rxjs";
import {
  concatAll,
  concatMap,
  connect,
  debounce,
  debounceTime,
  distinctUntilChanged,
  endWith,
  filter,
  first,
  mergeAll,
  mergeMap,
  repeat,
  takeUntil,
  takeWhile,
  throttleTime,
} from "rxjs/operators";
import * as Field from "..";
import {
  animateComboDamage,
  animateMissDamage,
  animateReceivedDamage,
  animateRestoreHp,
} from "../gamepad/number-drawer";
import { DropItems, FieldItem } from "../items/Item";
import { Skill, Skills } from "../skills/Skill";
import { loadCriticalAttack } from "../sounds/critical-attack";
import { deltaTime } from "../utils/animation";
import { distanceBetweenTarget } from "../utils/collision";
import {
  BACKGROUND_CASTING_SPELL_COLOR,
  DANGER_HEALTH_GAUGE_COLOR,
  GOOD_HEALTH_GAUGE_COLOR,
  STROKE_GAUGE_COLOR,
} from "../utils/constants";
import { playAudio } from "../utils/play-audio";
import { randomEnd, randomMinMax } from "../utils/random-minmax";
import { repeatUntil } from "../utils/repeat-util";
import { shuffle } from "../utils/shuffle";

export interface MoveLocation {
  x: number;
  y: number;
}

export interface TargetLocation extends MoveLocation {
  width: number;
  height: number;
}

export interface WalkingConfig {
  faceDirection?: DIRECTION;
  moveOption: (delta: number) => MoveLocation;
  stopIfOutOfCanvas?: boolean;
}

export type WalkingStoppable = Pick<WalkingConfig, "stopIfOutOfCanvas">;

export const enum ACTION {
  IDLE,
  RANDOM,
  HURT,
  MOVE_TO_TARGET,
  MOVE_TO_STEAL_ITEM,
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

export interface DrawNumber {
  number: number;
  isCritical: boolean;
  isMiss?: boolean;
  location: MoveLocation;
  scale: number;
}

export type DamageNumber = Pick<DrawNumber, "number" | "isCritical" | "isMiss">;

export const enum DIRECTION {
  LEFT,
  RIGHT,
}

export interface Area extends MoveLocation {
  w: number;
  h: number;
}

export interface DamageArea extends Area {
  skill?: Skills;
}

export type CropImage = {
  order?: number;
  offsetX: number;
  offsetY?: number;
  width: number;
  height?: number;
  marginHeight?: number;
  marginRightHeight?: number;
  marginLeftHeight?: number;
  marginLeftWidth?: number;
  marginRightWidth?: number;
};

export abstract class Monster {
  atk = 1;
  maxHp = 20;
  hp$ = new BehaviorSubject<number>(this.maxHp);
  set hp(value: number) {
    this.hp$.next(value);
  }
  get hp() {
    return this.hp$.value;
  }
  x: number = 0;
  y: number = 0;
  speedX: number = 0;
  speedY: number = 0;
  frameX = 0;
  frameY = 0;
  width: number = 0;
  height: number = 0;

  respawnTimeMin = 5000;
  respawnTimeMax = 20000;

  showHpGauge = false;

  // class item/rate
  dropItems: DropItems = [];

  // damage per second
  dps = 800;
  attackSpeed = 80;

  statusEffect: string[] = [];
  summonBy?: Monster;

  get delayAnimationAttack() {
    const delay = 200 - this.attackSpeed;
    if (delay < 0) {
      return 0;
    }
    return delay;
  }

  set delayAnimationAttack(value: number) {
    this.attackSpeed = 200 - value;
  }

  onCleanup$ = new AsyncSubject<void>();
  onDamageArea$ = new Subject<DamageArea>();
  onReceiveDamage$ = new Subject<DamageNumber>();
  onComboDamage$ = new Subject<number[]>();
  onRestoreHp$ = new Subject<number>();
  onMoving$ = new Subject<MoveLocation>();
  /**
   * just standing and thinking
   */
  onStandingWithAggressiveVision = new Subject<MoveLocation>();
  /**
   * if aggressive true will move to player and attack
   */
  aggressiveTarget$ = new BehaviorSubject<Monster | null>(null);

  targetItem?: FieldItem;
  /**
   * Class Item stolen
   */
  stolenItems: any[] = [];

  /**
   * vision when monster see player and charge with aggressive
   */
  visionRange = 150;

  /**
   * when monster walking to player and this is distance when monster lost tracking
   */
  trackRange = 500;

  /**
   * distance of monster can attack to player
   */
  attackRange = 70;

  /**
   * monster auto aggressive to player if player stay within "visionRange"
   */
  isAggressiveOnVision = false;

  get aggressiveTarget() {
    return this.aggressiveTarget$.value;
  }
  set aggressiveTarget(value: Monster | null) {
    if (value !== this.aggressiveTarget$.value) {
      this.aggressiveTarget$.next(value);
    }
  }

  direction$ = new BehaviorSubject<DIRECTION>(DIRECTION.LEFT);

  set direction(value: DIRECTION) {
    this.direction$.next(value);
  }
  get direction() {
    return this.direction$.value;
  }

  abstract frames: CropImage[][];

  // abstract halfWidth: number;
  // abstract halfHeight: number;

  leftImage$ = new ReplaySubject<HTMLImageElement>(1);
  rightImage$ = new ReplaySubject<HTMLImageElement>(1);

  actionChange$ = new BehaviorSubject<ACTION>(ACTION.IDLE);

  get currentAction() {
    return this.actionChange$.value;
  }

  onDied$ = new AsyncSubject<void>();
  isDied = false;
  /**
   * on this monster need render
   */
  onActionTick$ = new Subject<void>();
  drawBefore$ = new Subject<{ frameX: number; frameY: number }>();
  drawImage$ = new Subject<void>();
  drawAfter$ = new Subject<{ frameX: number; frameY: number }>();

  criticalAttackSound = loadCriticalAttack();
  onPlayCriticalAttack$ = new Subject<void>();
  skills$ = new BehaviorSubject<Skill[]>([]);

  behaviorActions: Observable<any>[] = [];

  receivedDamagesDrawFrames: DrawNumber[] = [];
  comboDamagesDrawFrames: DrawNumber[] = [];
  restoredHpDrawFrames: DrawNumber[] = [];

  get latestDamageReceived() {
    return this.receivedDamagesDrawFrames[this.receiveDamage.length - 1];
  }

  get ctx() {
    return this.canvas.getContext("2d")!;
  }

  constructor(
    public canvas: HTMLCanvasElement,
    public leftImage: HTMLImageElement,
    public rightImage: HTMLImageElement
  ) {
    this.loadSprite(this.leftImage)
      .pipe(takeUntil(this.onCleanup$))
      .subscribe((image) => {
        this.leftImage$.next(image);
      });

    this.loadSprite(this.rightImage)
      .pipe(takeUntil(this.onCleanup$))
      .subscribe((image) => {
        this.rightImage$.next(image);
      });

    this.skills$.pipe(takeUntil(this.onCleanup$)).subscribe((skills) => {
      for (const skill of skills) {
        if (skill.passive) {
          skill.useWith(this);
        }
      }
    });

    this.criticalAttackSound.volume = 0.05;
    this.onPlayCriticalAttack$
      .pipe(
        switchMap(() => playAudio(this.criticalAttackSound)),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    this.onReceiveDamage$
      .pipe(
        mergeMap((damage) => {
          if (damage.isMiss === true) {
            return animateMissDamage(this);
          }
          return animateReceivedDamage(damage, this);
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    this.onComboDamage$
      .pipe(
        switchMap((damages) => {
          let sum = 0;
          return from(damages).pipe(
            concatMap((damage, index) => {
              sum += damage;
              if (index !== damages.length - 1) {
                return animateComboDamage(sum, this).pipe(
                  takeUntil(timer(this.delayAnimationAttack))
                );
              }
              return animateComboDamage(sum, this);
            })
          );
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();

    this.onRestoreHp$
      .pipe(
        mergeMap((restore) => {
          return animateRestoreHp(restore, this);
        }),
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
        } else if (preAction === ACTION.ATTACK && action === ACTION.ATTACK) {
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
              return defer(() => {
                const { distance: checkDistance } = distanceBetweenTarget(
                  target,
                  {
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                  }
                );
                if (checkDistance <= this.attackRange) {
                  return this.standing().pipe(map(() => true));
                }
                return this.walkingToTarget(
                  target,
                  (distance) => distance <= this.attackRange
                );
              }).pipe(
                connect((walking$) => {
                  const nextAttack$ = walking$.pipe(
                    distinctUntilChanged(),
                    switchMap((targetWithInAttackRange) => {
                      if (targetWithInAttackRange) {
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
        } else if (action === ACTION.MOVE_TO_STEAL_ITEM && this.targetItem) {
          const itemLocation = {
            x: this.targetItem.location.x + this.targetItem.item.width / 2,
            y: this.targetItem.location.y + this.targetItem.item.height / 2,
            width: this.targetItem.item.width,
            height: this.targetItem.item.height,
          };
          return this.walkingToTarget(
            itemLocation,
            (distance) => distance <= 1
          ).pipe(
            takeWhile((arrived) => {
              if (arrived && this.targetItem) {
                const ItemClass = this.targetItem.class;
                this.stolenItems.push(ItemClass);
                Field.removeItemFromField(this.targetItem);
                return false;
              }
              return true;
            }),
            tap({
              complete: () => {
                if (preAction === ACTION.MOVE_TO_STEAL_ITEM) {
                  this.actionChange$.next(ACTION.RANDOM);
                } else {
                  this.actionChange$.next(preAction);
                }
              },
            }),
            takeUntil(this.targetItem.item.onCleanUp$)
          );
        } else if (action === ACTION.ATTACK) {
          // For Monster
          if (this.aggressiveTarget !== null) {
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
          }
          // For Player
          const onStopAttack$ = this.actionChange$.pipe(
            filter((action) => action === ACTION.ATTACK),
            debounceTime(400)
          );
          return this.attack().pipe(
            repeatUntil(onStopAttack$),
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
            return from(shuffle(this.behaviorActions)).pipe(concatAll());
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

    action$.pipe(takeUntil(this.onCleanup$)).subscribe(() => {
      this.render();
    });

    this.onDied$
      .pipe(
        switchMap(() =>
          this.dying().pipe(
            tap({
              next: () => {
                this.render();
              },
            })
          )
        )
      )
      .subscribe();

    // Aggressive do damage to target
    this.aggressiveTarget$
      .pipe(
        switchMap((target) => {
          if (target !== null) {
            return this.onDamageArea$.pipe(
              tap(() => {
                this.damageTo(target);
                target.faceTo(this);
                target.animateDieOrHurt();
              }),
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
        if (this.drawBefore$.observed) {
          this.drawBefore$.next({ frameY: this.frameY, frameX: this.frameX });
        }
        const frameXEntry = this.getFrameEntry(this.frameY, this.frameX);
        if (frameXEntry) {
          let {
            offsetX,
            offsetY,
            width,
            height,
            marginHeight,
            marginRightHeight,
            marginLeftHeight,
            marginLeftWidth,
            marginRightWidth,
          } = frameXEntry;

          let image = direction === DIRECTION.RIGHT ? rightImage : leftImage;
          offsetY ??= this.height * this.frameY;
          height ??= this.height;
          marginHeight ??= 0;
          if (marginRightHeight && direction === DIRECTION.RIGHT) {
            marginHeight += marginRightHeight;
          } else if (marginLeftHeight && direction === DIRECTION.LEFT) {
            marginHeight += marginLeftHeight;
          }
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

          if (this.drawAfter$.observed) {
            this.drawAfter$.next({ frameY: this.frameY, frameX: this.frameX });
          }

          // hp Gauge
          if (this.showHpGauge && !this.isDied) {
            const gaugeHpRate = this.hp / this.maxHp;
            this.drawGauge(this.width, STROKE_GAUGE_COLOR);
            if (gaugeHpRate <= 0.2) {
              this.drawGauge(
                this.width * (this.hp / this.maxHp),
                DANGER_HEALTH_GAUGE_COLOR
              );
            } else {
              this.drawGauge(
                this.width * (this.hp / this.maxHp),
                GOOD_HEALTH_GAUGE_COLOR
              );
            }
          }
        }
      });
  }

  abstract drawEffect(): void;

  abstract standing(): Observable<any>;

  abstract walking(): Observable<any>;

  abstract dying(): Observable<any>;

  abstract attack(): Observable<any>;

  abstract hurting(): Observable<any>;

  loadSprite(image: HTMLImageElement) {
    if (image.complete) {
      return of(image);
    } else {
      return fromEvent(image, "load").pipe(
        take(1),
        map(() => image)
      );
    }
  }

  drawImage() {
    this.drawImage$.next();
    if (this.drawEffect) {
      this.drawEffect();
    }
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

  autoStealItemOnField() {
    this.aggressiveTarget$
      .pipe(
        map((monster) => monster !== null),
        distinctUntilChanged(),
        switchMap((isAggressive) => {
          if (isAggressive) {
            return EMPTY;
          }
          return Field.fieldItems.pipe(
            switchMap((fieldItems) => {
              if (fieldItems.length === 0) {
                return EMPTY;
              }
              return timer(0, 500).pipe(
                map(() => {
                  let nearest: FieldItem | null = null;
                  let distance: number = 0;
                  for (const fieldItem of fieldItems) {
                    const { distance: _distance } = distanceBetweenTarget(
                      {
                        x: fieldItem.location.x,
                        y: fieldItem.location.y,
                        width: fieldItem.item.width,
                        height: fieldItem.item.height,
                      },
                      this
                    );
                    if (_distance > this.visionRange) {
                      continue;
                    } else if (!nearest || _distance < distance) {
                      nearest = fieldItem;
                      distance = _distance;
                      continue;
                    }
                  }
                  return nearest;
                }),
                first(
                  (fieldItem): fieldItem is FieldItem => fieldItem !== null
                ),
                tap((fieldItem) => {
                  this.targetItem = fieldItem;
                  this.actionChange$.next(ACTION.MOVE_TO_STEAL_ITEM);
                })
              );
            })
          );
        }),
        takeUntil(this.onCleanup$)
      )
      .subscribe();
  }

  autoAggressiveOnVisionTarget(target$: Observable<Monster>) {
    if (this.isAggressiveOnVision) {
      const onTargetsMoving$ = target$.pipe(
        map((target) =>
          target.onMoving$.pipe(
            startWith(0),
            map(() => {
              return target;
            }),
            takeUntil(target.onDied$)
          )
        ),
        mergeAll()
      );
      const onSelfMoving$ = merge(
        this.onMoving$,
        this.onStandingWithAggressiveVision
      ).pipe(
        startWith(0),
        map(() => {
          return this as Monster;
        })
      );
      combineLatest({ target: onTargetsMoving$, self: onSelfMoving$ })
        .pipe(
          throttleTime(500),
          map(({ target, self }) => {
            const { distance } = distanceBetweenTarget(target, self);
            if (this.aggressiveTarget !== null && distance <= this.trackRange) {
              return target;
            } else if (
              this.aggressiveTarget === null &&
              distance <= this.visionRange
            ) {
              return target;
            }
            return null;
          }),
          distinctUntilChanged(),
          takeUntil(this.onDied$)
        )
        .subscribe((aggressiveTarget) => {
          if (aggressiveTarget !== null && !aggressiveTarget.isDied) {
            this.aggressiveTarget = aggressiveTarget;
            this.actionChange$.next(ACTION.MOVE_TO_TARGET);
          } else {
            this.aggressiveTarget = null;
            this.actionChange$.next(ACTION.RANDOM);
          }
        });
    }
  }

  forwardFrameX(
    delay: number,
    minFrameX: number,
    maxFrameX: number,
    option: { once: boolean } = { once: false }
  ) {
    this.frameX = minFrameX;
    return this.timelineFrames(delay, minFrameX, maxFrameX, option).pipe(
      tap((nextFrame) => {
        this.frameX = nextFrame;
      })
    );
  }

  timelineFrames(
    delay: number,
    minFrameX: number,
    maxFrameX: number,
    option: { once: boolean } = { once: false }
  ) {
    const { once } = option;
    let currentFrameX = minFrameX;
    return interval(delay).pipe(
      map(() => currentFrameX + 1),
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
        currentFrameX = nextFrame;
      }),
      startWith(currentFrameX)
    );
  }

  /**
   * for test only
   */
  testArea(area: Area) {
    this.ctx.beginPath();
    this.ctx.fillStyle = "red";
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

  walkingToTarget(
    target: TargetLocation,
    predicate: (distance: number) => boolean
  ) {
    return defer(() => {
      return merge(this.walking().pipe(ignoreElements()), deltaTime()).pipe(
        map((delta) => {
          const currentMoveLocation = { x: this.x, y: this.y };
          let moveNextLocation = { ...currentMoveLocation };

          let targetIsLeftSide =
            target.x + target.width / 2 < this.x + this.width / 2;
          let targetIsTopSide =
            target.y + target.height / 2 < this.y + this.height / 2;

          if (targetIsLeftSide) {
            moveNextLocation.x -= this.speedX * delta;
          } else {
            moveNextLocation.x += this.speedX * delta;
          }

          if (targetIsTopSide) {
            moveNextLocation.y -= this.speedY * delta;
          } else {
            moveNextLocation.y += this.speedY * delta;
          }

          if (targetIsLeftSide) {
            this.direction = DIRECTION.LEFT;
          } else {
            this.direction = DIRECTION.RIGHT;
          }

          // const targetX = target.x + target.width / 2;
          // const targetY = target.y + target.height / 2;

          // const sourceX = moveNextLocation.x + this.width / 2;
          // const sourceY = moveNextLocation.y + this.height / 2;

          // const distance = distanceBetween(
          //   { x: targetX, y: targetY },
          //   { x: sourceX, y: sourceY }
          // );

          const { targetX, targetY, sourceX, sourceY, distance } =
            distanceBetweenTarget(target, {
              x: moveNextLocation.x,
              y: moveNextLocation.y,
              width: this.width,
              height: this.height,
            });
          if (predicate(distance)) {
            this.x = moveNextLocation.x;
            this.y = moveNextLocation.y;
            return true;
          }

          // if next step less than speed
          // will next step with remaining distance

          const distanceY = targetY - sourceY;

          if (Math.abs(distanceY) <= this.speedY * delta) {
            this.y = this.y + distanceY;
          } else {
            this.y = moveNextLocation.y;
          }

          const distanceX = targetX - sourceX;

          if (Math.abs(distanceX) <= this.speedX * delta) {
            this.x = this.x + distanceX;
          } else {
            this.x = moveNextLocation.x;
          }

          this.onMoving$.next(moveNextLocation);

          return false;
        })
      );
    });
  }

  /**
   * behaviors walking
   * and random duration time
   * @param min min behavior duration
   * @param max max behavior duration
   * @returns any direction animation walking
   */
  walkingsAnyDirection(min: number, max: number) {
    return [
      this.walkingRight().pipe(randomEnd(min, max)),
      this.walkingLeft().pipe(randomEnd(min, max)),
      this.walkingUp().pipe(randomEnd(min, max)),
      this.walkingDown().pipe(randomEnd(min, max)),
      this.walkingTopLeft().pipe(randomEnd(min, max)),
      this.walkingTopRight().pipe(randomEnd(min, max)),
      this.walkingBottomLeft().pipe(randomEnd(min, max)),
      this.walkingBottomRight().pipe(randomEnd(min, max)),
    ];
  }
  /**
   * behaviors standing
   * and random duration time
   * @param min min behavior duration
   * @param max max behavior duration
   * @returns animation standing
   */
  standingDuration(min: number, max: number) {
    return this.standing().pipe(
      this.emitStandingAggressive(),
      randomEnd(min, max)
    );
  }

  walkingDown(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.LEFT,
      moveOption: (delta: number) => this.moveDown(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingUp(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.RIGHT,
      moveOption: (delta: number) => this.moveUp(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingLeft(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.LEFT,
      moveOption: (delta: number) => this.moveLeft(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingRight(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.RIGHT,
      moveOption: (delta: number) => this.moveRight(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingTopLeft(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.LEFT,
      moveOption: (delta: number) => this.moveTopLeft(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingTopRight(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.RIGHT,
      moveOption: (delta: number) => this.moveTopRight(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingBottomLeft(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.LEFT,
      moveOption: (delta: number) => this.moveBottomLeft(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  walkingBottomRight(config: WalkingStoppable = { stopIfOutOfCanvas: true }) {
    return this.walkingDirection({
      faceDirection: DIRECTION.RIGHT,
      moveOption: (delta: number) => this.moveBottomRight(delta),
      stopIfOutOfCanvas: config.stopIfOutOfCanvas,
    });
  }

  randomAction() {
    this.actionChange$.next(ACTION.RANDOM);
  }

  moveRight(delta: number) {
    return { x: this.x + this.speedX * delta, y: this.y };
  }

  moveLeft(delta: number) {
    return { x: this.x - this.speedX * delta, y: this.y };
  }

  moveUp(delta: number) {
    return { x: this.x, y: this.y - this.speedY * delta };
  }

  moveDown(delta: number) {
    return { x: this.x, y: this.y + this.speedY * delta };
  }

  moveTopLeft(delta: number) {
    return { x: this.x - this.speedX * delta, y: this.y - this.speedY * delta };
  }

  moveBottomLeft(delta: number) {
    return { x: this.x - this.speedX * delta, y: this.y + this.speedY * delta };
  }

  moveTopRight(delta: number) {
    return { x: this.x + this.speedX * delta, y: this.y - this.speedY * delta };
  }

  moveBottomRight(delta: number) {
    return { x: this.x + this.speedX * delta, y: this.y + this.speedY * delta };
  }

  cleanup() {
    this.onCleanup$.next();
    this.onCleanup$.complete();
  }

  receiveDamage(damage: DamageNumber) {
    this.onReceiveDamage$.next(damage);
    if (damage.number >= 0) {
      this.hp -= damage.number;
      if (this.hp < 0) {
        this.hp = 0;
      }
    }
  }

  damageTo(monster: Monster, skill?: Skills) {
    const randomMissNumber = randomMinMax(0, 100);
    const missRate = 2;
    if (randomMissNumber <= missRate) {
      monster.receiveDamage({
        number: 0,
        isCritical: false,
        isMiss: true,
      });
    } else {
      const randomCriticalNumber = randomMinMax(0, 100);
      const criticalRate = 5;

      const inconstantDamageRate = (100 + randomMinMax(0, -25)) / 100;
      let damage = this.atk;
      let isCritical = false;

      if (randomCriticalNumber <= criticalRate) {
        monster.playCriticalAudio();
        damage += damage;
        isCritical = true;
      } else {
        damage = Math.round(this.atk * inconstantDamageRate);
      }

      if (skill === "DoubleAttack") {
        if (monster.receivedDamagesDrawFrames.length > 0) {
          const previousDamaged =
            monster.receivedDamagesDrawFrames[
              monster.receivedDamagesDrawFrames.length - 1
            ];
          monster.onComboDamage$.next([previousDamaged.number, damage]);
        }
      }

      monster.receiveDamage({ number: damage, isCritical, isMiss: false });
    }
  }

  aggressiveWith(monster: Monster) {
    monster.aggressiveTarget = this;
    monster.actionChange$.next(ACTION.MOVE_TO_TARGET);
  }

  faceTo(monster: Monster) {
    if (this.currentAction !== ACTION.ATTACK) {
      if (this.x + this.width / 2 > monster.x + monster.width / 2) {
        this.direction = DIRECTION.LEFT;
      } else {
        this.direction = DIRECTION.RIGHT;
      }
    }
  }

  animateDieOrHurt() {
    if (this.hp <= 0) {
      this.die();
      return true;
    } else if (Boolean(this.latestDamageReceived.isMiss) === false) {
      this.hurt();
    }
    return false;
  }

  moveLocationOnAttack(option: {
    moveY?: number;
    moveX?: number;
    maxLocationOnFrame: number;
  }): MonoTypeOperatorFunction<number> {
    const locationBeforeAttack = { x: this.x, y: this.y };
    const rateAsFrameX = (frameX: number) => {
      const percentPerFrameX = 100 / (option.maxLocationOnFrame + 1);
      let calPercent = 0;
      if (frameX + 1 <= option.maxLocationOnFrame) {
        calPercent = percentPerFrameX * (frameX + 1);
      } else {
        calPercent =
          -percentPerFrameX * (frameX - option.maxLocationOnFrame + 1) + 100;
      }

      const rate = calPercent / 100;
      return rate;
    };
    const directionX = this.direction === DIRECTION.LEFT ? -1 : 1;
    let directionY = directionX;
    if (this.aggressiveTarget !== null) {
      if (this.aggressiveTarget.y > this.y) {
        directionY = 1;
      } else {
        directionY = -1;
      }
    }

    return tap((frameX) => {
      const percent = rateAsFrameX(frameX);

      if (option.moveX) {
        this.x =
          locationBeforeAttack.x + (option.moveX / 2) * percent * directionX;
      }
      if (option.moveY) {
        this.y =
          locationBeforeAttack.y + (option.moveY / 2) * percent * directionY;
      }
      if (frameX === 4) {
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
    });
  }

  drawCropImage(
    image: HTMLImageElement,
    cropImage: CropImage,
    option: { x?: number; y?: number } = {}
  ) {
    let marginWidth =
      this.direction === DIRECTION.LEFT
        ? cropImage.marginLeftWidth
        : cropImage.marginRightWidth;
    let marginHeight =
      this.direction === DIRECTION.LEFT
        ? cropImage.marginLeftHeight
        : cropImage.marginRightHeight;

    const { x: dx, y: dy } = option;

    let offsetX = cropImage.offsetX;

    this.ctx.drawImage(
      image,
      offsetX,
      cropImage.offsetY ?? 0,
      cropImage.width,
      cropImage.height ?? 0,
      this.x + (dx ?? 0) + (marginWidth ?? 0),
      this.y + (dy ?? 0) + (marginHeight ?? 0),
      cropImage.width,
      cropImage.height ?? 0
    );
  }

  drawCropImageX(
    image: HTMLImageElement,
    cropImage: CropImage,
    option: { x?: number; y?: number } = {}
  ) {
    let marginWidth = 0;
    let marginHeight = 0;
    let offsetX = cropImage.offsetX;
    if (this.direction === DIRECTION.LEFT) {
      marginWidth = cropImage.marginLeftWidth ?? 0;
      marginHeight = cropImage.marginLeftHeight ?? 0;
      offsetX = cropImage.offsetX;
    } else if (this.direction === DIRECTION.RIGHT) {
      marginWidth = cropImage.marginRightWidth ?? 0;
      marginHeight = cropImage.marginRightHeight ?? 0;
      offsetX = image.width - (offsetX + cropImage.width);
    }

    const { x: dx, y: dy } = option;

    this.ctx.drawImage(
      image,
      offsetX,
      cropImage.offsetY ?? 0,
      cropImage.width,
      cropImage.height ?? 0,
      this.x + (dx ?? 0) + marginWidth,
      this.y + (dy ?? 0) + marginHeight,
      cropImage.width,
      cropImage.height ?? 0
    );
  }

  drawCropImageAtFrame(config: {
    frameX: number;
    frameY: number;
    frames: (CropImage | null)[][];
    imageLeft: HTMLImageElement;
    imageRight: HTMLImageElement;
  }) {
    const { imageLeft, imageRight, frames, frameX, frameY } = config;

    if (frames[frameY] && frames[frameY][frameX]) {
      const image = this.direction === DIRECTION.LEFT ? imageLeft : imageRight;

      this.drawCropImageX(image, frames[frameY][frameX]!);
    }
  }

  tween(duration: number, nextEffect: MonoTypeOperatorFunction<number>) {
    return animationFrames().pipe(
      map((event) => event.elapsed / duration),
      takeWhile((t) => t < 1),
      endWith(1),
      nextEffect,
      tap(() => {
        this.render();
      })
    );
  }

  onDieChangeValueEffect(option: {
    init: () => number;
    targetValue: number;
    updated: (value: number) => void;
  }) {
    const { init, targetValue, updated } = option;
    return this.onDied$.pipe(
      switchMap(() => {
        const currentLocation = init();
        return this.tween(
          250,
          tap((t) => {
            const newLocation =
              currentLocation + (targetValue - currentLocation) * t;
            updated(newLocation);
          })
        );
      })
    );
  }

  initSkill(skills: Skill[]) {
    this.skills$.next(skills);
  }

  /**
   * for Skill Behavior
   */
  whenHp(
    hpPredicate: (hp: number) => boolean,
    doEffect: OperatorFunction<any, any>,
    cooldownCondition?: OperatorFunction<any, any>
  ) {
    return this.hp$.pipe(
      filter((hp) => hpPredicate(hp)),
      take(1),
      doEffect,
      (observable) => {
        if (cooldownCondition) {
          return observable.pipe(cooldownCondition);
        }
        return observable;
      },
      takeUntil(this.onDied$)
    );
  }

  /**
   * for Skill Behavior
   */
  whenAggressiveAndHp(
    hpPredicate: (hp: number) => boolean,
    doEffect: OperatorFunction<any, any>,
    canUseAgainCondition?: OperatorFunction<any, any>
  ) {
    const whenAggressive$ = this.aggressiveTarget$.pipe(
      filter((target) => target !== null)
    );

    const hpBelow$ = this.hp$.pipe(filter((hp) => hpPredicate(hp)));

    return whenAggressive$.pipe(
      take(1),
      debounce(() => hpBelow$),
      doEffect,
      (observable) => {
        if (canUseAgainCondition) {
          return observable.pipe(canUseAgainCondition);
        }
        return observable;
      },
      takeUntil(this.onDied$)
    );
  }

  /**
   * for Skill Behavior
   */
  canUseAgainAfter(duration: number): OperatorFunction<any, any> {
    return repeat({ delay: () => timer(duration) });
  }

  render() {
    this.onActionTick$.next();
  }

  restoreHp(value: number) {
    const hpBefore = this.hp;
    let hp = this.hp + value;

    if (hp > this.maxHp) {
      this.hp = this.maxHp;
    } else {
      this.hp = hp;
    }

    this.onRestoreHp$.next(Math.round(this.hp - hpBefore));
  }

  private playCriticalAudio() {
    this.onPlayCriticalAttack$.next();
  }

  private emitStandingAggressive<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) => {
      if (this.isAggressiveOnVision) {
        return source.pipe(
          tap(() => {
            this.onStandingWithAggressiveVision.next({ x: this.x, y: this.y });
          })
        );
      }
      return source;
    };
  }

  private updateMove(): MonoTypeOperatorFunction<MoveLocation> {
    return tap((moveLocation) => {
      this.x = moveLocation.x;
      this.y = moveLocation.y;
      this.onMoving$.next(moveLocation);
    });
  }

  public drawGauge(value: number, color: string) {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.rect(this.x, this.y + this.height + 5, value, 5);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.strokeStyle = STROKE_GAUGE_COLOR;
    this.ctx.strokeRect(this.x, this.y + this.height + 5, value, 5);
    this.ctx.fill();
  }

  public drawCastingSpell(spellName: string, rate: number) {
    this.drawSpellName(spellName);

    this.drawCastingSpellGauge(this.width, STROKE_GAUGE_COLOR);
    this.drawCastingSpellGauge(this.width * rate, GOOD_HEALTH_GAUGE_COLOR);
  }

  private drawSpellName(spellName: string) {
    this.ctx.beginPath();
    this.ctx.fillStyle = BACKGROUND_CASTING_SPELL_COLOR;
    this.ctx.rect(this.x, this.y - 27, this.width, 19);
    this.ctx.fill();

    this.ctx.textAlign = "center";
    this.ctx.font = "normal 12px Tahoma";
    this.ctx.fillStyle = "white";
    this.ctx.fillText(`${spellName} !!`, this.x + this.width / 2, this.y - 13);
  }

  private drawCastingSpellGauge(value: number, color: string) {
    const yPosition = this.y - 7;
    const gaugeHeight = 6;
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.rect(this.x, yPosition, value, gaugeHeight);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.strokeStyle = STROKE_GAUGE_COLOR;
    this.ctx.strokeRect(this.x, yPosition, value, gaugeHeight);
    this.ctx.fill();
  }

  private walkingDirection(option: WalkingConfig) {
    const { faceDirection, stopIfOutOfCanvas = true, moveOption } = option;

    return defer(() => {
      if (faceDirection !== undefined) {
        this.direction = faceDirection;
      }
      return merge(this.walking().pipe(ignoreElements()), deltaTime()).pipe(
        map((delta) => moveOption(delta)),
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

  private getFrameEntry(frameY: number, frameX: number) {
    return this.frames[frameY][frameX];
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
