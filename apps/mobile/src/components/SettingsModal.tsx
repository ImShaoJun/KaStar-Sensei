import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Switch, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { 
    apiKey, 
    provider, 
    baseUrl, 
    autoDraw, 
    showHints, 
    updateSettings 
  } = useSettingsStore();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>偏好设置</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>完成</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.sectionTitle}>AI 教练配置</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>模型提供商</Text>
              <View style={styles.row}>
                {['claude', 'mock', 'http'].map((p) => (
                  <TouchableOpacity 
                    key={p} 
                    style={[styles.choice, provider === p && styles.choiceActive]}
                    onPress={() => updateSettings({ provider: p as any })}
                  >
                    <Text style={[styles.choiceText, provider === p && styles.choiceTextActive]}>
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Anthropic API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="在此粘贴您的 API Key"
                placeholderTextColor="#666"
                value={apiKey}
                onChangeText={(v) => updateSettings({ apiKey: v })}
                secureTextEntry
              />
            </View>

            <Text style={styles.sectionTitle}>对局设置</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.label}>打牌后自动摸牌</Text>
              <Switch 
                value={autoDraw} 
                onValueChange={(v) => updateSettings({ autoDraw: v })}
                trackColor={{ false: "#3e3e3e", true: "#27ae60" }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>显示教练提示</Text>
              <Switch 
                value={showHints} 
                onValueChange={(v) => updateSettings({ showHints: v })}
                trackColor={{ false: "#3e3e3e", true: "#27ae60" }}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.version}>KaStar Sensei Mobile v1.0.0</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    color: '#f1c40f',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#ecf0f1',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  choice: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  choiceActive: {
    backgroundColor: '#3498db',
  },
  choiceText: {
    color: '#95a5a6',
    fontWeight: 'bold',
  },
  choiceTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 40,
  },
  version: {
    color: '#555',
    fontSize: 12,
  },
});
