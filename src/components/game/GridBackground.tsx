import { Group, Line, vec } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
    width: number;
    height: number;
    cellSize: number;
}

export const GridBackground = ({ width, height, cellSize }: Props) => {
    const opacity = useSharedValue(0.1);
    const scale = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
        scale.value = withRepeat(
            withTiming(1.02, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const renderGrid = () => {
        const lines = [];
        // Vertical lines
        for (let x = 0; x <= width; x += cellSize) {
            lines.push(
                <Line
                    key={`v-${x}`}
                    p1={vec(x, 0)}
                    p2={vec(x, height)}
                    color="white"
                    strokeWidth={1}
                    opacity={opacity}
                />
            );
        }
        // Horizontal lines
        for (let y = 0; y <= height; y += cellSize) {
            lines.push(
                <Line
                    key={`h-${y}`}
                    p1={vec(0, y)}
                    p2={vec(width, y)}
                    color="white"
                    strokeWidth={1}
                    opacity={opacity}
                />
            );
        }
        return lines;
    };

    return (
        <Group>
            {renderGrid()}
        </Group>
    );
};
