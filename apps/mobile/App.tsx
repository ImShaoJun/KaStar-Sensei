import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { getPlayer, Tile } from '@kastar/core-game';
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
            <View style={styles.opponentHeader}>
              <Text style={styles.opponentName}>对手 A</Text>
              <Text style={styles.opponentInfo}>{opponent1.hand.length}张手牌</Text>
            </View>
            <Text style={styles.discardLabel}>弃牌 ({opponent1.discards.length}):</Text>
            <View style={styles.discardGridSmall}>
              {opponent1.discards.map((t: Tile, i: number) => (
                <MahjongTileRN key={t.id + i} tile={t} size="sm" />
              ))}
            </View>
          </View>
          <View style={styles.opponentCard}>
            <View style={styles.opponentHeader}>
              <Text style={styles.opponentName}>对手 B</Text>
              <Text style={styles.opponentInfo}>{opponent2.hand.length}张手牌</Text>
            </View>
            <Text style={styles.discardLabel}>弃牌 ({opponent2.discards.length}):</Text>
            <View style={styles.discardGridSmall}>
              {opponent2.discards.map((t: Tile, i: number) => (
                <MahjongTileRN key={t.id + i} tile={t} size="sm" />
              ))}
            </View>
          </View>
        </View>

        {/* 游戏状态展示 */}
        <View style={styles.centerStatusArea}>
          {isAiLoading ? (
            <View style={styles.aiLoadingArea}>
              <ActivityIndicator color="#f1c40f" size="large" />
              <Text style={styles.aiLoadingText}>教练正在分析您的出牌...</Text>
            </View>
          ) : (
            <View style={styles.playerDiscardArea}>
              <Text style={styles.poolTitle}>你的弃牌 ({player.discards.length})</Text>
              <View style={styles.discardGrid}>
                {player.discards.map((t: Tile, i: number) => (
                  <MahjongTileRN key={t.id + i} tile={t} size="sm" />
                ))}
              </View>
            </View>
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

        <View style={styles.handGrid}>
          {player.hand.map((tile: Tile) => (
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
        </View>
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
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
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
  opponentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  discardLabel: {
    color: 'rgba(110, 231, 183, 0.5)', // emerald-400/50
    fontSize: 10,
    marginBottom: 4,
  },
  discardGridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    minHeight: 40,
  },
  centerStatusArea: {
    flex: 1,
    justifyContent: 'center',
  },
  playerDiscardArea: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    padding: 10,
    minHeight: 100,
  },
  poolTitle: {
    color: 'rgba(110, 231, 183, 0.8)', // emerald-300/80
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  discardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
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
    paddingTop: 15,
    paddingBottom: Platform.OS === 'android' ? 30 : 20,
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
  handGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingBottom: 5,
    paddingTop: 20, // Add space for the selected tile to translate up
    gap: 4,
  },
  selectedTile: {
    transform: [{ translateY: -15 }],
    borderColor: '#f1c40f',
    borderWidth: 2,
  },
});
