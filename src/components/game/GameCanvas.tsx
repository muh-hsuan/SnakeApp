import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { Coordinate } from '../../types/game';
import { GameItem } from '../../types/items';
import { FoodRenderer } from './FoodRenderer';
import { ItemRenderer } from './ItemRenderer';
import { ParticleSystem } from './ParticleSystem';
import { SnakeRenderer } from './SnakeRenderer';

interface Props {
    snakeBody: SharedValue<Coordinate[]>;
    foodPosition: SharedValue<Coordinate>;
    activeItems?: SharedValue<GameItem[]>;
    eatParticleTrigger?: SharedValue<number>;
    eatParticlePosition?: SharedValue<Coordinate>;
    rows: number;
    cols: number;
    width: number;
    height: number;
    insets: EdgeInsets;
}

export const GameCanvas = ({
    snakeBody,
    foodPosition,
    activeItems,
    eatParticleTrigger,
    eatParticlePosition,
    rows,
    cols,
    width,
    height,
    insets
}: Props) => {
    const safeWidth = width - insets.left - insets.right;
    const safeHeight = height - insets.top - insets.bottom;

    const cellSize = Math.min(safeWidth / cols, safeHeight / rows);

    // Center the grid within the safe area
    const gridWidth = cellSize * cols;
    const gridHeight = cellSize * rows;

    // Offset relative to the full canvas, including safe area insets
    const offsetX = insets.left + (safeWidth - gridWidth) / 2;
    const offsetY = insets.top + (safeHeight - gridHeight) / 2;

    return (
        <View style={styles.container}>
            <Canvas style={{ width, height }}>
                <Group transform={[{ translateX: offsetX }, { translateY: offsetY }]}>
                    {/* Playable Area Background */}
                    <Rect
                        x={0}
                        y={0}
                        width={gridWidth}
                        height={gridHeight}
                        color="#252525"
                        style="fill"
                    />
                    <Rect
                        x={0}
                        y={0}
                        width={gridWidth}
                        height={gridHeight}
                        color="#333333"
                        style="stroke"
                        strokeWidth={2}
                    />

                    <SnakeRenderer body={snakeBody} cellSize={cellSize} />
                    <FoodRenderer position={foodPosition} cellSize={cellSize} />
                    {activeItems && <ItemRenderer items={activeItems} cellSize={cellSize} />}
                    {eatParticleTrigger && eatParticlePosition && (
                        <ParticleSystem
                            trigger={eatParticleTrigger}
                            position={eatParticlePosition}
                            cellSize={cellSize}
                        />
                    )}
                </Group>
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
