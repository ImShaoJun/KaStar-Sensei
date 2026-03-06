import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // AI 配置
  apiKey: string;
  provider: 'claude' | 'mock' | 'http';
  baseUrl: string;
  
  // 游戏偏好
  autoDraw: boolean;
  showHints: boolean;
  
  // Actions
  updateSettings: (newSettings: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      provider: 'claude',
      baseUrl: 'https://api.anthropic.com',
      autoDraw: true,
      showHints: true,

      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      
      resetSettings: () => set({
        apiKey: '',
        provider: 'claude',
        baseUrl: 'https://api.anthropic.com',
        autoDraw: true,
        showHints: true,
      }),
    }),
    {
      name: 'kastar-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
