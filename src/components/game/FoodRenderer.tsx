import { BlurMask, Circle, Group } from '@shopify/react-native-skia';
import React from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Coordinate } from '../../types/game';

interface Props {
    position: SharedValue<Coordinate>;
    cellSize: number;
}

export const FoodRenderer = ({ position, cellSize }: Props) => {
    const cx = useDerivedValue(() => {
        return position.value.x * cellSize + cellSize / 2;
    }, [position, cellSize]);

    const cy = useDerivedValue(() => {
        return position.value.y * cellSize + cellSize / 2;
    }, [position, cellSize]);

    const r = cellSize / 2 - 2; // Padding

    return (
        <Group>
            <Circle cx={cx} cy={cy} r={r} color={Colors.dark.error}>
                <BlurMask blur={5} style="solid" />
            </Circle>
        </Group>
    );
};
