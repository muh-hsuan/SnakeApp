import { Direction } from '../types/game';

export const isValidTurn = (current: Direction, next: Direction): boolean => {
    if (current === Direction.UP && next === Direction.DOWN) return false;
    if (current === Direction.DOWN && next === Direction.UP) return false;
    if (current === Direction.LEFT && next === Direction.RIGHT) return false;
    if (current === Direction.RIGHT && next === Direction.LEFT) return false;
    return true;
};
