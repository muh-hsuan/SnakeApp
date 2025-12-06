import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameCanvas } from '../src/components/game/GameCanvas';
import { GlassButton } from '../src/components/ui/GlassButton';
import { GlassCard } from '../src/components/ui/GlassCard';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { VirtualJoystick } from '../src/components/ui/VirtualJoystick';
import { Colors } from '../src/constants/Colors';
import { SKINS } from '../src/constants/Skins';
import { useGameLoop } from '../src/hooks/useGameLoop';
import { soundManager } from '../src/managers/SoundManager';
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

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSettings();
            const skin = SKINS.find(s => s.id === settings.skinId);
            if (skin) setSnakeColor(skin.color);
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
                                aiSnakes={aiSnakes}
                            />
                        </View>
                    </GestureDetector>

                    <View style={[styles.hud, { top: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => {
                            soundManager.playSFX('click');
                            router.back();
                        }} activeOpacity={0.8}>
                            <GlassCard style={styles.backButton} intensity={40}>
                                <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
                                <Text style={styles.backButtonText}>MENU</Text>
                            </GlassCard>
                        </TouchableOpacity>

                        <GlassCard style={styles.scoreCard} intensity={20}>
                            <Text style={styles.highScoreLabel}>BEST: {highScore}</Text>
                            <Text style={styles.scoreLabel}>SCORE</Text>
                            <ScoreCounter score={score} />
                        </GlassCard>
                    </View>

                    {/* Custom Control Buttons */}
                    <View style={[styles.controlsContainer, { bottom: insets.bottom + 20 }]}>
                        <TouchableOpacity
                            onPressIn={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const current = currentDirectionShared.value;
                                let nextDir = Direction.DOWN; // Default for Left Button (Bottom/Left)

                                if (current === Direction.LEFT || current === Direction.RIGHT) {
                                    // Horizontal -> Turn DOWN
                                    nextDir = Direction.DOWN;
                                } else {
                                    // Vertical -> Turn LEFT
                                    nextDir = Direction.LEFT;
                                }
                                handleSwipe(nextDir);
                            }}
                            style={styles.controlButtonWrapper}
                            activeOpacity={0.7}
                        >
                            <GlassCard style={styles.controlButton} intensity={30}>
                                <Ionicons
                                    name="arrow-down"
                                    size={32}
                                    color={Colors.dark.text}
                                    style={{ transform: [{ rotate: '45deg' }] }}
                                />
                            </GlassCard>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPressIn={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const current = currentDirectionShared.value;
                                let nextDir = Direction.UP; // Default for Right Button (Top/Right)

                                if (current === Direction.LEFT || current === Direction.RIGHT) {
                                    // Horizontal -> Turn UP
                                    nextDir = Direction.UP;
                                } else {
                                    // Vertical -> Turn RIGHT
                                    nextDir = Direction.RIGHT;
                                }
                                handleSwipe(nextDir);
                            }}
                            style={styles.controlButtonWrapper}
                            activeOpacity={0.7}
                        >
                            <GlassCard style={styles.controlButton} intensity={30}>
                                <Ionicons
                                    name="arrow-up"
                                    size={32}
                                    color={Colors.dark.text}
                                    style={{ transform: [{ rotate: '45deg' }] }}
                                />
                            </GlassCard>
                        </TouchableOpacity>
                    </View>

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

function ScoreCounter({ score }: { score: number }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSequence(
            withTiming(1.5, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );
    }, [score]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.Text style={[styles.scoreValue, style]}>
            {score}
        </Animated.Text>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    hud: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    backButton: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    backButtonText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scoreCard: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    highScoreLabel: {
        color: Colors.dark.accent,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
    },
    scoreLabel: {
        color: Colors.dark.textDim,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scoreValue: {
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: 'bold',
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
    controlsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        zIndex: 5,
    },
    controlButtonWrapper: {
        width: 80,
        height: 80,
    },
    controlButton: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
