import { MMKV as MMKVType } from 'react-native-mmkv';
import { GameSettings } from '../types/game';

let storageInstance: MMKVType | { set: (key: string, value: string) => void; getString: (key: string) => string | undefined };

try {
    const { MMKV } = require('react-native-mmkv');
    storageInstance = new MMKV();
} catch (e) {
    console.warn('MMKV initialization failed, falling back to in-memory storage:', e);
    const memoryStorage = new Map<string, string>();
    storageInstance = {
        set: (key: string, value: string) => {
            memoryStorage.set(key, value);
        },
        getString: (key: string) => {
            return memoryStorage.get(key);
        }
    };
}

export const storage = storageInstance;

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
