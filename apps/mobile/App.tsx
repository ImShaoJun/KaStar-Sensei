import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { getPlayer } from '@kastar/core-game';
import { MahjongTileRN } from '@kastar/ui-components';
import { useGameStore } from './src/store/gameStore';
import { useSettingsStore } from './src/store/settingsStore';
import SettingsModal from './src/components/SettingsModal';
import FeedbackCard from './src/components/FeedbackCard';

export default function App() {
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  const { 
    gameState, 
    initGame, 
    selectedTileId, 
    selectTile, 
    discard, 
    resetGame,
    isAiLoading,
    feedback,
    clearFeedback
  } = useGameStore();

  const { autoDraw, showHints } = useSettingsStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  if (!gameState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f1c40f" />
        <Text style={styles.loadingText}>正在加载对局...</Text>
      </View>
    );
  }

  const player = getPlayer(gameState, 'player');
  const opponent1 = getPlayer(gameState, 'opponent1');
  const opponent2 = getPlayer(gameState, 'opponent2');

  const handleTilePress = (id: string) => {
    if (isAiLoading) return; // 思考时禁止操作

    if (selectedTileId === id) {
      discard(id, autoDraw);
    } else {
      selectTile(id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🀄 卡五星 AI 教练</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setSettingsVisible(true)}>
            <Text style={styles.actionBtnText}>⚙️ 设置</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={resetGame}>
            <Text style={styles.actionBtnText}>重开</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.board}>
        <View style={styles.opponentSection}>
          <View style={styles.opponentCard}>
            <Text style={styles.opponentName}>对手 A</Text>
            <Text style={styles.opponentInfo}>{opponent1.discards.length} 张弃牌</Text>
          </View>
          <View style={styles.opponentCard}>
            <Text style={styles.opponentName}>对手 B</Text>
            <Text style={styles.opponentInfo}>{opponent2.discards.length} 张弃牌</Text>
          </View>
        </View>

        {/* 游戏状态展示 */}
        <View style={styles.discardPool}>
          {isAiLoading && (
            <View style={styles.aiLoadingArea}>
              <ActivityIndicator color="#f1c40f" />
              <Text style={styles.aiLoadingText}>教练正在分析您的出牌...</Text>
            </View>
          )}
          
          {!isAiLoading && (
             <>
               <Text style={styles.poolTitle}>河 (最新出牌)</Text>
               <View style={styles.discardGrid}>
                {[...player.discards, ...opponent1.discards, ...opponent2.discards]
                  .slice(-12)
                  .map((t, i) => (
                    <MahjongTileRN key={t.id + i} tile={t} size="sm" />
                  ))}
               </View>
             </>
          )}
        </View>
      </View>

      {/* 实时反馈组件 */}
      {showHints && feedback && (
        <FeedbackCard 
          rating={feedback.rating} 
          content={feedback.content} 
          onClose={clearFeedback} 
        />
      )}

      {/* 玩家手牌区域 */}
      <View style={styles.playerSection}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>我的手牌</Text>
          {selectedTileId && !isAiLoading && <Text style={styles.hint}>再次点击打出</Text>}
          {isAiLoading && <Text style={styles.aiHint}>教练思考中...</Text>}
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.handScroll}
        >
          {player.hand.map((tile) => (
            <MahjongTileRN 
              key={tile.id} 
              tile={tile} 
              size="md" 
              onPress={() => handleTilePress(tile.id)}
              disabled={isAiLoading}
              style={[
                selectedTileId === tile.id ? styles.selectedTile : {},
                isAiLoading ? { opacity: 0.6 } : {}
              ]}
            />
          ))}
        </ScrollView>
      </View>

      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2a2a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1c40f',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#34495e',
    borderRadius: 6,
    marginLeft: 8,
  },
  resetBtn: {
    backgroundColor: '#c0392b',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  board: {
    flex: 1,
    padding: 15,
  },
  opponentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  opponentCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 10,
  },
  opponentName: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  opponentInfo: {
    color: '#95a5a6',
    fontSize: 12,
  },
  discardPool: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    padding: 15,
    justifyContent: 'center',
  },
  poolTitle: {
    color: '#7f8c8d',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  discardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  aiLoadingArea: {
    alignItems: 'center',
  },
  aiLoadingText: {
    color: '#bdc3c7',
    fontSize: 12,
    marginTop: 10,
  },
  playerSection: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    color: '#27ae60',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiHint: {
    color: '#f1c40f',
    fontSize: 12,
    fontStyle: 'italic',
  },
  handScroll: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    alignItems: 'flex-end',
    height: 100,
  },
  selectedTile: {
    transform: [{ translateY: -15 }],
    borderColor: '#f1c40f',
    borderWidth: 2,
  },
});
