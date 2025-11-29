import { BlurMask, Circle, Group } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { SharedValue, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Coordinate } from '../../types/game';

interface Props {
    position: SharedValue<Coordinate>;
    cellSize: number;
}

export const FoodRenderer = ({ position, cellSize }: Props) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(withTiming(1.2, { duration: 500 }), -1, true);
    }, []);

    const cx = useDerivedValue(() => {
        return position.value.x * cellSize + cellSize / 2;
    }, [position, cellSize]);

    const cy = useDerivedValue(() => {
        return position.value.y * cellSize + cellSize / 2;
    }, [position, cellSize]);

    const r = cellSize / 2 - 2;

    const animatedR = useDerivedValue(() => {
        return r * scale.value;
    }, [r, scale]);

    return (
        <Group>
            {/* Outer Glow */}
            <Circle cx={cx} cy={cy} r={animatedR} color={Colors.dark.error} opacity={0.5}>
                <BlurMask blur={10} style="normal" />
            </Circle>
            {/* Core */}
            <Circle cx={cx} cy={cy} r={r} color={Colors.dark.error}>
                <BlurMask blur={2} style="solid" />
            </Circle>
        </Group>
    );
};
