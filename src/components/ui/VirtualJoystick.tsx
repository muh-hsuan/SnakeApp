import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
    knobX: SharedValue<number>;
    knobY: SharedValue<number>;
    size?: number;
}

export const VirtualJoystick = ({ knobX, knobY, size = 150 }: Props) => {
    const knobSize = size / 3;

    const knobStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: knobX.value },
            { translateY: knobY.value },
        ],
    }));

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            <Animated.View style={[styles.knob, { width: knobSize, height: knobSize, borderRadius: knobSize / 2 }, knobStyle]} />
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
