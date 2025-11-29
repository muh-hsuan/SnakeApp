import React from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Circle, Group } from '@shopify/react-native-skia';
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
            <Circle cx={cx} cy={cy} r={r} color="#FF5252" />
        </Group>
    );
};
