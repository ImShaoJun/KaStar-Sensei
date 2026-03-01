// 定义牌组：1-9筒 (DOT), 1-9条 (BAM), 中发白 (DRG)
export type TileType = "DOT" | "BAM" | "DRG";

export interface Tile {
  type: TileType;
  value: number; // 1-9; DRG: 1(中), 2(发), 3(白)
  id: string; // 唯一标识，方便前端渲染 (比如 "DOT-5-1" 表示第一张五筒)
}

// 玩家可执行的动作
export type ActionType = 'DISCARD' | 'PONG' | 'MING_KONG' | 'AN_KONG' | 'BU_KONG' | 'HU' | 'PASS';

// 副露类型 (面前的公开组合)
export type MeldType = 'PONG' | 'MING_KONG' | 'AN_KONG' | 'BU_KONG';

// 一组副露
export interface Meld {
  type: MeldType;
  tiles: Tile[];           // 组成牌
  sourceTile?: Tile;       // 触发牌（碰/明杠来自谁打的牌）
  sourcePlayer?: PlayerRole; // 谁打出的触发牌
}

// 等待玩家决策的动作
export interface PendingAction {
  player: PlayerRole;              // 谁有权操作
  availableActions: ActionType[];  // 可执行的动作列表
  triggerTile: Tile;               // 触发这个操作的牌
  triggerPlayer: PlayerRole;       // 打出触发牌的玩家
}

// 游戏阶段
export type GamePhase = 'WAITING' | 'PLAYING' | 'FINISHED';

// 玩家角色
export type PlayerRole = 'opponent1' | 'opponent2' | 'player';

// 单个玩家状态
export interface PlayerState {
  role: PlayerRole;
  name: string;
  hand: Tile[];       // 当前手牌
  discards: Tile[];   // 弃牌堆
  melds: Meld[];      // 已碰/杠的副露
  lastDrawnTileId?: string; // 刚摸到的牌 ID，用于前端高亮
}

// 一次出牌记录
export interface TurnRecord {
  playerRole: PlayerRole;
  drawnTile: Tile | null;
  discardedTile: Tile;
  roundNum: number;
}

// 整局游戏状态
export interface GameState {
  phase: GamePhase;
  players: [PlayerState, PlayerState, PlayerState]; // [opponent1, opponent2, player]
  deck: Tile[];
  currentTurn: PlayerRole;
  roundNum: number;          // 当前巡目（玩家出牌后+1）
  turnHistory: TurnRecord[];
  winner: PlayerRole | null; // null=流局或未结束
  winningHand: Tile[] | null;
  pendingAction: PendingAction | null;  // 当前是否有待决策的碰/杠/胡
  winType: 'ZIMO' | 'DIANPAO' | null;  // 胡牌方式
}
