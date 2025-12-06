import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameCanvas } from '../src/components/game/GameCanvas';
import { GameControls } from '../src/components/game/GameControls';
import { GameHUD } from '../src/components/game/GameHUD';
import { GlassButton } from '../src/components/ui/GlassButton';
import { GlassCard } from '../src/components/ui/GlassCard';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { VirtualJoystick } from '../src/components/ui/VirtualJoystick';
import { Colors } from '../src/constants/Colors';
import { SKINS } from '../src/constants/Skins';
import { useGameLoop } from '../src/hooks/useGameLoop';
import { Direction, GameMode, GameState } from '../src/types/game';
import { getSettings } from '../src/utils/storage';

export default function Game() {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const gameMode = (params.mode as GameMode) || GameMode.CLASSIC;

    const {
        gameState,
        score,
        highScore,
        snakeBody,
        foodPosition,
        aiSnakes,
        eatParticleTrigger,
        eatParticlePosition,
        currentDirectionShared,
        startGame,
        handleSwipe,
        setGameState
    } = useGameLoop(30, 20, gameMode);
    const router = useRouter();

    // Joystick State
    const joystickX = useSharedValue(0);
    const joystickY = useSharedValue(0);
    const joystickOpacity = useSharedValue(0);
    const knobX = useSharedValue(0);
    const knobY = useSharedValue(0);
    const smartTurnEnabled = useSharedValue(false);

    const JOYSTICK_SIZE = 150;
    const KNOB_SIZE = JOYSTICK_SIZE / 3;
    const MAX_RANGE = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2;

    const [snakeColor, setSnakeColor] = React.useState(Colors.dark.primary);
    const [snakeColors, setSnakeColors] = React.useState<string[] | undefined>(undefined);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSettings();
            const skin = SKINS.find(s => s.id === settings.skinId);
            if (skin) {
                setSnakeColor(skin.color);
                setSnakeColors(skin.colors);
            }
            smartTurnEnabled.value = settings.smartTurn;
        };
        loadSettings();
        startGame();
    }, []);

    const panGesture = Gesture.Pan()
        .onBegin((e) => {
            joystickX.value = e.x;
            joystickY.value = e.y;
            joystickOpacity.value = withTiming(1, { duration: 100 });
            knobX.value = 0;
            knobY.value = 0;
        })
        .onUpdate((e) => {
            knobX.value = Math.min(Math.max(e.translationX, -MAX_RANGE), MAX_RANGE);
            knobY.value = Math.min(Math.max(e.translationY, -MAX_RANGE), MAX_RANGE);

            const absX = Math.abs(knobX.value);
            const absY = Math.abs(knobY.value);

            // Diagonal Threshold
            const DIAGONAL_THRESHOLD = 30;

            if (absX > DIAGONAL_THRESHOLD || absY > DIAGONAL_THRESHOLD) {
                let dir: Direction | null = null;

                // Calculate ratio to determine if it's truly diagonal
                // We want to avoid accidental diagonals when moving cardinally.
                // A true diagonal is 45 degrees (ratio 1.0).
                // If the minor axis is less than 50% of the major axis, treat it as cardinal.
                const ratio = Math.min(absX, absY) / Math.max(absX, absY);
                const IS_DIAGONAL = ratio > 0.5;

                // Check for diagonal input
                if (IS_DIAGONAL && absX > DIAGONAL_THRESHOLD && absY > DIAGONAL_THRESHOLD) {
                    // Diagonal Input Detected
                    const dirX = knobX.value > 0 ? Direction.RIGHT : Direction.LEFT;
                    const dirY = knobY.value > 0 ? Direction.DOWN : Direction.UP;

                    if (smartTurnEnabled.value) {
                        // Smart Turn: Strict Dominant Axis
                        dir = absX > absY ? dirX : dirY;
                    } else {
                        // Classic Behavior: Toggle Logic
                        const currentDir = currentDirectionShared.value;

                        // If moving in X direction, switch to Y
                        if (currentDir === dirX) {
                            dir = dirY;
                        }
                        // If moving in Y direction, switch to X
                        else if (currentDir === dirY) {
                            dir = dirX;
                        }
                        // If current direction is opposite to X (invalid turn), must go Y
                        else if ((currentDir === Direction.LEFT && dirX === Direction.RIGHT) ||
                            (currentDir === Direction.RIGHT && dirX === Direction.LEFT)) {
                            dir = dirY;
                        }
                        // If current direction is opposite to Y (invalid turn), must go X
                        else if ((currentDir === Direction.UP && dirY === Direction.DOWN) ||
                            (currentDir === Direction.DOWN && dirY === Direction.UP)) {
                            dir = dirX;
                        }
                        // Default to dominant axis if no toggle needed (or initial move)
                        else {
                            dir = absX > absY ? dirX : dirY;
                        }
                    }

                } else {
                    // Cardinal Input (Standard)
                    if (absX > absY) {
                        dir = knobX.value > 0 ? Direction.RIGHT : Direction.LEFT;
                    } else {
                        dir = knobY.value > 0 ? Direction.DOWN : Direction.UP;
                    }
                }

                if (dir !== null) {
                    runOnJS(handleSwipe)(dir);
                }
            }
        })
        .onEnd(() => {
            joystickOpacity.value = withTiming(0, { duration: 200 });
            knobX.value = withSpring(0);
            knobY.value = withSpring(0);
        })
        .onFinalize(() => {
            // Ensure opacity is 0 if cancelled
            if (joystickOpacity.value > 0) {
                joystickOpacity.value = withTiming(0, { duration: 200 });
            }
        });

    const joystickContainerStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: joystickX.value - JOYSTICK_SIZE / 2,
        top: joystickY.value - JOYSTICK_SIZE / 2,
        opacity: joystickOpacity.value,
    }));

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" hidden={false} />
            <ScreenBackground>
                <View style={styles.container}>
                    <GestureDetector gesture={panGesture}>
                        <View style={{ flex: 1 }}>
                            <GameCanvas
                                snakeBody={snakeBody}
                                foodPosition={foodPosition}
                                eatParticleTrigger={eatParticleTrigger}
                                eatParticlePosition={eatParticlePosition}
                                rows={30}
                                cols={20}
                                width={width}
                                height={height}
                                insets={insets}
                                snakeColor={snakeColor}
                                snakeColors={snakeColors}
                                aiSnakes={aiSnakes}
                            />
                        </View>
                    </GestureDetector>

                    <GameHUD score={score} highScore={highScore} />

                    <GameControls currentDirectionShared={currentDirectionShared} handleSwipe={handleSwipe} />

                    <Animated.View style={[joystickContainerStyle, { pointerEvents: 'none' }]}>
                        <VirtualJoystick knobX={knobX} knobY={knobY} size={JOYSTICK_SIZE} />
                    </Animated.View>

                    {gameState === GameState.GAMEOVER && (
                        <Animated.View entering={FadeIn} style={styles.overlay}>
                            <GlassCard style={styles.gameOverCard} intensity={40}>
                                <Text style={styles.gameOverText}>GAME OVER</Text>
                                <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
                                <Text style={styles.finalScoreValue}>{score}</Text>

                                <View style={styles.buttonContainer}>
                                    <GlassButton
                                        title="Restart"
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            startGame();
                                        }}
                                        variant="primary"
                                        style={styles.button}
                                    />
                                    <GlassButton
                                        title="Exit"
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.back();
                                        }}
                                        variant="secondary"
                                        style={styles.button}
                                    />
                                </View>
                            </GlassCard>
                        </Animated.View>
                    )}
                </View>
            </ScreenBackground>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        padding: 20,
    },
    gameOverCard: {
        width: '100%',
        maxWidth: 340,
        padding: 30,
        alignItems: 'center',
    },
    gameOverText: {
        color: Colors.dark.error,
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 20,
        letterSpacing: 2,
    },
    finalScoreLabel: {
        color: Colors.dark.textDim,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    finalScoreValue: {
        color: Colors.dark.text,
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
    },
    button: {
        width: '100%',
    },
});
