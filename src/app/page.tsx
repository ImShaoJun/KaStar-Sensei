'use client';

import { useState, useEffect } from 'react';
import { Tile, GameState, ActionType, Meld } from '@/models/mahjong';
import {
  createGame,
  executeOpponentTurn,
  playerDraw,
  playerDiscard,
  getPlayer,
  checkKaWuXingPotential,
  executeOpponentPendingAction,
  executePass,
  executePong,
  executeMingKong,
  executeHuOnDiscard,
  playerAnKong,
  playerBuKong,
  checkCanAnKong,
  checkCanBuKong
} from '@/engine/GameEngine';
import MahjongTile, { MahjongTileBack } from '@/components/MahjongTile';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isOpponentThinking, setIsOpponentThinking] = useState<boolean>(false);

  const startNewGame = async () => {
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

    // 1. 处理 Pending Action (碰/杠/胡打断)
    if (gameState.pendingAction) {
      if (gameState.pendingAction.player !== 'player') {
        // AI 的打断决策
        setIsOpponentThinking(true);
        const timer = setTimeout(() => {
          const nextState = executeOpponentPendingAction(gameState);
          setGameState(nextState);
          setIsOpponentThinking(false);
        }, 800);
        return () => clearTimeout(timer);
      }
      return; // 玩家的 pendingAction 等待点击 UI
    }

    // 2. 正常回合流转
    if (gameState.currentTurn !== 'player') {
      // 对手回合
      setIsOpponentThinking(true);
      const timer = setTimeout(() => {
        const nextState = executeOpponentTurn(gameState);
        setGameState(nextState);
        setIsOpponentThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      // 玩家回合: 摸牌
      const playerInfo = getPlayer(gameState, 'player');
      // 以 3n+1 为标准：13, 10, 7 都说明在这回合开始时需要摸牌（如果刚碰/杠过，张数会是3n+2就不用摸牌了）
      if (playerInfo.hand.length % 3 === 1) {
        const { state: nextState, isWin } = playerDraw(gameState);
        setGameState(nextState);
        setStartTime(Date.now()); 
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
    if (!gameState || gameState.phase === 'FINISHED' || gameState.currentTurn !== 'player' || gameState.pendingAction) return;

    const player = getPlayer(gameState, 'player');
    
    const duration = Date.now() - startTime;
    const hadKWXBefore = checkKaWuXingPotential(player.hand);

    const nextState = playerDiscard(gameState, tile);
    setGameState(nextState);

    // 请求大模型反馈
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

  const handlePendingAction = (action: ActionType) => {
    if (!gameState) return;
    if (action === 'PASS') setGameState(executePass(gameState));
    else if (action === 'HU') setGameState(executeHuOnDiscard(gameState, 'player'));
    else if (action === 'PONG') setGameState(executePong(gameState, 'player'));
    else if (action === 'MING_KONG') setGameState(executeMingKong(gameState, 'player'));
  };

  const renderMelds = (melds: Meld[]) => {
    if (melds.length === 0) return null;
    return (
      <div className="flex gap-2">
        {melds.map((meld, i) => (
          <div key={i} className="flex bg-black/30 p-1.5 rounded-lg border border-white/10 shadow-inner">
            {meld.tiles.map((t, j) => (
              <MahjongTile key={j} tile={t} size="sm" className={meld.type === 'AN_KONG' && j < 3 ? "brightness-50" : ""} />
            ))}
          </div>
        ))}
      </div>
    );
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
              湖北卡五星麻将 原教旨主义 AI 教练 (完整对战版)
            </p>
          </header>
          <button
            onClick={startNewGame}
            className="px-12 py-5 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 hover:from-yellow-200 hover:via-yellow-300 hover:to-yellow-500 text-emerald-950 font-black text-2xl rounded-full shadow-[0_0_40px_rgba(250,204,21,0.5)] transform transition-all duration-300 hover:scale-110 active:scale-95 border-b-4 border-yellow-700"
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

  const canAnKongs = checkCanAnKong(me.hand);
  const canBuKongs = checkCanBuKong(me.hand, me.melds);
  // It's the player's turn to act (discard or kong) when:
  // 1. It is their currentTurn
  // 2. They have exactly 3n+2 tiles in hand (which means they just drew a tile and haven't discarded yet)
  // 3. There is no pendingAction blocking them
  const isMyTurnAndCanAct = gameState.currentTurn === 'player' && gameState.phase === 'PLAYING' && !gameState.pendingAction && me.hand.length % 3 === 2;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white p-4 font-sans flex flex-col relative overflow-hidden">
      
      {/* 待选动作悬浮层 (点炮胡/碰/杠) */}
      {gameState.pendingAction?.player === 'player' && gameState.phase === 'PLAYING' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-gradient-to-b from-slate-800 to-black p-6 rounded-2xl shadow-2xl border-2 border-yellow-500/50 flex flex-col items-center space-y-4 transform scale-110">
            <h3 className="text-xl font-bold text-yellow-400 drop-shadow-md">请选择操作！</h3>
            <div className="flex gap-4">
              {gameState.pendingAction.availableActions.includes('HU') && (
                <button onClick={() => handlePendingAction('HU')} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.6)] text-xl transition-transform hover:scale-110">胡！</button>
              )}
              {gameState.pendingAction.availableActions.includes('MING_KONG') && (
                <button onClick={() => handlePendingAction('MING_KONG')} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(202,138,4,0.6)] text-xl transition-transform hover:scale-110">杠！</button>
              )}
              {gameState.pendingAction.availableActions.includes('PONG') && (
                <button onClick={() => handlePendingAction('PONG')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg text-xl transition-transform hover:scale-110">碰！</button>
              )}
              <button onClick={() => handlePendingAction('PASS')} className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg shadow-lg text-xl transition-transform hover:scale-110">过</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 py-2 px-2 flex-grow w-full flex flex-col">
        <header className="flex justify-between items-center bg-black/20 p-4 rounded-xl shadow-inner border border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">KaStar Sensei</h1>
            <p className="text-emerald-300/70 text-xs">AI 教练陪伴打牌</p>
          </div>
          <div className="text-center">
             <div className="text-lg font-bold text-emerald-100">第 {gameState.roundNum} 巡</div>
             <div className="text-sm text-emerald-400/80">剩余牌堆: {gameState.deck.length} 张</div>
          </div>
          <button onClick={startNewGame} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20">
            {gameState.phase === 'FINISHED' ? '再来一局' : '认输重开'}
          </button>
        </header>

        {gameState.phase === 'FINISHED' && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 text-center animate-in zoom-in duration-500">
              <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-md">
                {gameState.winner ? `${getPlayer(gameState, gameState.winner).name} ${gameState.winType === 'ZIMO' ? '自摸' : '接炮'}胡了！` : '牌堆摸空，流局！'}
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

        <section className="grid grid-cols-2 gap-4">
          {[opp1, opp2].map((opp) => {
            const isTurn = gameState.currentTurn === opp.role && gameState.phase !== 'FINISHED' && !gameState.pendingAction;
            return (
              <div key={opp.role} className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all ${isTurn ? 'border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.2)] bg-white/10' : 'border-white/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold flex items-center gap-2 ${isTurn ? 'text-yellow-300' : 'text-emerald-200'}`}>
                    {opp.name} {isTurn && <span className="text-xs ml-2 animate-pulse bg-yellow-500/20 px-2 py-0.5 rounded">思考中...</span>}
                  </h3>
                  <div className="flex items-center gap-2 text-emerald-400/60 text-xs">
                    {opp.hand.length}张
                  </div>
                </div>
                {/* 对手副露区 */}
                {opp.melds.length > 0 && (
                  <div className="mb-2">
                    {renderMelds(opp.melds)}
                  </div>
                )}
                <div className="space-y-1.5">
                  <p className="text-emerald-400/50 text-xs font-medium">弃牌:</p>
                  <div className="flex flex-wrap gap-1 min-h-[56px] max-h-[80px] overflow-y-auto custom-scrollbar">
                    {opp.discards.map((tile, i) => <MahjongTile key={`${tile.id}-${i}`} tile={tile} size="sm" />)}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="bg-black/30 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-2xl border border-white/10 flex-grow flex items-center justify-center min-h-[120px]">
          {isAiLoading ? (
            <div className="text-yellow-300 text-center space-y-3">
              <div className="text-4xl animate-bounce">🤬</div>
              <p className="text-lg animate-pulse font-medium">教练正在酝酿脏话...</p>
            </div>
          ) : feedback ? (
            <div className="w-full h-full flex flex-col justify-center">
              <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2"><span>🤖</span> 教练点评</h3>
              <p className="whitespace-pre-wrap text-emerald-50 leading-relaxed">{feedback}</p>
            </div>
          ) : (
            <div className="text-emerald-300/40 text-center animate-pulse">认真打牌！我在盯着你！</div>
          )}
        </section>

        <section className="mt-auto space-y-4 pt-4">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h3 className="text-emerald-300/80 font-semibold text-xs uppercase">你的副露</h3>
              <div className="min-h-[60px] flex items-center">
                {me.melds.length > 0 ? renderMelds(me.melds) : <span className="text-emerald-300/30 text-xs text-italic">暂无碰杠</span>}
              </div>
            </div>
            <div className="space-y-2 text-right">
              <h3 className="text-emerald-300/80 font-semibold text-xs uppercase">你的弃牌</h3>
              <div className="flex flex-wrap gap-1 justify-end max-w-[300px] max-h-[80px] overflow-y-auto">
                {me.discards.map((tile, i) => <MahjongTile key={`${tile.id}-${i}`} tile={tile} size="sm" className="opacity-80" />)}
              </div>
            </div>
          </div>

          <div className="space-y-3 relative">
            <div className="flex justify-between items-end">
              <h3 className={`font-bold text-xl drop-shadow-md flex items-center gap-3 ${isMyTurnAndCanAct ? 'text-yellow-400' : 'text-emerald-300'}`}>
                你的手牌
                {isMyTurnAndCanAct && <span className="text-xs bg-yellow-500 text-green-900 px-2 py-1 rounded-md font-bold uppercase animate-pulse">该你出牌了</span>}
              </h3>

              {/* 主动暗杠/补杠按钮 */}
              {isMyTurnAndCanAct && (canAnKongs.length > 0 || canBuKongs.length > 0) && (
                <div className="flex gap-2">
                  {canAnKongs.map((t, i) => (
                    <button key={`an-${i}`} onClick={() => setGameState(playerAnKong(gameState, t))} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded shadow">暗杠 {getTileLabel(t)}</button>
                  ))}
                  {canBuKongs.map((t, i) => (
                    <button key={`bu-${i}`} onClick={() => setGameState(playerBuKong(gameState, t))} className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded shadow">补杠 {getTileLabel(t)}</button>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex flex-nowrap justify-center gap-1.5 md:gap-3 p-3 md:p-5 rounded-2xl border-b-4 transition-all duration-300 ${isMyTurnAndCanAct ? 'bg-gradient-to-t from-emerald-800/80 to-transparent border-yellow-600 shadow-[0_0_20px_rgba(202,138,4,0.15)]' : 'bg-gradient-to-t from-emerald-950/80 to-transparent border-emerald-950'}`}>
              {me.hand.map((tile, i) => {
                // If melds exist, hand shrinks by 3 per PONG/MING_KONG.
                // Determine if this is the highlighted newly drawn tile using its unique ID instead of array index.
                const isDrawnTile = me.lastDrawnTileId === tile.id;
                // You can discard if it's your turn, no pending actions, and you have the correct number of tiles.
                // Also allowing discard if hand is 3n+2. Wait, 14, 11, 8, 5, 2 are all 3n+2.
                // Since 14 - melds.length * 3 is 3n+2, we can just check modulo.
                const canDiscard = isMyTurnAndCanAct && me.hand.length % 3 === 2;

                return (
                  <div key={`${tile.id}-${i}`} className={`${isDrawnTile ? 'ml-4 drop-shadow-[0_0_15px_rgba(250,204,21,1)] ring-2 ring-yellow-400/80 rounded-lg' : ''}`}>
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
