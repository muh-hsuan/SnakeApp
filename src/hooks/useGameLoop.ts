import { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Coordinate, Direction, GameState } from '../types/game';
import { isValidTurn } from '../managers/InputManager';
import { saveSettings, getSettings } from '../utils/storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const TICK_RATE = 15;
const TICK_DURATION = 1000 / TICK_RATE;

export const useGameLoop = (rows: number = 30, cols: number = 20) => {
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Shared Values for UI Thread
    const snakeBody = useSharedValue<Coordinate[]>([{ x: 10, y: 10 }]);
    const foodPosition = useSharedValue<Coordinate>({ x: 5, y: 5 });

    // Particles
    const eatParticleTrigger = useSharedValue(0);
    const eatParticlePosition = useSharedValue<Coordinate>({ x: 0, y: 0 });

    // Refs for Logic Thread
    const currentDirection = useRef<Direction>(Direction.RIGHT);
    const nextDirection = useRef<Direction>(Direction.RIGHT);
    const lastTime = useRef<number>(0);
    const accumulator = useRef<number>(0);
    const reqId = useRef<number | null>(null);

    // State Refs to avoid stale closures in RAF
    const gameStateRef = useRef<GameState>(GameState.IDLE);
    const scoreRef = useRef(0);

    // Audio
    const eatSound = useRef<Audio.Sound | null>(null);
    const dieSound = useRef<Audio.Sound | null>(null);

    useEffect(() => {
        const settings = getSettings();
        setHighScore(settings.highScore);
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

    const handleGameOver = () => {
        stopLoop();
        setGameState(GameState.GAMEOVER);
        const currentScore = scoreRef.current;
        if (currentScore > highScore) {
            setHighScore(currentScore);
            saveSettings({ ...getSettings(), highScore: currentScore });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        }
        foodPosition.value = newFood!;
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

        // Wall Collision
        if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
            handleGameOver();
            return;
        }

        // Self Collision
        for (const segment of snakeBody.value) {
            if (newHead.x === segment.x && newHead.y === segment.y) {
                handleGameOver();
                return;
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
        eatParticleTrigger,
        eatParticlePosition,
        startGame,
        handleSwipe,
        setGameState
    };
};
