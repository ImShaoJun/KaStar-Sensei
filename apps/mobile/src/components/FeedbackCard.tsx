import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

interface FeedbackCardProps {
  rating: 'S' | 'A' | 'B' | 'C' | 'F';
  content: string;
  onClose: () => void;
}

const RATING_COLORS = {
  'S': '#f1c40f', // 金
  'A': '#27ae60', // 绿
  'B': '#3498db', // 蓝
  'C': '#e67e22', // 橙
  'F': '#e74c3c', // 红
};

export default function FeedbackCard({ rating, content, onClose }: FeedbackCardProps) {
  const slideAnim = useRef(new Animated.Value(300)).current; // 初始在屏幕下方
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <View style={styles.card}>
        <View style={[styles.ratingBadge, { backgroundColor: RATING_COLORS[rating] }]}>
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
        
        <View style={styles.contentArea}>
          <Text style={styles.coachLabel}>教练点评:</Text>
          <Text style={styles.comment}>{content}</Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>知道了</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120, // 避开手牌区域
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  ratingBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
  },
  contentArea: {
    flex: 1,
  },
  coachLabel: {
    color: '#7f8c8d',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  comment: {
    color: '#2c3e50',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeBtn: {
    paddingLeft: 10,
  },
  closeBtnText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
