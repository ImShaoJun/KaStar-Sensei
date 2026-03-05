import { Tile, TileType, GameState, PlayerRole, PlayerState } from '../models/mahjong';

// ─── 牌库生成与洗牌 ─────────────────────────────────

// 生成 1 副卡五星麻将牌库 (84张)
export function generateKaWuXingDeck(): Tile[] {
  const deck: Tile[] = [];
  const suits: TileType[] = ['DOT', 'BAM'];

  // 筒子和条子 (1-9，每种 4 张)
  suits.forEach(suit => {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        deck.push({ type: suit, value, id: `${suit}-${value}-${i}` });
      }
    }
  });

  // 中(1)、发(2)、白(3)，每种 4 张
  for (let value = 1; value <= 3; value++) {
    for (let i = 0; i < 4; i++) {
      deck.push({ type: 'DRG', value, id: `DRG-${value}-${i}` });
    }
  }

  return deck;
}

// Fisher-Yates 洗牌
export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 手牌排序：筒 -> 条 -> 中发白，按点数从小到大
export function sortHand(hand: Tile[]): Tile[] {
  const typeOrder = { 'DOT': 1, 'BAM': 2, 'DRG': 3 };
  return [...hand].sort((a, b) => {
    if (a.type !== b.type) return typeOrder[a.type] - typeOrder[b.type];
    return a.value - b.value;
  });
}

// ─── 卡五星潜力检测 ─────────────────────────────────

export function checkKaWuXingPotential(hand: Tile[]): boolean {
  for (const suit of ['DOT', 'BAM'] as TileType[]) {
    const suitTiles = hand.filter(t => t.type === suit);
    const has4 = suitTiles.some(t => t.value === 4);
    const has6 = suitTiles.some(t => t.value === 6);
    if (has4 && has6) return true;
  }
  return false;
}

// ─── AI 出牌逻辑 ────────────────────────────────────

// 简单的电脑出牌：优先打孤张，保留对子和搭子
export function simpleOpponentDiscard(hand: Tile[]): { discarded: Tile; newHand: Tile[] } {
  const scored = hand.map(tile => {
    let score = 0;
    const sameTiles = hand.filter(t => t.type === tile.type && t.value === tile.value).length;
    score += sameTiles * 10;

    if (tile.type !== 'DRG') {
      const hasNeighbor1 = hand.some(t => t.type === tile.type && Math.abs(t.value - tile.value) === 1);
      const hasNeighbor2 = hand.some(t => t.type === tile.type && Math.abs(t.value - tile.value) === 2);
      if (hasNeighbor1) score += 5;
      if (hasNeighbor2) score += 2;
      // 4-6 卡五星搭子非常珍贵
      if ((tile.value === 4 || tile.value === 6) &&
        hand.some(t => t.type === tile.type && (t.value === 4 || t.value === 6) && t.value !== tile.value)) {
        score += 15;
      }
    } else {
      score += 3;
    }
    return { tile, score };
  });

  scored.sort((a, b) => a.score - b.score);
  const toDiscard = scored[0].tile;
  const newHand = hand.filter(t => t.id !== toDiscard.id);
  return { discarded: toDiscard, newHand };
}

// ─── 胡牌判定 ───────────────────────────────────────

/**
 * 检测手牌是否胡牌。
 * 卡五星胡牌条件：14张手牌 = 4组面子 + 1对将
 * 面子 = 刻子(AAA) 或 顺子(ABC，仅筒/条可组顺子)
 */
export function checkWin(hand: Tile[]): boolean {
  if (hand.length !== 14) return false;

  // 将手牌转为计数表 { "DOT-1": 3, "BAM-5": 2, ... }
  const counts = new Map<string, number>();
  for (const t of hand) {
    const key = `${t.type}-${t.value}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // 获取所有不同的牌标识
  const uniqueKeys = Array.from(counts.keys());

  // 尝试每种牌作为将（雀头）
  for (const jiang of uniqueKeys) {
    const jiangCount = counts.get(jiang)!;
    if (jiangCount < 2) continue;

    // 复制一份计数表，取出一对将
    const remaining = new Map(counts);
    remaining.set(jiang, jiangCount - 2);

    if (canFormMelds(remaining)) return true;
  }

  return false;
}

/**
 * 递归判断剩余牌能否全部组成面子（刻子或顺子）
 */
function canFormMelds(counts: Map<string, number>): boolean {
  // 找到第一个数量 > 0 的牌
  let firstKey: string | null = null;
  for (const [key, count] of counts) {
    if (count > 0) {
      firstKey = key;
      break;
    }
  }

  // 全部用完了，成功
  if (!firstKey) return true;

  const [type, valueStr] = firstKey.split('-');
  const value = parseInt(valueStr);
  const currentCount = counts.get(firstKey)!;

  // 尝试组刻子 (AAA)
  if (currentCount >= 3) {
    counts.set(firstKey, currentCount - 3);
    if (canFormMelds(counts)) {
      counts.set(firstKey, currentCount); // 回溯
      return true;
    }
    counts.set(firstKey, currentCount); // 回溯
  }

  // 尝试组顺子 (ABC) — 字牌不能组顺子
  if (type !== 'DRG' && value <= 7) {
    const key2 = `${type}-${value + 1}`;
    const key3 = `${type}-${value + 2}`;
    const count2 = counts.get(key2) || 0;
    const count3 = counts.get(key3) || 0;

    if (count2 > 0 && count3 > 0) {
      counts.set(firstKey, currentCount - 1);
      counts.set(key2, count2 - 1);
      counts.set(key3, count3 - 1);
      if (canFormMelds(counts)) {
        // 回溯
        counts.set(firstKey, currentCount);
        counts.set(key2, count2);
        counts.set(key3, count3);
        return true;
      }
      // 回溯
      counts.set(firstKey, currentCount);
      counts.set(key2, count2);
      counts.set(key3, count3);
    }
  }

  return false;
}

// ─── 对局管理 ───────────────────────────────────────

/** 回合顺序: opponent1 → opponent2 → player → opponent1 → ... */
const TURN_ORDER: PlayerRole[] = ['opponent1', 'opponent2', 'player'];

export function getNextTurn(current: PlayerRole): PlayerRole {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % 3];
}

/** 创建新对局：洗牌发牌，每人13张 */
export function createGame(): GameState {
  const rawDeck = generateKaWuXingDeck();
  const deck = shuffleDeck(rawDeck);

  const opponent1Hand = sortHand(deck.slice(0, 13));
  const opponent2Hand = sortHand(deck.slice(13, 26));
  const playerHand = sortHand(deck.slice(26, 39));
  const remaining = deck.slice(39);

  const players: [PlayerState, PlayerState, PlayerState] = [
    { role: 'opponent1', name: '上家 · 老王', hand: opponent1Hand, discards: [] },
    { role: 'opponent2', name: '下家 · 老李', hand: opponent2Hand, discards: [] },
    { role: 'player', name: '你', hand: playerHand, discards: [] },
  ];

  return {
    phase: 'PLAYING',
    players,
    deck: remaining,
    currentTurn: 'opponent1', // 上家先摸牌
    roundNum: 1,
    turnHistory: [],
    winner: null,
    winningHand: null,
  };
}

/** 获取指定角色的 PlayerState */
export function getPlayer(state: GameState, role: PlayerRole): PlayerState {
  return state.players.find(p => p.role === role)!;
}

/** 更新指定角色的 PlayerState（不可变更新） */
function updatePlayer(state: GameState, role: PlayerRole, update: Partial<PlayerState>): GameState {
  return {
    ...state,
    players: state.players.map(p =>
      p.role === role ? { ...p, ...update } : p
    ) as [PlayerState, PlayerState, PlayerState],
  };
}

/**
 * 执行 AI 对手的一个回合：摸牌 → 检测胡牌 → 出牌
 * 返回新的 GameState
 */
export function executeOpponentTurn(state: GameState): GameState {
  const role = state.currentTurn;
  const player = getPlayer(state, role);

  // 牌堆为空 → 流局
  if (state.deck.length === 0) {
    return { ...state, phase: 'FINISHED' };
  }

  // 摸牌
  const drawnTile = state.deck[0];
  const newDeck = state.deck.slice(1);
  const handAfterDraw = sortHand([...player.hand, drawnTile]);

  // 检测自摸胡牌
  if (checkWin(handAfterDraw)) {
    let newState = updatePlayer(state, role, { hand: handAfterDraw });
    newState = {
      ...newState,
      deck: newDeck,
      phase: 'FINISHED',
      winner: role,
      winningHand: handAfterDraw,
    };
    return newState;
  }

  // AI 出牌
  const { discarded, newHand } = simpleOpponentDiscard(handAfterDraw);
  const sortedNewHand = sortHand(newHand);

  let newState = updatePlayer(state, role, {
    hand: sortedNewHand,
    discards: [...player.discards, discarded],
  });

  const nextTurn = getNextTurn(role);
  const newRoundNum = nextTurn === 'opponent1' ? state.roundNum + 1 : state.roundNum;

  newState = {
    ...newState,
    deck: newDeck,
    currentTurn: nextTurn,
    roundNum: newRoundNum,
    turnHistory: [
      ...state.turnHistory,
      { playerRole: role, drawnTile, discardedTile: discarded, roundNum: state.roundNum },
    ],
  };

  return newState;
}

/**
 * 玩家摸牌：手牌 13 → 14 张
 * 如果牌堆为空则流局
 * 如果摸到的牌组成胡牌则自摸
 */
export function playerDraw(state: GameState): { state: GameState; drawnTile: Tile | null; isWin: boolean } {
  if (state.deck.length === 0) {
    return {
      state: { ...state, phase: 'FINISHED' },
      drawnTile: null,
      isWin: false,
    };
  }

  const player = getPlayer(state, 'player');
  const drawnTile = state.deck[0];
  const newDeck = state.deck.slice(1);
  const handAfterDraw = sortHand([...player.hand, drawnTile]);

  let newState = updatePlayer(state, 'player', { hand: handAfterDraw });
  newState = { ...newState, deck: newDeck };

  // 检测自摸胡牌
  const isWin = checkWin(handAfterDraw);
  if (isWin) {
    newState = {
      ...newState,
      phase: 'FINISHED',
      winner: 'player',
      winningHand: handAfterDraw,
    };
  }

  return { state: newState, drawnTile, isWin };
}

/**
 * 玩家出牌：手牌 14 → 13 张，然后轮转到下一个玩家
 */
export function playerDiscard(state: GameState, tile: Tile): GameState {
  const player = getPlayer(state, 'player');
  const newHand = sortHand(player.hand.filter(t => t.id !== tile.id));

  let newState = updatePlayer(state, 'player', {
    hand: newHand,
    discards: [...player.discards, tile],
  });

  const nextTurn = getNextTurn('player');
  const newRoundNum = nextTurn === 'opponent1' ? state.roundNum + 1 : state.roundNum;

  newState = {
    ...newState,
    currentTurn: nextTurn,
    roundNum: newRoundNum,
    turnHistory: [
      ...state.turnHistory,
      { playerRole: 'player', drawnTile: null, discardedTile: tile, roundNum: state.roundNum },
    ],
  };

  return newState;
}

// ─── 旧版兼容导出（dealThreeHands 在新版不再需要）────

export function dealHand(deck: Tile[]): { hand: Tile[], remaining: Tile[] } {
  const hand = deck.slice(0, 13);
  const remaining = deck.slice(13);
  return { hand: sortHand(hand), remaining };
}

export function dealThreeHands(deck: Tile[]) {
  const playerHand = deck.slice(0, 13);
  const opponent1Hand = deck.slice(13, 26);
  const opponent2Hand = deck.slice(26, 39);
  const remaining = deck.slice(39);
  return {
    playerHand: sortHand(playerHand),
    opponent1Hand: sortHand(opponent1Hand),
    opponent2Hand: sortHand(opponent2Hand),
    remaining,
  };
}
