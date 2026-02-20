'use client';

import { useState } from 'react';
import { Tile } from '@/models/mahjong';
import { generateKaWuXingDeck, shuffleDeck, dealThreeHands, sortHand, checkKaWuXingPotential, simpleOpponentDiscard } from '@/engine/GameEngine';
import MahjongTile, { MahjongTileBack } from '@/components/MahjongTile';

interface OpponentState {
  name: string;
  hand: Tile[];
  discards: Tile[];
}

export default function Home() {
  const [hand, setHand] = useState<Tile[]>([]);
  const [deck, setDeck] = useState<Tile[]>([]);
  const [discarded, setDiscarded] = useState<Tile[]>([]);
  const [opponents, setOpponents] = useState<OpponentState[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [roundNum, setRoundNum] = useState<number>(0);

  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const startNewGame = () => {
    const rawDeck = generateKaWuXingDeck();
    const newDeck = shuffleDeck(rawDeck);
    const { playerHand, opponent1Hand, opponent2Hand, remaining } = dealThreeHands(newDeck);

    const opp1 = simulateOpponentTurns(opponent1Hand, remaining, '上家 · 老王');
    const opp2 = simulateOpponentTurns(opponent2Hand, opp1.remainingDeck, '下家 · 老李');

    // Player draws a tile: 13 -> 14, then picks one to discard
    let playerDeck = opp2.remainingDeck;
    let finalHand = playerHand;
    if (playerDeck.length > 0) {
      finalHand = sortHand([...playerHand, playerDeck[0]]);
      playerDeck = playerDeck.slice(1);
    }

    setHand(finalHand);
    setDeck(playerDeck);
    setDiscarded([]);
    setOpponents([opp1.state, opp2.state]);
    setFeedback(null);
    setIsLoading(false);
    setGameOver(false);
    setRoundNum(1);
    setStartTime(Date.now());
    setHasStarted(true);
  };

  const simulateOpponentTurns = (hand: Tile[], deck: Tile[], name: string): {
    state: OpponentState;
    remainingDeck: Tile[];
  } => {
    let currentHand = [...hand];
    let currentDeck = [...deck];
    const discards: Tile[] = [];

    if (currentDeck.length > 0) {
      currentHand = sortHand([...currentHand, currentDeck[0]]);
      currentDeck = currentDeck.slice(1);
    }
    const result = simpleOpponentDiscard(currentHand);
    discards.push(result.discarded);
    currentHand = result.newHand;

    return {
      state: { name, hand: currentHand, discards },
      remainingDeck: currentDeck,
    };
  };

  const getTileLabel = (t: Tile): string => {
    if (t.type === 'DOT') return `${t.value}筒`;
    if (t.type === 'BAM') return `${t.value}条`;
    if (t.value === 1) return '红中';
    if (t.value === 2) return '发财';
    return '白板';
  };

  const handleDiscard = async (tile: Tile) => {
    if (isLoading || gameOver) return;

    const duration = Date.now() - startTime;
    const hadKWXBefore = checkKaWuXingPotential(hand);

    const newHand = hand.filter(t => t.id !== tile.id);
    setHand(sortHand(newHand));
    setDiscarded(prev => [...prev, tile]);
    setGameOver(true);

    const hasKWXAfter = checkKaWuXingPotential(newHand);
    const sameCount = hand.filter(t => t.type === tile.type && t.value === tile.value).length;
    const allOpponentDiscards = opponents.flatMap(o => o.discards.map(t => getTileLabel(t)));

    const requestBody = {
      当前巡目: roundNum,
      手牌_出牌前: hand.map(t => getTileLabel(t)),
      打出的牌: getTileLabel(tile),
      剩余手牌: newHand.map(t => getTileLabel(t)),
      你的弃牌堆: [...discarded, tile].map(t => getTileLabel(t)),
      场面已见牌_其他两家弃牌: allOpponentDiscards,
      耗时ms: duration,
      出牌前有卡五星潜力: hadKWXBefore,
      出牌后有卡五星潜力: hasKWXAfter,
      打出的牌是否拆了4或6: (tile.type === 'DOT' || tile.type === 'BAM') && (tile.value === 4 || tile.value === 6),
      打出的牌在手上有几张: sameCount,
      牌堆剩余张数: deck.length,
    };

    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      setFeedback(`耗时: ${(duration / 1000).toFixed(2)}s\n\n${data.feedback}`);
    } catch {
      setFeedback(`耗时: ${(duration / 1000).toFixed(2)}s\n\n[评分: ?] AI教练罢工了，网络连接失败。`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white p-4 font-sans selection:bg-emerald-500">
      <div className="max-w-7xl mx-auto space-y-8 py-6 px-2">
        
        {/* Header */}
        <header className="text-center space-y-3">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-sm">
            KaStar Sensei
          </h1>
          <p className="text-emerald-200 text-lg font-medium tracking-wide">
            湖北卡五星麻将 原教旨主义 AI 教练
          </p>
        </header>

        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl text-emerald-100 font-bold drop-shadow-md">准备好接受毒舌洗礼了吗？</h2>
              <p className="text-emerald-300/80 text-lg">系统将为您生成一副残局，请尽快打出最优解。</p>
            </div>
            <button 
              onClick={startNewGame}
              className="px-12 py-5 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 hover:from-yellow-200 hover:via-yellow-300 hover:to-yellow-500 text-emerald-950 font-black text-2xl rounded-full shadow-[0_0_40px_rgba(250,204,21,0.5)] transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 active:scale-95 border-b-4 border-yellow-700"
            >
              开始对局
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-700">

            {/* Opponents Area */}
            <section className="grid grid-cols-2 gap-4">
              {opponents.map((opp, idx) => (
                <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-emerald-200 font-semibold flex items-center gap-2 text-base">
                      <span className="text-xl">👤</span>
                      {opp.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(opp.hand.length, 13) }).map((_, i) => (
                          <MahjongTileBack key={i} size="sm" />
                        ))}
                      </div>
                      <span className="text-emerald-400/60 text-xs">{opp.hand.length}张</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-emerald-400/50 text-xs font-medium">弃牌:</p>
                    <div className="flex flex-wrap gap-1.5 min-h-[56px]">
                      {opp.discards.length > 0 ? (
                        opp.discards.map(tile => (
                          <MahjongTile key={tile.id} tile={tile} size="sm" />
                        ))
                      ) : (
                        <span className="text-emerald-500/30 text-sm italic">暂无弃牌</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* AI Feedback Area */}
            <section className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 min-h-[120px] flex items-center justify-center transition-all duration-300">
              {isLoading ? (
                <div className="text-yellow-300 text-center space-y-3">
                  <div className="text-4xl animate-bounce">🤔</div>
                  <p className="text-lg animate-pulse font-medium">教练正在思考，准备骂你...</p>
                </div>
              ) : feedback ? (
                <div className="w-full">
                  <h3 className="text-yellow-400 font-bold mb-3 text-xl flex items-center gap-2">
                    <span>🤖</span> 教练点评
                  </h3>
                  <p className="whitespace-pre-wrap text-emerald-50 text-lg leading-relaxed">
                    {feedback}
                  </p>
                </div>
              ) : (
                <div className="text-emerald-300/60 text-center animate-pulse text-lg">
                  请点击下方的手牌出牌，AI 教练正在看着你...
                </div>
              )}
            </section>

            {/* Play Area */}
            <section className="space-y-6">
              
              {/* Your Discarded Pile */}
              <div className="space-y-2">
                <h3 className="text-emerald-300 font-semibold tracking-wider text-sm uppercase">你的弃牌 ({discarded.length})</h3>
                <div className="flex flex-wrap gap-1.5 min-h-[56px] p-3 bg-black/20 rounded-xl border border-black/30 shadow-inner">
                  {discarded.map(tile => (
                    <MahjongTile key={tile.id} tile={tile} size="sm" />
                  ))}
                </div>
              </div>

              {/* Player Hand */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-end">
                  <h3 className="text-yellow-400 font-bold text-2xl drop-shadow-md">
                    你的手牌
                    <span className="text-emerald-300 text-sm font-normal ml-3">第 {roundNum} 巡</span>
                  </h3>
                  <p className="text-emerald-200 text-sm">剩余牌堆: {deck.length} 张</p>
                </div>
                
                <div className="flex flex-nowrap justify-center gap-2 md:gap-3 p-4 md:p-6 bg-gradient-to-t from-emerald-950/80 to-transparent rounded-2xl border-b-4 border-emerald-950">
                  {hand.map((tile) => (
                    <MahjongTile
                      key={tile.id}
                      tile={tile}
                      size="lg"
                      onClick={() => handleDiscard(tile)}
                      disabled={isLoading || gameOver}
                      className={
                        isLoading || gameOver
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:-translate-y-4 hover:shadow-[0_20px_25px_rgba(0,0,0,0.6)] active:translate-y-0 cursor-pointer'
                      }
                    />
                  ))}
                </div>
              </div>

            </section>

            {/* Footer Actions */}
            <div className="flex justify-center pt-2">
              <button 
                onClick={startNewGame}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-emerald-950 font-bold rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                重新发牌
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
