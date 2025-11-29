import { Coordinate } from './game';

export enum ItemType {
    FOOD = 'FOOD',
    GOLDEN_APPLE = 'GOLDEN_APPLE',
    MAGNET = 'MAGNET',
}

export interface GameItem {
    id: string;
    type: ItemType;
    position: Coordinate;
    expiresAt?: number; // Timestamp for when item disappears
}

export interface ActiveEffect {
    type: ItemType;
    expiresAt: number;
}
