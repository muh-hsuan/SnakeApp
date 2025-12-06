import { BlurMask, Circle, Group, Path, Picture, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import React from 'react';
import { SharedValue, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Coordinate } from '../../types/game';

interface Props {
    body: SharedValue<Coordinate[]>;
    cellSize: number;
    color?: string;
    colors?: string[];
    gridWidth?: number;
    gridHeight?: number;
}

export const SnakeRenderer = ({ body, cellSize, color = Colors.dark.primary, colors, gridWidth = 400, gridHeight = 800 }: Props) => {
    const breath = useSharedValue(0.2);

    React.useEffect(() => {
        breath.value = withRepeat(
            withTiming(0.5, { duration: 1500 }),
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

                // Draw Rounded Tail
                if (dx === 1) { // Prev is Right, Point Left
                    p.moveTo(x + s, y);
                    p.lineTo(x + s, y + s);
                    p.quadTo(x, y + s, x, y + s / 2);
                    p.quadTo(x, y, x + s, y);
                    p.close();
                } else if (dx === -1) { // Prev is Left, Point Right
                    p.moveTo(x, y + s);
                    p.lineTo(x, y);
                    p.quadTo(x + s, y, x + s, y + s / 2);
                    p.quadTo(x + s, y + s, x, y + s);
                    p.close();
                } else if (dy === 1) { // Prev is Down, Point Up
                    p.moveTo(x + s, y + s);
                    p.lineTo(x, y + s);
                    p.quadTo(x, y, x + s / 2, y);
                    p.quadTo(x + s, y, x + s, y + s);
                    p.close();
                } else if (dy === -1) { // Prev is Up, Point Down
                    p.moveTo(x, y);
                    p.lineTo(x + s, y);
                    p.quadTo(x + s, y + s, x + s / 2, y + s);
                    p.quadTo(x, y + s, x, y);
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
    }, [body, cellSize]);

    const eyesOpacity = useDerivedValue(() => {
        return body.value.length > 0 ? 1 : 0;
    }, [body]);

    const tailX = useDerivedValue(() => {
        const tail = body.value[body.value.length - 1];
        return tail ? tail.x * cellSize + cellSize / 2 : 0;
    }, [body, cellSize]);

    const tailY = useDerivedValue(() => {
        const tail = body.value[body.value.length - 1];
        return tail ? tail.y * cellSize + cellSize / 2 : 0;
    }, [body, cellSize]);

    const bodyPicture = useDerivedValue(() => {
        if (!colors || colors.length === 0) return null;

        const recorder = Skia.PictureRecorder();
        const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, gridWidth, gridHeight));

        const currentBody = body.value;
        currentBody.forEach((segment, index) => {
            const color = colors[index % colors.length];
            const paint = Skia.Paint();
            paint.setColor(Skia.Color(color));

            const x = segment.x * cellSize;
            const y = segment.y * cellSize;
            const s = cellSize;

            // Tail Logic (Last Segment)
            if (index === currentBody.length - 1 && currentBody.length > 1) {
                const prev = currentBody[index - 1];
                const dx = prev.x - segment.x;
                const dy = prev.y - segment.y;

                const tailPath = Skia.Path.Make();

                if (dx === 1) { // Prev is Right
                    tailPath.moveTo(x + s, y);
                    tailPath.lineTo(x + s, y + s);
                    tailPath.quadTo(x, y + s, x, y + s / 2);
                    tailPath.quadTo(x, y, x + s, y);
                } else if (dx === -1) { // Prev is Left
                    tailPath.moveTo(x, y + s);
                    tailPath.lineTo(x, y);
                    tailPath.quadTo(x + s, y, x + s, y + s / 2);
                    tailPath.quadTo(x + s, y + s, x, y + s);
                } else if (dy === 1) { // Prev is Down
                    tailPath.moveTo(x + s, y + s);
                    tailPath.lineTo(x, y + s);
                    tailPath.quadTo(x, y, x + s / 2, y);
                    tailPath.quadTo(x + s, y, x + s, y + s);
                } else if (dy === -1) { // Prev is Up
                    tailPath.moveTo(x, y);
                    tailPath.lineTo(x + s, y);
                    tailPath.quadTo(x + s, y + s, x + s / 2, y + s);
                    tailPath.quadTo(x, y + s, x, y);
                } else {
                    tailPath.addRect(Skia.XYWHRect(x, y, s, s));
                }
                tailPath.close();
                canvas.drawPath(tailPath, paint);
            } else {
                // Body & Head (Square)
                // Draw square to ensure connection
                canvas.drawRect(Skia.XYWHRect(x, y, s, s), paint);
            }
        });

        return recorder.finishRecordingAsPicture();
    }, [body, cellSize, colors, gridWidth, gridHeight]);

    return (
        <Group>
            {/* Outer Glow */}
            <Path path={path} color={color} style="stroke" strokeWidth={cellSize} opacity={breath}>
                <BlurMask blur={20} style="normal" />
            </Path>

            {/* Body Rendering */}
            {colors && bodyPicture ? (
                <Picture picture={bodyPicture as any} />
            ) : (
                <Path path={path}>
                    <SweepGradient
                        c={vec(0, 0)}
                        colors={[color, 'white', color]}
                    />
                    <BlurMask blur={2} style="solid" />
                </Path>
            )}

            {/* Eyes (Simple implementation) */}
            {/* Eyes (Simple implementation) */}
            <Group opacity={eyesOpacity}>
                <Circle cx={headX} cy={headY} r={cellSize / 5} color="white" />
                <Circle cx={headX} cy={headY} r={cellSize / 10} color="black" />
            </Group>
        </Group>
    );
};
