import { Tile, TileType } from '../models/mahjong';

// 生成 1 副卡五星麻将牌库
export function generateKaWuXingDeck(): Tile[] {
  const deck: Tile[] = [];
  const suits: TileType[] = ['DOT', 'BAM'];

  // 添加筒子和条子 (1-9，每种 4 张)
  suits.forEach(suit => {
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        deck.push({
          type: suit,
          value,
          id: `${suit}-${value}-${i}`
        });
      }
    }
  });

  // 添加中、发、白 (每种 4 张)
  for (let value = 1; value <= 3; value++) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        type: 'DRG',
        value,
        id: `DRG-${value}-${i}`
      });
    }
  }

  return deck; // 共 84 张牌
}

// 经典的 Fisher-Yates 洗牌算法
export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 初始化对局，发 13 张牌
export function dealHand(deck: Tile[]): { hand: Tile[], remaining: Tile[] } {
  const hand = deck.slice(0, 13);
  const remaining = deck.slice(13);
  return { hand: sortHand(hand), remaining };
}

// 三人发牌：每人 13 张
export function dealThreeHands(deck: Tile[]): {
  playerHand: Tile[];
  opponent1Hand: Tile[];
  opponent2Hand: Tile[];
  remaining: Tile[];
} {
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

// 简单的电脑出牌逻辑：优先打孤张，避免拆对子
export function simpleOpponentDiscard(hand: Tile[]): { discarded: Tile; newHand: Tile[] } {
  // Score each tile — lower = more likely to discard
  const scored = hand.map(tile => {
    let score = 0;
    const sameTiles = hand.filter(t => t.type === tile.type && t.value === tile.value).length;
    score += sameTiles * 10; // Pairs/triplets are valuable

    if (tile.type !== 'DRG') {
      // Check for neighbors (sequential potential)
      const hasNeighbor1 = hand.some(t => t.type === tile.type && Math.abs(t.value - tile.value) === 1);
      const hasNeighbor2 = hand.some(t => t.type === tile.type && Math.abs(t.value - tile.value) === 2);
      if (hasNeighbor1) score += 5;
      if (hasNeighbor2) score += 2;
      // 4,6 ka-wu-xing pair is very valuable
      if ((tile.value === 4 || tile.value === 6) && 
          hand.some(t => t.type === tile.type && (t.value === 4 || t.value === 6) && t.value !== tile.value)) {
        score += 15;
      }
    } else {
      score += 3; // Dragons have some pung potential
    }
    return { tile, score };
  });

  // Sort by score ascending: discard the least valuable
  scored.sort((a, b) => a.score - b.score);
  const toDiscard = scored[0].tile;
  const newHand = hand.filter(t => t.id !== toDiscard.id);
  return { discarded: toDiscard, newHand };
}

// 将手牌排序：筒 -> 条 -> 中发白，并且按点数从小到大
export function sortHand(hand: Tile[]): Tile[] {
  const typeOrder = { 'DOT': 1, 'BAM': 2, 'DRG': 3 };

  return [...hand].sort((a, b) => {
    if (a.type !== b.type) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return a.value - b.value;
  });
}

// 极简卡五星潜力判定逻辑：是否存在 4、6
export function checkKaWuXingPotential(hand: Tile[]): boolean {
  for (const suit of ['DOT', 'BAM'] as TileType[]) {
    const suitTiles = hand.filter(t => t.type === suit);
    const has4 = suitTiles.some(t => t.value === 4);
    const has6 = suitTiles.some(t => t.value === 6);
    if (has4 && has6) return true;
  }
  return false;
}
