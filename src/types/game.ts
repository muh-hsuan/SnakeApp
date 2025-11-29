export interface Coordinate {
  x: number;
  y: number;
}

export enum Direction {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  highScore: number;
  skinId: string;
}
