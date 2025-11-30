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

export enum GameMode {
  CLASSIC = 'CLASSIC',
  CHALLENGE = 'CHALLENGE',
}

export interface AISnake {
  id: string;
  body: Coordinate[];
  direction: Direction;
  color: string;
  isDead: boolean;
  respawnTimer: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  highScore: number;
  skinId: string;
  bgmVolume: number;
  sfxVolume: number;
}
