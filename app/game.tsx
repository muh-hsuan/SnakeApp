import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { GameCanvas } from '../src/components/game/GameCanvas';
import { VirtualJoystick } from '../src/components/ui/VirtualJoystick';
import { useGameLoop } from '../src/hooks/useGameLoop';
import { Direction, GameState } from '../src/types/game';

export default function Game() {
    const { width, height } = useWindowDimensions();
    const {
        snakeBody,
        foodPosition,
        activeItems,
        eatParticleTrigger,
        eatParticlePosition,
        startGame,
        handleSwipe,
        score,
        gameState,
        setGameState
    } = useGameLoop();
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

    useEffect(() => {
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
            <GestureDetector gesture={panGesture}>
                <View style={styles.container}>
                    <GameCanvas
                        snakeBody={snakeBody}
                        foodPosition={foodPosition}
                        activeItems={activeItems}
                        eatParticleTrigger={eatParticleTrigger}
                        eatParticlePosition={eatParticlePosition}
                        rows={30}
                        cols={20}
                        width={width}
                        height={height}
                    />
                    <View style={styles.hud}>
                        <Text style={styles.score}>Score: {score}</Text>
                    </View>

                    <Animated.View style={[joystickContainerStyle, { pointerEvents: 'none' }]}>
                        <VirtualJoystick knobX={knobX} knobY={knobY} size={JOYSTICK_SIZE} />
                    </Animated.View>

                    {gameState === GameState.GAMEOVER && (
                        <View style={styles.overlay}>
                            <Text style={styles.gameOverText}>Game Over</Text>
                            <Text style={styles.finalScore}>Final Score: {score}</Text>
                            <Text style={styles.restartText} onPress={startGame}>Tap to Restart</Text>
                            <Text style={styles.exitText} onPress={() => router.back()}>Exit</Text>
                        </View>
                    )}
                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    hud: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
    },
    score: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    gameOverText: {
        color: '#FF5252',
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    finalScore: {
        color: 'white',
        fontSize: 24,
        marginBottom: 40,
    },
    restartText: {
        color: '#4CAF50',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    exitText: {
        color: '#aaa',
        fontSize: 20,
    },
});
