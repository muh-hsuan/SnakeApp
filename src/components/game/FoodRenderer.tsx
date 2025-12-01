import { BlurMask, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
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
        scale.value = withRepeat(withTiming(1.1, { duration: 600 }), -1, true);
    }, []);

    const transform = useDerivedValue(() => {
        const px = position.value.x * cellSize + cellSize / 2;
        const py = position.value.y * cellSize + cellSize / 2;
        return [
            { translateX: px },
            { translateY: py },
            { scale: scale.value },
        ];
    }, [position, cellSize, scale]);

    const r = cellSize / 2 - 2;

    // Stem Path
    const stemPath = Skia.Path.Make();
    stemPath.moveTo(0, -r * 0.8);
    stemPath.quadTo(r * 0.2, -r * 1.2, r * 0.4, -r * 1.3);

    // Leaf Path
    const leafPath = Skia.Path.Make();
    leafPath.moveTo(0, -r * 0.8);
    leafPath.quadTo(r * 0.5, -r * 1.5, r * 0.8, -r * 0.8);
    leafPath.quadTo(r * 0.4, -r * 0.5, 0, -r * 0.8);
    leafPath.close();


    return (
        <Group transform={transform}>
            {/* Glow */}
            <Circle cx={0} cy={0} r={r} color={Colors.dark.error} opacity={0.6}>
                <BlurMask blur={8} style="normal" />
            </Circle>

            {/* Stem */}
            <Path path={stemPath} color="#8D6E63" style="stroke" strokeWidth={2} strokeCap="round" />

            {/* Leaf */}
            <Path path={leafPath} color="#66BB6A" style="fill" />

            {/* Apple Body */}
            <Circle cx={0} cy={0} r={r * 0.9} color={Colors.dark.error} />

            {/* Highlight */}
            <Circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.2} color="white" opacity={0.4} />
        </Group>
    );
};
