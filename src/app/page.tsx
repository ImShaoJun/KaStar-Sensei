'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tile, GameState, PlayerRole, PlayerState } from '@/models/mahjong';
import {
  createGame,
  executeOpponentTurn,
  playerDraw,
  playerDiscard,
  getPlayer,
  checkKaWuXingPotential
} from '@/engine/GameEngine';
import MahjongTile, { MahjongTileBack } from '@/components/MahjongTile';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isOpponentThinking, setIsOpponentThinking] = useState<boolean>(false);

  const [coachReady, setCoachReady] = useState<boolean>(false);

  // 移除教练预热，因为已切换为无状态 API
  // useEffect(() => { ... }, []);

  const startNewGame = async () => {
    // 无需调用 reset/warmup

    const newGame = createGame();
    setGameState(newGame);
    setFeedback(null);
    setIsAiLoading(false);
    setIsOpponentThinking(false);
    setStartTime(Date.now());
  };

  // 核心游戏循环
  useEffect(() => {
    if (!gameState || gameState.phase === 'FINISHED') return;

    if (gameState.currentTurn !== 'player') {
      // 对手回合
      setIsOpponentThinking(true);
      const timer = setTimeout(() => {
        const nextState = executeOpponentTurn(gameState);
        setGameState(nextState);
        setIsOpponentThinking(false);
      }, 600); // 假装思考 600ms
      return () => clearTimeout(timer);
    } else {
      // 玩家回合
      const playerInfo = getPlayer(gameState, 'player');
      // 如果还没摸牌（手牌13张），则摸牌
      if (playerInfo.hand.length === 13) {
        const { state: nextState, isWin } = playerDraw(gameState);
        setGameState(nextState);
        setStartTime(Date.now()); // 开始计算玩家出牌耗时
        if (isWin) {
          setFeedback('恭喜！你自摸胡牌了！教练也得服你！');
        }
      }
    }
  }, [gameState]);

  const getTileLabel = (t: Tile): string => {
    if (t.type === 'DOT') return `${t.value}筒`;
    if (t.type === 'BAM') return `${t.value}条`;
    if (t.value === 1) return '红中';
    if (t.value === 2) return '发财';
    return '白板';
  };

  const handleDiscard = async (tile: Tile) => {
    if (!gameState || gameState.phase === 'FINISHED' || gameState.currentTurn !== 'player') return;

    const player = getPlayer(gameState, 'player');
    if (player.hand.length !== 14) return; // 还没摸牌不能打

    const duration = Date.now() - startTime;
    const hadKWXBefore = checkKaWuXingPotential(player.hand);

    // 执行出牌逻辑，更新游戏状态
    const nextState = playerDiscard(gameState, tile);
    setGameState(nextState);

    // 准备数据请求 AI 教练
    const newHand = getPlayer(nextState, 'player').hand;
    const hasKWXAfter = checkKaWuXingPotential(newHand);
    const sameCount = player.hand.filter(t => t.type === tile.type && t.value === tile.value).length;
    const allOpponentDiscards = [
      ...getPlayer(gameState, 'opponent1').discards,
      ...getPlayer(gameState, 'opponent2').discards
    ].map(t => getTileLabel(t));

    const requestBody = {
      当前巡目: gameState.roundNum,
      手牌_出牌前: player.hand.map(t => getTileLabel(t)),
      打出的牌: getTileLabel(tile),
      剩余手牌: newHand.map(t => getTileLabel(t)),
      你的弃牌堆: [...player.discards, tile].map(t => getTileLabel(t)),
      场面已见牌_其他两家弃牌: allOpponentDiscards,
      耗时ms: duration,
      出牌前有卡五星潜力: hadKWXBefore,
      出牌后有卡五星潜力: hasKWXAfter,
      打出的牌是否拆了4或6: (tile.type === 'DOT' || tile.type === 'BAM') && (tile.value === 4 || tile.value === 6),
      打出的牌在手上有几张: sameCount,
      牌堆剩余张数: gameState.deck.length,
    };

    setIsAiLoading(true);
    try {
      // 不在此处重置 feedback，保留上一次的反馈直到新反馈来
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      setFeedback(`[第 ${gameState.roundNum} 巡] 耗时: ${(duration / 1000).toFixed(2)}s\n打出: ${getTileLabel(tile)}\n\n${data.feedback}`);
    } catch {
      setFeedback(`[第 ${gameState.roundNum} 巡] 耗时: ${(duration / 1000).toFixed(2)}s\n[评分: ?] AI教练罢工了...`);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!gameState) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white p-4 font-sans selection:bg-emerald-500">
        <div className="max-w-7xl mx-auto space-y-8 py-6 px-2 flex flex-col items-center justify-center min-h-[80vh]">
          <header className="text-center space-y-3 mb-8">
            <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-sm">
              KaStar Sensei
            </h1>
            <p className="text-emerald-200 text-lg font-medium tracking-wide">
              湖北卡五星麻将 原教旨主义 AI 教练 (多轮模式)
            </p>
          </header>

          <div className="text-center space-y-4 mb-8">
            <h2 className="text-3xl text-emerald-100 font-bold drop-shadow-md">准备好接受毒舌洗礼了吗？</h2>
            <p className="text-emerald-300/80 text-lg">系统将为您生成一副手牌，你需要和两位AI大战到底。</p>
          </div>

          <button
            onClick={startNewGame}
            className="px-12 py-5 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 hover:from-yellow-200 hover:via-yellow-300 hover:to-yellow-500 text-emerald-950 font-black text-2xl rounded-full shadow-[0_0_40px_rgba(250,204,21,0.5)] transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 active:scale-95 border-b-4 border-yellow-700"
          >
            开始对局
          </button>
        </div>
      </main>
    );
  }

  const opp1 = getPlayer(gameState, 'opponent1');
  const opp2 = getPlayer(gameState, 'opponent2');
  const me = getPlayer(gameState, 'player');

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white p-4 font-sans selection:bg-emerald-500 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-4 py-2 px-2 flex-grow w-full flex flex-col">

        {/* Header & Status */}
        <header className="flex justify-between items-center bg-black/20 p-4 rounded-xl shadow-inner border border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400 drop-shadow-sm">KaStar Sensei</h1>
            <p className="text-emerald-300/70 text-xs">AI 教练陪伴打牌</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-100">第 {gameState.roundNum} 巡</div>
            <div className="text-sm text-emerald-400/80">剩余牌堆: {gameState.deck.length} 张</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isAiLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              <span className={`text-sm font-medium ${isAiLoading ? 'text-yellow-300' : 'text-green-300'}`}>
                {isAiLoading ? '教练打字中...' : '教练在线'}
              </span>
            </div>
            <button
              onClick={startNewGame}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20 transition"
            >
              {gameState.phase === 'FINISHED' ? '再来一局' : '认输重开'}
            </button>
          </div>
        </header>

        {/* 结束提示 / 流局提示 */}
        {gameState.phase === 'FINISHED' && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 text-center animate-in zoom-in duration-500">
            <h2 className="text-2xl font-bold text-yellow-300 drop-shadow-md">
              {gameState.winner ? `${getPlayer(gameState, gameState.winner).name} 胡牌了！` : '牌堆摸空，流局！'}
            </h2>
            {gameState.winningHand && (
              <div className="flex justify-center gap-1 mt-3 scale-75 md:scale-100">
                {gameState.winningHand.map((t, i) => (
                  <MahjongTile key={`${t.id}-${i}`} tile={t} size="sm" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opponents Area */}
        <section className="grid grid-cols-2 gap-4">
          {[opp1, opp2].map((opp) => {
            const isTurn = gameState.currentTurn === opp.role && gameState.phase !== 'FINISHED';
            return (
              <div
                key={opp.role}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border shadow-lg transition-all duration-300 ${isTurn ? 'border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.2)] bg-white/10' : 'border-white/10'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold flex items-center gap-2 text-base ${isTurn ? 'text-yellow-300' : 'text-emerald-200'}`}>
                    <span className="text-xl">👤</span>
                    {opp.name}
                    {isTurn && <span className="text-xs ml-2 animate-pulse bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded">思考中...</span>}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 overflow-hidden w-[150px] md:w-auto">
                      {Array.from({ length: Math.min(opp.hand.length, 14) }).map((_, i) => (
                        <MahjongTileBack key={i} size="sm" />
                      ))}
                    </div>
                    <span className="text-emerald-400/60 text-xs">{opp.hand.length}张</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-emerald-400/50 text-xs font-medium">弃牌 ({opp.discards.length}):</p>
                  <div className="flex flex-wrap gap-1 md:gap-1.5 min-h-[56px] max-h-[120px] overflow-y-auto custom-scrollbar">
                    {opp.discards.map((tile, i) => (
                      <MahjongTile key={`${tile.id}-${i}`} tile={tile} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* AI Feedback Area */}
        <section className="bg-black/30 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-2xl border border-white/10 flex-grow flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

          {isAiLoading ? (
            <div className="text-yellow-300 text-center space-y-3">
              <div className="text-4xl animate-bounce">🤬</div>
              <p className="text-lg animate-pulse font-medium">教练正在酝酿脏话...</p>
            </div>
          ) : feedback ? (
            <div className="w-full h-full flex flex-col justify-center">
              <h3 className="text-yellow-400 font-bold mb-2 text-lg md:text-xl flex items-center gap-2">
                <span>🤖</span> 教练点评
              </h3>
              <p className="whitespace-pre-wrap text-emerald-50 text-base md:text-lg leading-relaxed">
                {feedback}
              </p>
            </div>
          ) : (
            <div className="text-emerald-300/40 text-center animate-pulse text-lg">
              认真打牌！我在盯着你！
            </div>
          )}
        </section>

        {/* Player Play Area */}
        <section className="mt-auto space-y-4 pt-4">

          {/* Your Discarded Pile */}
          <div className="space-y-2">
            <h3 className="text-emerald-300/80 font-semibold tracking-wider text-xs uppercase flex justify-between">
              <span>你的弃牌 ({me.discards.length})</span>
            </h3>
            <div className="flex flex-wrap gap-1 md:gap-1.5 min-h-[56px] p-2 bg-black/20 rounded-lg border border-black/30 shadow-inner">
              {me.discards.map((tile, i) => (
                <MahjongTile key={`${tile.id}-${i}`} tile={tile} size="sm" className="opacity-80" />
              ))}
            </div>
          </div>

          {/* Player Hand */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className={`font-bold text-xl drop-shadow-md flex items-center gap-3 ${gameState.currentTurn === 'player' && gameState.phase === 'PLAYING' ? 'text-yellow-400' : 'text-emerald-300'}`}>
                你的手牌
                {gameState.currentTurn === 'player' && gameState.phase === 'PLAYING' && (
                  <span className="text-xs bg-yellow-500 text-green-900 px-2 py-1 rounded-md font-bold uppercase animate-pulse">
                    该你出牌了
                  </span>
                )}
              </h3>
            </div>

            <div className={`flex flex-nowrap justify-center gap-1.5 md:gap-3 p-3 md:p-5 rounded-2xl border-b-4 transition-all duration-300 ${gameState.currentTurn === 'player' && gameState.phase === 'PLAYING' ? 'bg-gradient-to-t from-emerald-800/80 to-transparent border-yellow-600 shadow-[0_0_20px_rgba(202,138,4,0.15)]' : 'bg-gradient-to-t from-emerald-950/80 to-transparent border-emerald-950'}`}>
              {me.hand.map((tile, i) => {
                const isDrawnTile = me.hand.length === 14 && i === me.hand.length - 1;
                const canDiscard = gameState.currentTurn === 'player' && gameState.phase === 'PLAYING' && me.hand.length === 14;

                return (
                  <div key={`${tile.id}-${i}`} className={`${isDrawnTile ? 'ml-4 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}`}>
                    <MahjongTile
                      tile={tile}
                      size="lg"
                      onClick={() => handleDiscard(tile)}
                      disabled={!canDiscard}
                      className={`
                        ${!canDiscard ? 'opacity-90 cursor-not-allowed' : 'hover:-translate-y-4 hover:shadow-[0_20px_25px_rgba(0,0,0,0.6)] active:translate-y-0 cursor-pointer'}
                        ${isDrawnTile ? 'animate-in slide-in-from-top-4 duration-300' : ''}
                      `}
                    />
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
