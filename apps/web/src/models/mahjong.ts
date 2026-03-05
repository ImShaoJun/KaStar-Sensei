// 定义牌组：1-9筒 (DOT), 1-9条 (BAM), 中发白 (DRG)
export type TileType = "DOT" | "BAM" | "DRG";

export interface Tile {
  type: TileType;
  value: number; // 1-9; DRG: 1(中), 2(发), 3(白)
  id: string; // 唯一标识，方便前端渲染 (比如 "DOT-5-1" 表示第一张五筒)
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
}
