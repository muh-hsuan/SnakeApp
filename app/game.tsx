import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useGameLoop } from '../src/hooks/useGameLoop';
import { GameCanvas } from '../src/components/game/GameCanvas';
import { VirtualJoystick } from '../src/components/ui/VirtualJoystick';
import { Direction, GameState } from '../src/types/game';
import { runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export default function Game() {
    const { width, height } = useWindowDimensions();
    const {
        snakeBody,
        foodPosition,
        eatParticleTrigger,
        eatParticlePosition,
        startGame,
        handleSwipe,
        score,
        gameState,
        setGameState
    } = useGameLoop();
    const router = useRouter();

    useEffect(() => {
        startGame();
    }, []);

    const panGesture = Gesture.Pan()
        .onEnd((e) => {
            const { translationX, translationY } = e;
            if (Math.abs(translationX) > Math.abs(translationY)) {
                if (translationX > 0) runOnJS(handleSwipe)(Direction.RIGHT);
                else runOnJS(handleSwipe)(Direction.LEFT);
            } else {
                if (translationY > 0) runOnJS(handleSwipe)(Direction.DOWN);
                else runOnJS(handleSwipe)(Direction.UP);
            }
        });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                    />
                    <View style={styles.hud}>
                        <Text style={styles.score}>Score: {score}</Text>
                    </View>

                    {/* Optional: Show Joystick if enabled in settings (defaulting to hidden for now, or overlay) */}
                    {/* For Polish phase, let's add it as an overlay in the bottom right */}
                    <View style={styles.joystickContainer}>
                        <VirtualJoystick onDirectionChange={handleSwipe} />
                    </View>

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
    joystickContainer: {
        position: 'absolute',
        bottom: 50,
        right: 50,
        opacity: 0.5,
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
