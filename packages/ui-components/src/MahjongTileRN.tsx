import React from 'react';
import { View, TouchableOpacity, Text as RNText, StyleSheet, ViewStyle } from 'react-native';
import Svg, { G, Circle, Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Tile } from '@kastar/core-game/src/mahjong';

interface MahjongTileProps {
  tile: Tile;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const DOT_PATTERNS: Record<number, { cx: number; cy: number }[]> = {
  1: [{ cx: 50, cy: 70 }],
  2: [{ cx: 50, cy: 40 }, { cx: 50, cy: 100 }],
  3: [{ cx: 50, cy: 28 }, { cx: 50, cy: 70 }, { cx: 50, cy: 112 }],
  4: [{ cx: 28, cy: 40 }, { cx: 72, cy: 40 }, { cx: 28, cy: 100 }, { cx: 72, cy: 100 }],
  5: [{ cx: 28, cy: 32 }, { cx: 72, cy: 32 }, { cx: 50, cy: 70 }, { cx: 28, cy: 108 }, { cx: 72, cy: 108 }],
  6: [{ cx: 28, cy: 28 }, { cx: 72, cy: 28 }, { cx: 28, cy: 70 }, { cx: 72, cy: 70 }, { cx: 28, cy: 112 }, { cx: 72, cy: 112 }],
  7: [{ cx: 28, cy: 22 }, { cx: 72, cy: 22 }, { cx: 28, cy: 52 }, { cx: 72, cy: 52 }, { cx: 28, cy: 82 }, { cx: 72, cy: 82 }, { cx: 50, cy: 115 }],
  8: [{ cx: 28, cy: 22 }, { cx: 72, cy: 22 }, { cx: 28, cy: 48 }, { cx: 72, cy: 48 }, { cx: 28, cy: 74 }, { cx: 72, cy: 74 }, { cx: 28, cy: 100 }, { cx: 72, cy: 100 }],
  9: [{ cx: 22, cy: 22 }, { cx: 50, cy: 22 }, { cx: 78, cy: 22 }, { cx: 22, cy: 62 }, { cx: 50, cy: 62 }, { cx: 78, cy: 62 }, { cx: 22, cy: 102 }, { cx: 50, cy: 102 }, { cx: 78, cy: 102 }],
};

function renderDotPattern(value: number) {
  const positions = DOT_PATTERNS[value] || [];
  const r = value <= 2 ? 18 : value <= 4 ? 16 : value <= 6 ? 14 : value <= 8 ? 13 : 12;

  return (
    <G>
      {positions.map((pos, i) => (
        <G key={i}>
          <Circle cx={pos.cx} cy={pos.cy} r={r} fill="none" stroke="#1a5fb4" strokeWidth="3" />
          <Circle cx={pos.cx} cy={pos.cy} r={r * 0.45} fill="#c0392b" />
        </G>
      ))}
    </G>
  );
}

function renderBamPattern(value: number) {
  if (value === 1) {
    return (
      <SvgText x="50" y="85" textAnchor="middle" fontSize="55" fill="#2d7d46">
        🐦
      </SvgText>
    );
  }

  const stickCount = value;
  const stickW = 14;
  const cols = stickCount <= 3 ? 1 : 2;
  const rows = Math.ceil(stickCount / cols);
  const colGap = 10;
  const totalW = cols * stickW + (cols - 1) * colGap;
  const startX = 50 - totalW / 2;
  const availH = 110;
  const rowH = availH / rows;
  const startY = 10;

  const sticks: React.ReactElement[] = [];
  let idx = 0;
  for (let r = 0; r < rows && idx < stickCount; r++) {
    const colsInRow = Math.min(cols, stickCount - idx);
    const rowW = colsInRow * stickW + (colsInRow - 1) * colGap;
    const rowStartX = 50 - rowW / 2;
    for (let c = 0; c < colsInRow && idx < stickCount; c++) {
      const x = rowStartX + c * (stickW + colGap);
      const y = startY + r * rowH + 2;
      const h = rowH - 6;
      const color = idx % 2 === 0 ? '#2d7d46' : '#1a5fb4';
      sticks.push(
        <G key={idx}>
          <Rect x={x} y={y} width={stickW} height={h} rx={3} fill={color} />
          <Line x1={x + 1} y1={y + h * 0.33} x2={x + stickW - 1} y2={y + h * 0.33} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
          <Line x1={x + 1} y1={y + h * 0.66} x2={x + stickW - 1} y2={y + h * 0.66} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
        </G>
      );
      idx++;
    }
  }
  return <G>{sticks}</G>;
}

function renderDragonPattern(value: number) {
  if (value === 1) {
    return (
      <SvgText x="50" y="92" textAnchor="middle" alignmentBaseline="central" fontSize="68" fontWeight="900" fill="#dc2626">
        中
      </SvgText>
    );
  }
  if (value === 2) {
    return (
      <SvgText x="50" y="92" textAnchor="middle" alignmentBaseline="central" fontSize="68" fontWeight="900" fill="#16a34a">
        發
      </SvgText>
    );
  }
  return (
    <G>
      <Rect x="15" y="25" width="70" height="90" rx="6" fill="none" stroke="#60a5fa" strokeWidth="4" />
      <Rect x="25" y="35" width="50" height="70" rx="3" fill="none" stroke="#93c5fd" strokeWidth="2" />
    </G>
  );
}

const SIZE_MAP = {
  sm: { width: 40, height: 56 },
  md: { width: 64, height: 88 },
  lg: { width: 80, height: 112 },
};

export function MahjongTileRN({ tile, size = 'lg', onPress, disabled = false, style }: MahjongTileProps) {
  const { width, height } = SIZE_MAP[size];

  const renderContent = () => {
    if (tile.type === 'DOT') return renderDotPattern(tile.value);
    if (tile.type === 'BAM') return renderBamPattern(tile.value);
    return renderDragonPattern(tile.value);
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, { width, height }, style]}
      activeOpacity={0.7}
    >
      {/* Tile shadow/depth base */}
      <View style={[styles.depth, { width, height, backgroundColor: '#8a7a62' }]} />
      
      {/* Main tile face */}
      <View style={[styles.face, { width, height: height - 4 }]}>
        <Svg viewBox="0 0 100 140" width="100%" height="100%">
          <Defs>
            <LinearGradient id="faceGradient" x1="0" y1="0" x2="0" y2="100%">
              <Stop offset="0%" stopColor="#fffff5" />
              <Stop offset="30%" stopColor="#f5f0e0" />
              <Stop offset="100%" stopColor="#ede5d0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="140" fill="url(#faceGradient)" rx="10" />
          <G>{renderContent()}</G>
        </Svg>
      </View>
    </Container>
  );
}

export function MahjongTileBackRN({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { width, height } = size === 'sm' ? { width: 20, height: 28 } : { width: 32, height: 44 };
  return (
    <View style={[styles.back, { width, height }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 2,
  },
  depth: {
    position: 'absolute',
    top: 4,
    left: 0,
    borderRadius: 8,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#fffff5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8b89a',
    overflow: 'hidden',
  },
  back: {
    backgroundColor: '#1e40af',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    margin: 1,
  },
});
