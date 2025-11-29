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

    const JOYSTICK_SIZE = 150;
    const KNOB_SIZE = JOYSTICK_SIZE / 3;
    const MAX_RANGE = JOYSTICK_SIZE / 2 - KNOB_SIZE / 2;

    const [snakeColor, setSnakeColor] = React.useState(Colors.dark.primary);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSettings();
            const skin = SKINS.find(s => s.id === settings.skinId);
            if (skin) setSnakeColor(skin.color);
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

            if (absX > 20 || absY > 20) {
                let dir: Direction;
                if (absX > absY) {
                    dir = knobX.value > 0 ? Direction.RIGHT : Direction.LEFT;
                } else {
                    dir = knobY.value > 0 ? Direction.DOWN : Direction.UP;
                }
                runOnJS(handleSwipe)(dir);
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
                <GestureDetector gesture={panGesture}>
                    <View style={styles.container}>
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
                        <View style={[styles.hud, { top: insets.top + 10 }]}>
                            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
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
                </GestureDetector>
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
});
