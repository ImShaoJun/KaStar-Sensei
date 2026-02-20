// 定义牌组：1-9筒 (DOT), 1-9条 (BAM), 中发白 (DRG)
export type TileType = "DOT" | "BAM" | "DRG";

export interface Tile {
  type: TileType;
  value: number; // 1-9; DRG: 1(中), 2(发), 3(白)
  id: string; // 唯一标识，方便前端渲染 (比如 "DOT-5-1" 表示第一张五筒)
}

// 玩家可选的操作动作
export type ActionType = "DISCARD" | "PUNG" | "KONG" | "LIANG_DAO" | "HU";

export interface TrainingSession {
  hand: Tile[]; // 当前手牌
  discarded: Tile[]; // 玩家打出的牌
  isLiangDao: boolean; // 玩家是否处于“亮倒”状态
  availableActions: ActionType[]; // 玩家当前可执行的合法动作

  // 引擎计算出的最优决策
  recommendedAction: ActionType;
  recommendedTile?: Tile; // 如果是 DISCARD，推荐打哪张

  shanten: number; // 向听数 (当前距离胡牌还差几张)
  responseTime: number; // 玩家思考耗时 (ms)

  // 卡五星专属判定标识
  hasKaWuXingPotential: boolean; // 是否具备“卡五星”潜力
  canLiangDao: boolean; // 当前是否满足“亮倒”条件（需达到听牌状态 shanten === 0）
}
