import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { isValidTurn } from '../managers/InputManager';
import { AISnake, Coordinate, Direction, GameMode, GameState } from '../types/game';
import { getSettings, saveSettings } from '../utils/storage';

const TICK_RATE = 10;
const TICK_DURATION = 1000 / TICK_RATE;

const AI_RESPAWN_DELAY = 10000; // 10 seconds
const AI_FOOD_DELAY = 5000; // 5 seconds

export const useGameLoop = (rows: number = 30, cols: number = 20, gameMode: GameMode = GameMode.CLASSIC) => {
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Shared Values for UI Thread
    const snakeBody = useSharedValue<Coordinate[]>([{ x: 10, y: 10 }]);
    const foodPosition = useSharedValue<Coordinate>({ x: 5, y: 5 });

    const aiSnakes = useSharedValue<AISnake[]>([]);

    // Particles
    const eatParticleTrigger = useSharedValue(0);
    const eatParticlePosition = useSharedValue<Coordinate>({ x: 0, y: 0 });

    // Refs for Logic Thread
    const currentDirection = useRef<Direction>(Direction.RIGHT);
    const nextDirection = useRef<Direction>(Direction.RIGHT);
    const lastTime = useRef<number>(0);
    const accumulator = useRef<number>(0);
    const reqId = useRef<number | null>(null);
    const foodSpawnTime = useRef<number>(0);
    const aiTickCounter = useRef<number>(0);

    // State Refs
    const gameStateRef = useRef<GameState>(GameState.IDLE);
    const scoreRef = useRef(0);
    const highScoreRef = useRef(0);

    // Audio
    const eatSound = useRef<Audio.Sound | null>(null);
    const dieSound = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSettings();
            setHighScore(settings.highScore);
            highScoreRef.current = settings.highScore;
        };
        loadSettings();
        loadSounds();
        return () => {
            unloadSounds();
            stopLoop();
        };
    }, []);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    const loadSounds = async () => {
        try {
            // Placeholder
        } catch (e) {
            console.warn("Failed to load sounds", e);
        }
    };

    const unloadSounds = async () => {
        if (eatSound.current) await eatSound.current.unloadAsync();
        if (dieSound.current) await dieSound.current.unloadAsync();
    };

    const startGame = () => {
        setGameState(GameState.PLAYING);
        setScore(0);
        snakeBody.value = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        currentDirection.current = Direction.RIGHT;
        nextDirection.current = Direction.RIGHT;

        aiTickCounter.current = 0;

        if (gameMode === GameMode.CHALLENGE) {
            spawnAISnakes();
        } else {
            aiSnakes.value = [];
        }

        generateNewFood();
        lastTime.current = performance.now();
        accumulator.current = 0;

        if (reqId.current) cancelAnimationFrame(reqId.current);
        reqId.current = requestAnimationFrame(loop);
    };

    const spawnAISnakes = () => {
        const snakes: AISnake[] = [];
        const colors = ['#FF5252', '#E040FB']; // Red, Purple (Limit to 2)

        for (let i = 0; i < 2; i++) {
            let startX = Math.floor(Math.random() * (cols - 4)) + 2;
            let startY = Math.floor(Math.random() * (rows - 4)) + 2;

            // Simple check to avoid spawning on player
            if (Math.abs(startX - 10) < 5 && Math.abs(startY - 10) < 5) {
                startX += 10;
                if (startX >= cols) startX -= 20;
            }

            snakes.push({
                id: `ai-${i}`,
                body: [{ x: startX, y: startY }, { x: startX, y: startY + 1 }, { x: startX, y: startY + 2 }],
                direction: Direction.UP,
                color: colors[i],
                isDead: false,
                respawnTimer: 0
            });
        }
        aiSnakes.value = snakes;
    };

    const stopLoop = () => {
        if (reqId.current) {
            cancelAnimationFrame(reqId.current);
            reqId.current = null;
        }
    };

    const handleGameOver = async () => {
        stopLoop();
        gameStateRef.current = GameState.GAMEOVER; // Stop logic immediately
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        setTimeout(async () => {
            setGameState(GameState.GAMEOVER);
            const currentScore = scoreRef.current;
            if (currentScore > highScoreRef.current) {
                setHighScore(currentScore);
                highScoreRef.current = currentScore;
                const currentSettings = await getSettings();
                saveSettings({ ...currentSettings, highScore: currentScore });
            }
        }, 500);
    };

    const generateNewFood = () => {
        let newFood: Coordinate;
        let isOccupied = true;
        while (isOccupied) {
            newFood = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows),
            };
            isOccupied = false;

            // Check player
            for (const segment of snakeBody.value) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    isOccupied = true;
                    break;
                }
            }
            // Check AI
            for (const snake of aiSnakes.value) {
                if (snake.isDead) continue;
                for (const segment of snake.body) {
                    if (segment.x === newFood.x && segment.y === newFood.y) {
                        isOccupied = true;
                        break;
                    }
                }
            }
            // Check items
            // for (const item of activeItems.value) {
            //     if (item.position.x === newFood.x && item.position.y === newFood.y) {
            //         isOccupied = true;
            //         break;
            //     }
            // }
        }
        foodPosition.value = newFood!;
        foodSpawnTime.current = Date.now();
    };



    const loop = (time: number) => {
        if (gameStateRef.current !== GameState.PLAYING) return;

        const deltaTime = time - lastTime.current;
        lastTime.current = time;
        accumulator.current += deltaTime;

        while (accumulator.current >= TICK_DURATION) {
            updatePhysics();
            if (gameMode === GameMode.CHALLENGE) {
                // AI moves slower: every 2nd tick
                if (aiTickCounter.current % 2 === 0) {
                    updateAI();
                }
                aiTickCounter.current++;
            }
            accumulator.current -= TICK_DURATION;
        }

        reqId.current = requestAnimationFrame(loop);
    };

    const updateAI = () => {
        const currentAISnakes = [...aiSnakes.value];
        let aiUpdated = false;
        const now = Date.now();

        currentAISnakes.forEach(snake => {
            if (snake.isDead) {
                if (snake.respawnTimer > 0) {
                    snake.respawnTimer -= TICK_DURATION * 2; // Since AI updates half as often
                    if (snake.respawnTimer <= 0) {
                        // Respawn logic
                        let startX = Math.floor(Math.random() * (cols - 4)) + 2;
                        let startY = Math.floor(Math.random() * (rows - 4)) + 2;

                        // Avoid player
                        if (Math.abs(startX - snakeBody.value[0].x) < 5 && Math.abs(startY - snakeBody.value[0].y) < 5) {
                            startX = (startX + 10) % cols;
                        }

                        snake.isDead = false;
                        snake.body = [{ x: startX, y: startY }, { x: startX, y: startY + 1 }, { x: startX, y: startY + 2 }];
                        snake.direction = Direction.UP;
                        aiUpdated = true;
                    } else {
                        aiUpdated = true; // Timer updated
                    }
                }
                return;
            }

            const head = snake.body[0];
            const validMoves: Direction[] = [];

            [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT].forEach(dir => {
                // Prevent 180 turn
                if (!isValidTurn(snake.direction, dir)) return;

                let nextX = head.x;
                let nextY = head.y;
                switch (dir) {
                    case Direction.UP: nextY -= 1; break;
                    case Direction.DOWN: nextY += 1; break;
                    case Direction.LEFT: nextX -= 1; break;
                    case Direction.RIGHT: nextX += 1; break;
                }

                // Wall wrapping check (AI also wraps)
                if (nextX < 0) nextX = cols - 1;
                if (nextX >= cols) nextX = 0;
                if (nextY < 0) nextY = rows - 1;
                if (nextY >= rows) nextY = 0;

                // Check self collision
                let collides = false;
                for (const segment of snake.body) {
                    if (segment.x === nextX && segment.y === nextY) {
                        collides = true;
                        break;
                    }
                }

                // Check player collision (avoid hitting player)
                if (!collides) {
                    for (const segment of snakeBody.value) {
                        if (segment.x === nextX && segment.y === nextY) {
                            collides = true; // Avoid hitting player
                            break;
                        }
                    }
                }

                if (!collides) {
                    validMoves.push(dir);
                }
            });

            let nextDir = snake.direction;
            if (validMoves.length > 0) {
                // Check if should target food
                const canTargetFood = (now - foodSpawnTime.current) > AI_FOOD_DELAY;

                if (canTargetFood) {
                    // Try to move towards food
                    const dx = foodPosition.value.x - head.x;
                    const dy = foodPosition.value.y - head.y;

                    if (Math.abs(dx) > Math.abs(dy)) {
                        const desired = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                        if (validMoves.includes(desired)) nextDir = desired;
                    } else {
                        const desired = dy > 0 ? Direction.DOWN : Direction.UP;
                        if (validMoves.includes(desired)) nextDir = desired;
                    }
                } else {
                    // Random movement if not targeting food
                    if (Math.random() < 0.2 || !validMoves.includes(snake.direction)) {
                        nextDir = validMoves[Math.floor(Math.random() * validMoves.length)];
                    }
                }
            }

            snake.direction = nextDir;

            // Move
            let newHead = { ...head };
            switch (nextDir) {
                case Direction.UP: newHead.y -= 1; break;
                case Direction.DOWN: newHead.y += 1; break;
                case Direction.LEFT: newHead.x -= 1; break;
                case Direction.RIGHT: newHead.x += 1; break;
            }

            // Wall Wrapping
            if (newHead.x < 0) newHead.x = cols - 1;
            if (newHead.x >= cols) newHead.x = 0;
            if (newHead.y < 0) newHead.y = rows - 1;
            if (newHead.y >= rows) newHead.y = 0;

            // Check if eaten food
            let eaten = false;
            if (newHead.x === foodPosition.value.x && newHead.y === foodPosition.value.y) {
                eaten = true;
                generateNewFood(); // AI eats food, respawn it
            }

            const newBody = [newHead, ...snake.body];
            if (!eaten) newBody.pop();
            snake.body = newBody;
            aiUpdated = true;
        });

        if (aiUpdated) {
            aiSnakes.value = currentAISnakes;
        }
    };

    const updatePhysics = () => {
        const dir = nextDirection.current;
        currentDirection.current = dir;

        const head = snakeBody.value[0];
        let newHead = { ...head };

        switch (dir) {
            case Direction.UP: newHead.y -= 1; break;
            case Direction.DOWN: newHead.y += 1; break;
            case Direction.LEFT: newHead.x -= 1; break;
            case Direction.RIGHT: newHead.x += 1; break;
        }

        // Wall Wrapping
        if (newHead.x < 0) newHead.x = cols - 1;
        if (newHead.x >= cols) newHead.x = 0;
        if (newHead.y < 0) newHead.y = rows - 1;
        if (newHead.y >= rows) newHead.y = 0;

        // Self Collision
        for (const segment of snakeBody.value) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
                handleGameOver();
                return;
            }
        }

        // AI Collision
        if (gameMode === GameMode.CHALLENGE) {
            const currentAISnakes = [...aiSnakes.value];
            let aiKilled = false;

            for (const snake of currentAISnakes) {
                if (snake.isDead) continue;

                // Player Head hits AI Body -> Player Dies
                for (const segment of snake.body) {
                    if (newHead.x === segment.x && newHead.y === segment.y) {
                        handleGameOver();
                        return;
                    }
                }

                // AI Head hits Player Body -> AI Dies
                const aiHead = snake.body[0];
                for (const segment of snakeBody.value) {
                    if (aiHead.x === segment.x && aiHead.y === segment.y) {
                        // AI hit player body
                        snake.isDead = true;
                        snake.respawnTimer = AI_RESPAWN_DELAY;
                        setScore(s => s + 100); // Bonus for killing AI
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        aiKilled = true;
                        break;
                    }
                }

                // Head to Head -> Both Die? Or Player Wins? Let's say Player Dies for difficulty
                if (newHead.x === aiHead.x && newHead.y === aiHead.y) {
                    handleGameOver();
                    return;
                }
            }

            if (aiKilled) {
                aiSnakes.value = currentAISnakes;
            }
        }

        // Check Active Effects - REMOVED
        // Check Item Collection - REMOVED

        // Eat Food
        let newBody = [newHead, ...snakeBody.value];
        if (newHead.x === foodPosition.value.x && newHead.y === foodPosition.value.y) {
            setScore(s => s + 10);
            eatParticlePosition.value = { ...newHead };
            eatParticleTrigger.value = eatParticleTrigger.value + 1;
            generateNewFood();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            newBody.pop();
        }

        snakeBody.value = newBody;
    };

    const handleSwipe = (dir: Direction) => {
        if (gameStateRef.current !== GameState.PLAYING) return;
        if (isValidTurn(currentDirection.current, dir)) {
            nextDirection.current = dir;
        }
    };

    return {
        gameState,
        score,
        highScore,
        snakeBody,
        foodPosition,
        aiSnakes,
        eatParticleTrigger,
        eatParticlePosition,
        startGame,
        handleSwipe,
        setGameState
    };
};
