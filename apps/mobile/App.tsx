import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { createGame, GameState, getPlayer } from '@kastar/core-game';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // 初始化对局
    const newGame = createGame();
    setGameState(newGame);
  }, []);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text>正在加载游戏...</Text>
      </View>
    );
  }

  const player = getPlayer(gameState, 'player');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🀄 KaStar Sensei Mobile</Text>
      
      <View style={styles.board}>
        <Text style={styles.subtitle}>对手 1 的弃牌: {getPlayer(gameState, 'opponent1').discards.length} 张</Text>
        <Text style={styles.subtitle}>对手 2 的弃牌: {getPlayer(gameState, 'opponent2').discards.length} 张</Text>
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.sectionTitle}>我的手牌:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hand}>
          {player.hand.map((tile) => (
            <TouchableOpacity key={tile.id} style={styles.tile}>
              <Text style={styles.tileText}>{tile.type === 'DRG' ? '字' : tile.type === 'DOT' ? '筒' : '条'}</Text>
              <Text style={styles.tileValue}>{tile.value}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={() => setGameState(createGame())}>
          <Text style={styles.buttonText}>重新开局</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 20,
  },
  board: {
    flex: 1,
    width: '100%',
    padding: 20,
    justifyContent: 'center',
  },
  subtitle: {
    color: '#bdc3c7',
    fontSize: 16,
    marginBottom: 5,
  },
  handContainer: {
    height: 150,
    width: '100%',
    paddingHorizontal: 10,
  },
  sectionTitle: {
    color: '#ecf0f1',
    fontSize: 18,
    marginBottom: 10,
    marginLeft: 10,
  },
  hand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
  },
  tile: {
    width: 40,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#ddd',
  },
  tileText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  tileValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  controls: {
    padding: 30,
  },
  button: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
