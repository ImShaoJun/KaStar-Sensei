import { Tile, TileType, GameState, PlayerRole, PlayerState, ActionType, Meld, MeldType, PendingAction } from '../models/mahjong';

// ─── 牌库生成与洗牌 ─────────────────────────────────

export function generateKaWuXingDeck(): Tile[] {
  const deck: Tile[] = [];
  const suits: TileType[] = ['DOT', 'BAM'];
  suits.forEach(suit => {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        deck.push({ type: suit, value, id: `${suit}-${value}-${i}` });
      }
    }
  });
  for (let value = 1; value <= 3; value++) {
    for (let i = 0; i < 4; i++) {
      deck.push({ type: 'DRG', value, id: `DRG-${value}-${i}` });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

// ─── 动作判定工具 ───────────────────────────────────

export function checkCanPong(hand: Tile[], tile: Tile): boolean {
  return hand.filter(t => t.type === tile.type && t.value === tile.value).length >= 2;
}

export function checkCanMingKong(hand: Tile[], tile: Tile): boolean {
  return hand.filter(t => t.type === tile.type && t.value === tile.value).length >= 3;
}

export function checkCanAnKong(hand: Tile[]): Tile[] {
  const counts = new Map<string, Tile[]>();
  for (const t of hand) {
    const key = `${t.type}-${t.value}`;
    if (!counts.has(key)) counts.set(key, []);
    counts.get(key)!.push(t);
  }
  return Array.from(counts.values()).filter(tiles => tiles.length >= 4).map(tiles => tiles[0]);
}

export function checkCanBuKong(hand: Tile[], melds: Meld[]): Tile[] {
  const pongMelds = melds.filter(m => m.type === 'PONG');
  const buKongTiles: Tile[] = [];
  for (const meld of pongMelds) {
    const meldTile = meld.tiles[0];
    const match = hand.find(t => t.type === meldTile.type && t.value === meldTile.value);
    if (match) buKongTiles.push(match);
  }
  return buKongTiles;
}

// ─── 胡牌判定 ───────────────────────────────────────

export function checkWin(hand: Tile[], melds: Meld[] = []): boolean {
  // 手牌数必须满足: 3n + 2 (如 14张, 11张+1个副露, 8张+2个副露, 5张+3个副露, 2张+4个副露)
  const totalMeldTiles = melds.length * 3; 
  if (hand.length + totalMeldTiles !== 14) return false;

  const counts = new Map<string, number>();
  for (const t of hand) {
    const key = `${t.type}-${t.value}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const uniqueKeys = Array.from(counts.keys());

  for (const jiang of uniqueKeys) {
    const jiangCount = counts.get(jiang)!;
    if (jiangCount < 2) continue;
    const remaining = new Map(counts);
    remaining.set(jiang, jiangCount - 2);
    if (canFormMelds(remaining)) return true;
  }
  return false;
}

function canFormMelds(counts: Map<string, number>): boolean {
  let firstKey: string | null = null;
  for (const [key, count] of counts) {
    if (count > 0) {
      firstKey = key;
      break;
    }
  }
  if (!firstKey) return true;

  const [type, valueStr] = firstKey.split('-');
  const value = parseInt(valueStr);
  const currentCount = counts.get(firstKey)!;

  if (currentCount >= 3) {
    counts.set(firstKey, currentCount - 3);
    if (canFormMelds(counts)) {
      counts.set(firstKey, currentCount);
      return true;
    }
    counts.set(firstKey, currentCount);
  }

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
        counts.set(firstKey, currentCount);
        counts.set(key2, count2);
        counts.set(key3, count3);
        return true;
      }
      counts.set(firstKey, currentCount);
      counts.set(key2, count2);
      counts.set(key3, count3);
    }
  }
  return false;
}

// ─── 对局管理流转 ───────────────────────────────────

const TURN_ORDER: PlayerRole[] = ['opponent1', 'opponent2', 'player'];

export function getNextTurn(current: PlayerRole): PlayerRole {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % 3];
}

export function createGame(): GameState {
  const deck = shuffleDeck(generateKaWuXingDeck());
  const players: [PlayerState, PlayerState, PlayerState] = [
    { role: 'opponent1', name: '上家 · 老王', hand: sortHand(deck.slice(0, 13)), discards: [], melds: [] },
    { role: 'opponent2', name: '下家 · 老李', hand: sortHand(deck.slice(13, 26)), discards: [], melds: [] },
    { role: 'player', name: '你', hand: sortHand(deck.slice(26, 39)), discards: [], melds: [] },
  ];
  return {
    phase: 'PLAYING',
    players,
    deck: deck.slice(39),
    currentTurn: 'opponent1',
    roundNum: 1,
    turnHistory: [],
    winner: null,
    winningHand: null,
    pendingAction: null,
    winType: null
  };
}

export function getPlayer(state: GameState, role: PlayerRole): PlayerState {
  return state.players.find(p => p.role === role)!;
}

export function updatePlayer(state: GameState, role: PlayerRole, update: Partial<PlayerState>): GameState {
  return {
    ...state,
    players: state.players.map(p => p.role === role ? { ...p, ...update } : p) as [PlayerState, PlayerState, PlayerState],
  };
}

// ─── 动作触发与结算 ─────────────────────────────────

// 计算是否有中断操作 (针对打出的一张牌)
function checkPendingActionsOnDiscard(state: GameState, triggerTile: Tile, triggerPlayer: PlayerRole): PendingAction | null {
  // 按优先级检查: 胡 > 杠/碰. （为了简化，按玩家顺序寻找第一个能操作的人。实际规则中胡>碰杠）
  // 为了真实还原，先检查所有人能否胡，再检查能否杠/碰。
  const otherRoles = TURN_ORDER.filter(r => r !== triggerPlayer);

  // 1. 检查有没有人能胡
  for (const role of otherRoles) {
    const p = getPlayer(state, role);
    const mockHand = [...p.hand, triggerTile];
    if (checkWin(mockHand, p.melds)) {
      return {
        player: role,
        availableActions: ['HU', 'PASS'],
        triggerTile,
        triggerPlayer
      };
    }
  }

  // 2. 检查有没有人能碰/明杠
  for (const role of otherRoles) {
    const p = getPlayer(state, role);
    const actions: ActionType[] = [];
    if (checkCanMingKong(p.hand, triggerTile)) actions.push('MING_KONG');
    if (checkCanPong(p.hand, triggerTile)) actions.push('PONG');
    
    if (actions.length > 0) {
      actions.push('PASS');
      return {
        player: role,
        availableActions: actions,
        triggerTile,
        triggerPlayer
      };
    }
  }

  return null;
}

// 从当前 currentTurn 流转到下家
function resumeTurnFlow(state: GameState): GameState {
  const nextTurn = getNextTurn(state.currentTurn);
  const newRoundNum = nextTurn === 'opponent1' ? state.roundNum + 1 : state.roundNum;
  return {
    ...state,
    currentTurn: nextTurn,
    roundNum: newRoundNum,
    pendingAction: null,
  };
}

// 执行“过”
export function executePass(state: GameState): GameState {
  if (!state.pendingAction) return state;
  // PASS 后，被拦下的牌正式进入打出者的弃牌堆，回合流转。（打出者在 triggerPlayer，当时已把牌放进 discard，所以直接流转回合）
  return resumeTurnFlow({ ...state, pendingAction: null });
}

export function executeHuOnDiscard(state: GameState, playerRole: PlayerRole): GameState {
  if (!state.pendingAction) return state;
  const p = getPlayer(state, playerRole);
  const finalHand = sortHand([...p.hand, state.pendingAction.triggerTile]);
  let newState = updatePlayer(state, playerRole, { hand: finalHand });
  
  // 从触发者的弃牌堆中移除这张牌（因为它被胡了，就不算丢弃了）
  const triggerP = getPlayer(newState, state.pendingAction.triggerPlayer);
  const newDiscards = triggerP.discards.slice(0, -1);
  newState = updatePlayer(newState, state.pendingAction.triggerPlayer, { discards: newDiscards });

  return {
    ...newState,
    phase: 'FINISHED',
    winner: playerRole,
    winningHand: finalHand,
    winType: 'DIANPAO',
    pendingAction: null
  };
}

export function executePong(state: GameState, playerRole: PlayerRole): GameState {
  if (!state.pendingAction) return state;
  const p = getPlayer(state, playerRole);
  const triggerTile = state.pendingAction.triggerTile;
  const triggerPlayer = state.pendingAction.triggerPlayer;

  // 1. 从触发者弃牌堆移除该牌
  const tp = getPlayer(state, triggerPlayer);
  const newTpDiscards = tp.discards.slice(0, -1);
  let newState = updatePlayer(state, triggerPlayer, { discards: newTpDiscards });

  // 2. 从操作者手牌移除2张
  const newHand = [...p.hand];
  const removeIndices: number[] = [];
  newHand.forEach((t, idx) => {
    if (t.type === triggerTile.type && t.value === triggerTile.value && removeIndices.length < 2) {
      removeIndices.push(idx);
    }
  });
  removeIndices.sort((a,b)=>b-a).forEach(idx => newHand.splice(idx, 1));

  // 3. 构造 Meld
  const usedTiles = p.hand.filter((_, idx) => removeIndices.includes(idx));
  const newMeld: Meld = {
    type: 'PONG',
    tiles: [...usedTiles, triggerTile],
    sourceTile: triggerTile,
    sourcePlayer: triggerPlayer
  };

  newState = updatePlayer(newState, playerRole, { hand: sortHand(newHand), melds: [...p.melds, newMeld] });

  // 4. 将回合强行转移给操作者，让他直接出牌（不摸牌，因为手签是 3n+2，碰完直接打变成 3n+1）
  return {
    ...newState,
    currentTurn: playerRole,
    pendingAction: null
  };
}

export function executeMingKong(state: GameState, playerRole: PlayerRole): GameState {
  if (!state.pendingAction) return state;
  const p = getPlayer(state, playerRole);
  const triggerTile = state.pendingAction.triggerTile;
  const triggerPlayer = state.pendingAction.triggerPlayer;

  // 1. 从触发者弃牌堆移除该牌
  const tp = getPlayer(state, triggerPlayer);
  const newTpDiscards = tp.discards.slice(0, -1);
  let newState = updatePlayer(state, triggerPlayer, { discards: newTpDiscards });

  // 2. 从操作者手牌移除3张
  const newHand = [...p.hand];
  const removeIndices: number[] = [];
  newHand.forEach((t, idx) => {
    if (t.type === triggerTile.type && t.value === triggerTile.value && removeIndices.length < 3) {
      removeIndices.push(idx);
    }
  });
  removeIndices.sort((a,b)=>b-a).forEach(idx => newHand.splice(idx, 1));

  // 3. 构造 Meld
  const usedTiles = p.hand.filter((_, idx) => removeIndices.includes(idx));
  const newMeld: Meld = {
    type: 'MING_KONG',
    tiles: [...usedTiles, triggerTile],
    sourceTile: triggerTile,
    sourcePlayer: triggerPlayer
  };

  newState = updatePlayer(newState, playerRole, { hand: sortHand(newHand), melds: [...p.melds, newMeld] });

  // 4. 将回合强行转移给操作者，并且由于是杠，需要从牌堆末尾补摸一张
  const drawnTile = newState.deck[newState.deck.length - 1];
  const newDeck = newState.deck.slice(0, -1);
  const handAfterDraw = sortHand([...newState.players.find(p=>p.role===playerRole)!.hand, drawnTile]);

  newState = updatePlayer(newState, playerRole, { hand: handAfterDraw, lastDrawnTileId: drawnTile.id });

  return {
    ...newState,
    deck: newDeck,
    currentTurn: playerRole,
    pendingAction: null
  };
}

// 自己回合主动暗杠
export function playerAnKong(state: GameState, tile: Tile): GameState {
  const p = getPlayer(state, 'player');
  const newHand = [...p.hand];
  const removeIndices: number[] = [];
  newHand.forEach((t, idx) => {
    if (t.type === tile.type && t.value === tile.value && removeIndices.length < 4) {
      removeIndices.push(idx);
    }
  });
  if (removeIndices.length < 4) return state; // 防御

  removeIndices.sort((a,b)=>b-a).forEach(idx => newHand.splice(idx, 1));
  const usedTiles = p.hand.filter((_, idx) => removeIndices.includes(idx));
  
  const newMeld: Meld = { type: 'AN_KONG', tiles: usedTiles };
  let newState = updatePlayer(state, 'player', { hand: sortHand(newHand), melds: [...p.melds, newMeld] });

  // 补摸一张
  if (newState.deck.length === 0) {
    return { ...newState, phase: 'FINISHED' };
  }
  const drawnTile = newState.deck[newState.deck.length - 1];
  const newDeck = newState.deck.slice(0, -1);
  const handAfterDraw = sortHand([...getPlayer(newState, 'player').hand, drawnTile]);

  newState = updatePlayer(newState, 'player', { hand: handAfterDraw, lastDrawnTileId: drawnTile.id });
  return { ...newState, deck: newDeck };
}

// 自己回合主动补杠
export function playerBuKong(state: GameState, tile: Tile): GameState {
  const p = getPlayer(state, 'player');
  const newHand = p.hand.filter(t => t.id !== tile.id); // 移除手里那张
  
  const newMelds = p.melds.map(m => {
    if (m.type === 'PONG' && m.tiles[0].type === tile.type && m.tiles[0].value === tile.value) {
      return { ...m, type: 'BU_KONG' as MeldType, tiles: [...m.tiles, tile] };
    }
    return m;
  });

  let newState = updatePlayer(state, 'player', { hand: sortHand(newHand), melds: newMelds });

  // 补摸一张
  if (newState.deck.length === 0) {
    return { ...newState, phase: 'FINISHED' };
  }
  const drawnTile = newState.deck[newState.deck.length - 1];
  const newDeck = newState.deck.slice(0, -1);
  const handAfterDraw = sortHand([...getPlayer(newState, 'player').hand, drawnTile]);

  newState = updatePlayer(newState, 'player', { hand: handAfterDraw, lastDrawnTileId: drawnTile.id });
  return { ...newState, deck: newDeck };
}

// ─── 玩家与 AI 回合执行 ──────────────────────────────

export function playerDiscard(state: GameState, tile: Tile): GameState {
  const player = getPlayer(state, 'player');
  const newHand = sortHand(player.hand.filter(t => t.id !== tile.id));

  let newState = updatePlayer(state, 'player', {
    hand: newHand,
    discards: [...player.discards, tile],
    lastDrawnTileId: undefined,
  });

  newState = {
    ...newState,
    turnHistory: [...state.turnHistory, { playerRole: 'player', drawnTile: null, discardedTile: tile, roundNum: state.roundNum }],
  };

  // 检查其他人能否响应
  const pending = checkPendingActionsOnDiscard(newState, tile, 'player');
  if (pending) {
    return { ...newState, pendingAction: pending };
  }

  return resumeTurnFlow(newState);
}

export function playerDraw(state: GameState): { state: GameState; drawnTile: Tile | null; isWin: boolean } {
  if (state.deck.length === 0) {
    return { state: { ...state, phase: 'FINISHED' }, drawnTile: null, isWin: false };
  }
  const player = getPlayer(state, 'player');
  const drawnTile = state.deck[0];
  const newDeck = state.deck.slice(1);
  const handAfterDraw = sortHand([...player.hand, drawnTile]);

  let newState = updatePlayer(state, 'player', { hand: handAfterDraw, lastDrawnTileId: drawnTile.id });
  newState = { ...newState, deck: newDeck };

  const isWin = checkWin(handAfterDraw, player.melds);
  if (isWin) {
    newState = { ...newState, phase: 'FINISHED', winner: 'player', winningHand: handAfterDraw, winType: 'ZIMO' };
  }
  return { state: newState, drawnTile, isWin };
}

export function executeOpponentTurn(state: GameState): GameState {
  const role = state.currentTurn;
  const player = getPlayer(state, role);

  if (state.deck.length === 0) {
    return { ...state, phase: 'FINISHED' };
  }

  // AI主动暗杠/补杠（简化处理：只要能杠就杠）
  const anKongs = checkCanAnKong(player.hand);
  if (anKongs.length > 0) {
    // 假装他点杠了，其实就是直接返回（不丢牌，等待下个循环再处理，或者这里直接写死执行暗杠）
    // 为了简化，AI摸牌前，如果手上有暗杠先杠掉
    // 略过AI暗杠细节实现，当前以"直接出牌"为主，保障基础流程
  }

  const drawnTile = state.deck[0];
  const newDeck = state.deck.slice(1);
  const handAfterDraw = sortHand([...player.hand, drawnTile]);

  if (checkWin(handAfterDraw, player.melds)) {
    return {
      ...updatePlayer(state, role, { hand: handAfterDraw }),
      deck: newDeck, phase: 'FINISHED', winner: role, winningHand: handAfterDraw, winType: 'ZIMO'
    };
  }

  const { discarded, newHand } = simpleOpponentDiscard(handAfterDraw);
  const sortedNewHand = sortHand(newHand);

  let newState = updatePlayer(state, role, { hand: sortedNewHand, discards: [...player.discards, discarded] });
  newState = {
    ...newState, deck: newDeck,
    turnHistory: [...state.turnHistory, { playerRole: role, drawnTile, discardedTile: discarded, roundNum: state.roundNum }],
  };

  const pending = checkPendingActionsOnDiscard(newState, discarded, role);
  if (pending) {
    return { ...newState, pendingAction: pending };
  }

  return resumeTurnFlow(newState);
}

// 执行AI对手面对 pendingAction 时的自动决策
export function executeOpponentPendingAction(state: GameState): GameState {
  if (!state.pendingAction || state.pendingAction.player === 'player') return state;
  const actions = state.pendingAction.availableActions;
  const role = state.pendingAction.player;

  if (actions.includes('HU')) return executeHuOnDiscard(state, role);
  if (actions.includes('MING_KONG')) return executeMingKong(state, role);
  if (actions.includes('PONG')) return executePong(state, role);
  
  return executePass(state);
}
