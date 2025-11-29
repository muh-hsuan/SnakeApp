import { createMMKV } from 'react-native-mmkv';
import { GameSettings } from '../types/game';

export const storage = createMMKV();

const KEYS = {
    SETTINGS: 'game.settings',
};

export const saveSettings = (settings: GameSettings) => {
    try {
        storage.set(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
};

export const getSettings = (): GameSettings => {
    try {
        const data = storage.getString(KEYS.SETTINGS);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    } catch (e) {
        console.error('Failed to get settings:', e);
    }
    return {
        soundEnabled: true,
        hapticsEnabled: true,
        highScore: 0,
        skinId: 'default',
    };
};
