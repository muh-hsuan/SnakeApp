import { BlurMask, Path, Skia } from '@shopify/react-native-skia';
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

    return (
        <Path path={path} color={Colors.dark.primary}>
            <BlurMask blur={5} style="solid" />
        </Path>
    );
};
