import React from 'react';
import { Canvas } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { Coordinate } from '../../types/game';
import { SnakeRenderer } from './SnakeRenderer';
import { FoodRenderer } from './FoodRenderer';
import { ParticleSystem } from './ParticleSystem';

interface Props {
    snakeBody: SharedValue<Coordinate[]>;
    foodPosition: SharedValue<Coordinate>;
    eatParticleTrigger?: SharedValue<number>;
    eatParticlePosition?: SharedValue<Coordinate>;
    rows: number;
    cols: number;
    width: number;
    height: number;
}

export const GameCanvas = ({
    snakeBody,
    foodPosition,
    eatParticleTrigger,
    eatParticlePosition,
    rows,
    cols,
    width,
    height
}: Props) => {
    const cellSize = Math.min(width / cols, height / rows);

    // Center the grid
    const gridWidth = cellSize * cols;
    const gridHeight = cellSize * rows;
    const offsetX = (width - gridWidth) / 2;
    const offsetY = (height - gridHeight) / 2;

    return (
        <View style={styles.container}>
            <Canvas style={{ width, height }}>
                <SnakeRenderer body={snakeBody} cellSize={cellSize} />
                <FoodRenderer position={foodPosition} cellSize={cellSize} />
                {eatParticleTrigger && eatParticlePosition && (
                    <ParticleSystem
                        trigger={eatParticleTrigger}
                        position={eatParticlePosition}
                        cellSize={cellSize}
                    />
                )}
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
});
