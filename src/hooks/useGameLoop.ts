import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { isValidTurn } from '../managers/InputManager';
import { Coordinate, Direction, GameState } from '../types/game';
import { ActiveEffect, GameItem, ItemType } from '../types/items';
import { getSettings, saveSettings } from '../utils/storage';

const TICK_RATE = 10;
const TICK_DURATION = 1000 / TICK_RATE;
const ITEM_SPAWN_CHANCE = 0.1; // 10% chance to spawn item when eating food
const MAGNET_DURATION = 5000; // 5 seconds

export const useGameLoop = (rows: number = 30, cols: number = 20) => {
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Shared Values for UI Thread
    const snakeBody = useSharedValue<Coordinate[]>([{ x: 10, y: 10 }]);
    const foodPosition = useSharedValue<Coordinate>({ x: 5, y: 5 });
    const activeItems = useSharedValue<GameItem[]>([]);

    // Particles
    const eatParticleTrigger = useSharedValue(0);
    const eatParticlePosition = useSharedValue<Coordinate>({ x: 0, y: 0 });

    // Refs for Logic Thread
    const currentDirection = useRef<Direction>(Direction.RIGHT);
    const nextDirection = useRef<Direction>(Direction.RIGHT);
    const lastTime = useRef<number>(0);
    const accumulator = useRef<number>(0);
    const reqId = useRef<number | null>(null);
    const activeEffects = useRef<ActiveEffect[]>([]);

    // State Refs to avoid stale closures in RAF
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
            // Placeholder: Ensure these files exist or handle error
            // const { sound: eat } = await Audio.Sound.createAsync(require('@assets/sounds/eat.mp3'));
            // eatSound.current = eat;
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
        activeItems.value = [];
        activeEffects.current = [];
        generateNewFood();
        lastTime.current = performance.now();
        accumulator.current = 0;

        if (reqId.current) cancelAnimationFrame(reqId.current);
        reqId.current = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
        if (reqId.current) {
            cancelAnimationFrame(reqId.current);
            reqId.current = null;
        }
    };

    const handleGameOver = async () => {
        stopLoop();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Delay showing game over screen
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
        let isOnSnake = true;
        while (isOnSnake) {
            newFood = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows),
            };
            isOnSnake = false;
            for (const segment of snakeBody.value) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    isOnSnake = true;
                    break;
                }
            }
            // Check items
            for (const item of activeItems.value) {
                if (item.position.x === newFood.x && item.position.y === newFood.y) {
                    isOnSnake = true;
                    break;
                }
            }
        }
        foodPosition.value = newFood!;
    };

    const spawnItem = () => {
        if (Math.random() > ITEM_SPAWN_CHANCE) return;

        const type = Math.random() > 0.5 ? ItemType.GOLDEN_APPLE : ItemType.MAGNET;
        let newItemPos: Coordinate;
        let isOccupied = true;

        // Try 10 times to find a spot
        let attempts = 0;
        while (isOccupied && attempts < 10) {
            newItemPos = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows),
            };
            isOccupied = false;
            // Check snake
            for (const segment of snakeBody.value) {
                if (segment.x === newItemPos.x && segment.y === newItemPos.y) {
                    isOccupied = true;
                    break;
                }
            }
            // Check food
            if (foodPosition.value.x === newItemPos.x && foodPosition.value.y === newItemPos.y) {
                isOccupied = true;
            }
            // Check existing items
            for (const item of activeItems.value) {
                if (item.position.x === newItemPos.x && item.position.y === newItemPos.y) {
                    isOccupied = true;
                    break;
                }
            }
            attempts++;
        }

        if (!isOccupied) {
            activeItems.value = [...activeItems.value, {
                id: Math.random().toString(),
                type,
                position: newItemPos!
            }];
        }
    };

    const loop = (time: number) => {
        if (gameStateRef.current !== GameState.PLAYING) return;

        const deltaTime = time - lastTime.current;
        lastTime.current = time;
        accumulator.current += deltaTime;

        while (accumulator.current >= TICK_DURATION) {
            updatePhysics();
            accumulator.current -= TICK_DURATION;
        }

        reqId.current = requestAnimationFrame(loop);
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

        // Check Active Effects
        const now = Date.now();
        activeEffects.current = activeEffects.current.filter(e => e.expiresAt > now);
        const hasMagnet = activeEffects.current.some(e => e.type === ItemType.MAGNET);

        if (hasMagnet) {
            // Simple magnet logic: move food towards head if close? 
            // Or just attract food from anywhere. Let's do simple attraction.
            // Actually, moving food might be weird if it jumps. 
            // Let's just make the collection radius larger? No, grid based.
            // Let's make food move 1 step towards snake every few ticks?
            // For simplicity in this loop, let's just say if magnet is active, 
            // and food is within 5 blocks, it gets sucked in (auto-collected).

            const dx = foodPosition.value.x - newHead.x;
            const dy = foodPosition.value.y - newHead.y;
            const dist = Math.abs(dx) + Math.abs(dy);

            if (dist > 0 && dist < 5) {
                // Move food towards snake
                let newFoodPos = { ...foodPosition.value };
                if (Math.abs(dx) > Math.abs(dy)) {
                    newFoodPos.x -= Math.sign(dx);
                } else {
                    newFoodPos.y -= Math.sign(dy);
                }
                foodPosition.value = newFoodPos;
            }
        }

        // Check Item Collection
        let collectedItemIndex = -1;
        for (let i = 0; i < activeItems.value.length; i++) {
            const item = activeItems.value[i];
            if (item.position.x === newHead.x && item.position.y === newHead.y) {
                collectedItemIndex = i;
                break;
            }
        }

        if (collectedItemIndex !== -1) {
            const item = activeItems.value[collectedItemIndex];
            // Remove item
            const newItems = [...activeItems.value];
            newItems.splice(collectedItemIndex, 1);
            activeItems.value = newItems;

            // Apply Effect
            if (item.type === ItemType.GOLDEN_APPLE) {
                setScore(s => s + 50);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (item.type === ItemType.MAGNET) {
                activeEffects.current.push({
                    type: ItemType.MAGNET,
                    expiresAt: Date.now() + MAGNET_DURATION
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }

        // Eat Food
        let newBody = [newHead, ...snakeBody.value];
        if (newHead.x === foodPosition.value.x && newHead.y === foodPosition.value.y) {
            setScore(s => s + 10);

            // Trigger particles
            eatParticlePosition.value = { ...newHead };
            eatParticleTrigger.value = eatParticleTrigger.value + 1;

            generateNewFood();
            spawnItem();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Play sound
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
        activeItems,
        eatParticleTrigger,
        eatParticlePosition,
        startGame,
        handleSwipe,
        setGameState
    };
};
