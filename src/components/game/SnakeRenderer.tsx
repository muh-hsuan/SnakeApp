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

    const headX = useDerivedValue(() => {
        const head = body.value[0];
        return head ? head.x * cellSize + cellSize / 2 : 0;
    }, [body, cellSize]);

    const headY = useDerivedValue(() => {
        const head = body.value[0];
        return head ? head.y * cellSize + cellSize / 2 : 0;
    }, [body, cellSize]);

    return (
        <Group>
            {/* Outer Glow */}
            <Path path={path} color={Colors.dark.primary} style="stroke" strokeWidth={cellSize} opacity={0.6}>
                <BlurMask blur={15} style="normal" />
            </Path>

            {/* Body with Gradient */}
            <Path path={path}>
                <SweepGradient
                    c={vec(0, 0)}
                    colors={[Colors.dark.primary, Colors.dark.accent, Colors.dark.primary]}
                />
                <BlurMask blur={2} style="solid" />
            </Path>

            {/* Eyes (Simple implementation) */}
            <Circle cx={headX} cy={headY} r={cellSize / 3} color="white" />
            <Circle cx={headX} cy={headY} r={cellSize / 6} color="black" />
        </Group>
    );
};
