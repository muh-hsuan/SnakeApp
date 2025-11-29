import { MMKV } from 'react-native-mmkv';
import { GameSettings } from '../types/game';

// @ts-ignore
export const storage = new MMKV();

const KEYS = {
    SETTINGS: 'game.settings',
};

export const saveSettings = (settings: GameSettings) => {
    storage.set(KEYS.SETTINGS, JSON.stringify(settings));
};

export const getSettings = (): GameSettings => {
    const data = storage.getString(KEYS.SETTINGS);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse settings', e);
        }
    }
    return {
        soundEnabled: true,
        hapticsEnabled: true,
        highScore: 0,
        skinId: 'default',
    };
};
