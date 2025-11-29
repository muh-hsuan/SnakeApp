import { BlurMask, Circle, Group, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import React from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Coordinate } from '../../types/game';

interface Props {
    body: SharedValue<Coordinate[]>;
    cellSize: number;
}

export const SnakeRenderer = ({ body, cellSize }: Props) => {
    const path = useDerivedValue(() => {
        const p = Skia.Path.Make();
        const currentBody = body.value;

        currentBody.forEach((segment) => {
            const rect = Skia.XYWHRect(
                segment.x * cellSize,
                segment.y * cellSize,
                cellSize,
                cellSize
            );
            p.addRect(rect);
        });
        return p;
    }, [body, cellSize]);

    const headPosition = useDerivedValue(() => {
        const head = body.value[0];
        if (!head) return { x: 0, y: 0 };
        return {
            x: head.x * cellSize + cellSize / 2,
            y: head.y * cellSize + cellSize / 2
        };
    }, [body, cellSize]);

    return (
        <Group>
            {/* Body with Gradient */}
            <Path path={path}>
                <SweepGradient
                    c={vec(0, 0)}
                    colors={[Colors.dark.primary, Colors.dark.accent, Colors.dark.primary]}
                />
                <BlurMask blur={5} style="solid" />
            </Path>

            {/* Eyes (Simple implementation) */}
            <Circle cx={headPosition.value.x} cy={headPosition.value.y} r={cellSize / 3} color="white" />
            <Circle cx={headPosition.value.x} cy={headPosition.value.y} r={cellSize / 6} color="black" />
        </Group>
    );
};
