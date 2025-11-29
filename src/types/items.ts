import { Coordinate } from './game';

export enum ItemType {
    FOOD = 'FOOD',
    GOLDEN_APPLE = 'GOLDEN_APPLE',
    MAGNET = 'MAGNET',
}

export interface GameItem {
    id: string;
    type: ItemType;
    position: { x: number; y: number };
    expiresAt?: number; // Timestamp
}

export interface ActiveEffect {
    type: ItemType;
    expiresAt: number;
}
