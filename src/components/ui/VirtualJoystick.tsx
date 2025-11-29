import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Direction } from '../../types/game';

interface Props {
    onDirectionChange: (dir: Direction) => void;
    size?: number;
}

export const VirtualJoystick = ({ onDirectionChange, size = 150 }: Props) => {
    const knobSize = size / 3;
    const maxRange = size / 2 - knobSize / 2;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = Math.min(Math.max(e.translationX, -maxRange), maxRange);
            translateY.value = Math.min(Math.max(e.translationY, -maxRange), maxRange);

            // Calculate direction
            const absX = Math.abs(translateX.value);
            const absY = Math.abs(translateY.value);

            if (absX > 20 || absY > 20) { // Deadzone
                let dir: Direction;
                if (absX > absY) {
                    dir = translateX.value > 0 ? Direction.RIGHT : Direction.LEFT;
                } else {
                    dir = translateY.value > 0 ? Direction.DOWN : Direction.UP;
                }
                runOnJS(onDirectionChange)(dir);
            }
        })
        .onEnd(() => {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const knobStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.knob, { width: knobSize, height: knobSize, borderRadius: knobSize / 2 }, knobStyle]} />
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    knob: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
});
