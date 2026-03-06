import { create } from 'zustand';
import { 
  createGame, 
  GameState, 
  getPlayer, 
  playerDiscard, 
  drawTile,
  Tile 
} from '@kastar/core-game';

interface GameStore {
  // 状态 (State)
  gameState: GameState | null;
  isGameStarted: boolean;
  selectedTileId: string | null;
  isAiLoading: boolean;
  feedback: {
    rating: 'S' | 'A' | 'B' | 'C' | 'F';
    content: string;
  } | null;

  // 派生状态 (Derived - 方便 UI 使用)
  getPlayerHand: () => Tile[];

  // 操作 (Actions)
  initGame: () => void;
  selectTile: (id: string | null) => void;
  discard: (tileId: string, autoDrawNext?: boolean) => Promise<void>;
  clearFeedback: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isGameStarted: false,
  selectedTileId: null,
  isAiLoading: false,
  feedback: null,

  getPlayerHand: () => {
    const state = get().gameState;
    if (!state) return [];
    return getPlayer(state, 'player').hand;
  },

  initGame: () => {
    const newGame = createGame();
    set({ gameState: newGame, isGameStarted: true, selectedTileId: null, feedback: null });
  },

  selectTile: (id) => {
    set({ selectedTileId: id });
  },

  discard: async (tileId, autoDrawNext = true) => {
    const state = get().gameState;
    if (!state) return;

    const player = getPlayer(state, 'player');
    const tile = player.hand.find(t => t.id === tileId);
    if (!tile) return;

    // 1. 执行玩家出牌
    let nextState = playerDiscard(state, tile);

    set({ 
      gameState: nextState, 
      selectedTileId: null,
      isAiLoading: true, // 开始 AI 思考
      feedback: null
    });

    // 2. 模拟 AI 评价延迟
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 3. 生成 Mock 反馈
    const ratings: ('S'|'A'|'B'|'C'|'F')[] = ['S', 'A', 'B', 'C', 'F'];
    const randomRating = ratings[Math.floor(Math.random() * ratings.length)];
    const mockComments = {
      'S': "这手牌打得漂亮！不愧是雀神转世，这进张稳如老狗。",
      'A': "还可以，中规中矩。是个正常人的操作。",
      'B': "有点扯皮了，你这手牌打得我脑壳痛，能不能动点脑子？",
      'C': "搞么名堂？这么好的卡五星苗子被你拆了，你真是个天才。",
      'F': "建议直接退赛。这牌打得，隔壁王奶奶看了都摇头。"
    };

    set({
      isAiLoading: false,
      feedback: {
        rating: randomRating,
        content: mockComments[randomRating]
      }
    });

    // 4. 模拟系统：如果开启了自动摸牌，则在反馈后摸牌
    if (autoDrawNext) {
      nextState = drawTile(nextState, 'player');
      set({ gameState: nextState });
    }
  },

  clearFeedback: () => set({ feedback: null }),

  resetGame: () => {
    const newGame = createGame();
    set({ gameState: newGame, selectedTileId: null, feedback: null, isAiLoading: false });
  },
}));
