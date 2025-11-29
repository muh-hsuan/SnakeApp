import { BlurMask, Circle, Group, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import React from 'react';
import { SharedValue, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Coordinate } from '../../types/game';

interface Props {
    body: SharedValue<Coordinate[]>;
    cellSize: number;
    color?: string;
}

export const SnakeRenderer = ({ body, cellSize, color = Colors.dark.primary }: Props) => {
    const breath = useSharedValue(0.6);

    React.useEffect(() => {
        breath.value = withRepeat(
            withTiming(0.9, { duration: 1500 }),
            -1,
            true
        );
    }, []);

    const path = useDerivedValue(() => {
        const p = Skia.Path.Make();
        const currentBody = body.value;

        currentBody.forEach((segment, index) => {
            // If it's the last segment (tail) and we have more than 1 segment
            if (index === currentBody.length - 1 && currentBody.length > 1) {
                const prev = currentBody[index - 1];
                const dx = prev.x - segment.x;
                const dy = prev.y - segment.y;

                const x = segment.x * cellSize;
                const y = segment.y * cellSize;
                const s = cellSize;

                // Draw Triangle
                if (dx === 1) { // Prev is Right, Point Left
                    p.moveTo(x + s, y);
                    p.lineTo(x + s, y + s);
                    p.lineTo(x, y + s / 2);
                    p.close();
                } else if (dx === -1) { // Prev is Left, Point Right
                    p.moveTo(x, y);
                    p.lineTo(x, y + s);
                    p.lineTo(x + s, y + s / 2);
                    p.close();
                } else if (dy === 1) { // Prev is Down, Point Up
                    p.moveTo(x, y + s);
                    p.lineTo(x + s, y + s);
                    p.lineTo(x + s / 2, y);
                    p.close();
                } else if (dy === -1) { // Prev is Up, Point Down
                    p.moveTo(x, y);
                    p.lineTo(x + s, y);
                    p.lineTo(x + s / 2, y + s);
                    p.close();
                } else {
                    // Fallback (e.g. on top of each other)
                    const rect = Skia.XYWHRect(x, y, s, s);
                    p.addRect(rect);
                }
            } else {
                // Normal Body Segment
                const rect = Skia.XYWHRect(
                    segment.x * cellSize,
                    segment.y * cellSize,
                    cellSize,
                    cellSize
                );
                p.addRect(rect);
            }
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
        return head ? head.y * cellSize + cellSize / 2 : 0;
    }, [body, cellSize]);

    const eyesOpacity = useDerivedValue(() => {
        return body.value.length > 0 ? 1 : 0;
    }, [body]);

    return (
        <Group>
            {/* Outer Glow */}
            <Path path={path} color={color} style="stroke" strokeWidth={cellSize} opacity={breath}>
                <BlurMask blur={15} style="normal" />
            </Path>

            {/* Body with Gradient */}
            <Path path={path}>
                <SweepGradient
                    c={vec(0, 0)}
                    colors={[color, 'white', color]}
                />
                <BlurMask blur={2} style="solid" />
            </Path>

            {/* Eyes (Simple implementation) */}
            {/* Eyes (Simple implementation) */}
            <Group opacity={eyesOpacity}>
                <Circle cx={headX} cy={headY} r={cellSize / 3} color="white" />
                <Circle cx={headX} cy={headY} r={cellSize / 6} color="black" />
            </Group>
        </Group>
    );
};
