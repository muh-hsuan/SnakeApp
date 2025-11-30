import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';

interface Props {
    value: number; // 0 to 1
    onValueChange: (value: number) => void;
    width?: number;
    height?: number;
}

export const CustomSlider = ({ value, onValueChange, width = 200, height = 40 }: Props) => {
    const progress = useSharedValue(value);
    const isPressed = useSharedValue(false);

    // Update shared value if prop changes externally
    React.useEffect(() => {
        progress.value = withSpring(value);
    }, [value]);

    const pan = Gesture.Pan()
        .onBegin(() => {
            isPressed.value = true;
        })
        .onUpdate((e) => {
            const newProgress = Math.max(0, Math.min(1, e.x / width));
            progress.value = newProgress;
            runOnJS(onValueChange)(newProgress);
        })
        .onEnd(() => {
            isPressed.value = false;
        })
        .onFinalize(() => {
            isPressed.value = false;
        });

    const tap = Gesture.Tap()
        .onBegin((e) => {
            const newProgress = Math.max(0, Math.min(1, e.x / width));
            progress.value = withSpring(newProgress);
            runOnJS(onValueChange)(newProgress);
        });

    const composed = Gesture.Race(pan, tap);

    const knobStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: progress.value * width - 10 }, // Center knob (20px width)
            { scale: isPressed.value ? 1.2 : 1 },
        ],
    }));

    const trackFillStyle = useAnimatedStyle(() => ({
        width: progress.value * width,
    }));

    return (
        <GestureDetector gesture={composed}>
            <View style={[styles.container, { width, height }]}>
                {/* Track Background */}
                <View style={[styles.track, { width }]} />

                {/* Track Fill */}
                <Animated.View style={[styles.trackFill, trackFillStyle]} />

                {/* Knob */}
                <Animated.View style={[styles.knob, knobStyle]} />
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
    },
    track: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        position: 'absolute',
    },
    trackFill: {
        height: 4,
        backgroundColor: Colors.dark.primary,
        borderRadius: 2,
        position: 'absolute',
    },
    knob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
});
