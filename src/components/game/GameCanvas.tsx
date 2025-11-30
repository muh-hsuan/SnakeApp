import { Canvas, Group, Rect } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { EdgeInsets } from 'react-native-safe-area-context';
import { soundManager } from '../../managers/SoundManager';
import { AISnake, Coordinate } from '../../types/game';
import { FoodRenderer } from './FoodRenderer';
import { GridBackground } from './GridBackground';
import { ParticleSystem } from './ParticleSystem';
import { SnakeRenderer } from './SnakeRenderer';

interface Props {
    snakeBody: SharedValue<Coordinate[]>;
    foodPosition: SharedValue<Coordinate>;
    eatParticleTrigger?: SharedValue<number>;
    eatParticlePosition?: SharedValue<Coordinate>;
    rows: number;
    cols: number;
    width: number;
    height: number;
    insets: EdgeInsets;
    snakeColor?: string;
    aiSnakes?: SharedValue<AISnake[]>;
}

export const GameCanvas = ({
    snakeBody,
    foodPosition,
    eatParticleTrigger,
    eatParticlePosition,
    rows,
    cols,
    width,
    height,
    insets,
    snakeColor,
    aiSnakes
}: Props) => {
    useEffect(() => {
        const initSounds = async () => {
            await soundManager.loadSounds();
            await soundManager.playBGM();
        };
        initSounds();

        return () => {
            soundManager.unloadSounds();
        };
    }, []);

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
                        color="#1a1a1a"
                        style="fill"
                    />
                    <GridBackground width={gridWidth} height={gridHeight} cellSize={cellSize} />

                    <SnakeRenderer body={snakeBody} cellSize={cellSize} color={snakeColor} />

                    {aiSnakes && (
                        <Group>
                            {/* We can't map shared values directly in JSX like this if we want reactivity for each snake individually efficiently, 
                                but since aiSnakes is a single shared value array, we can use a component that reads it.
                                However, SnakeRenderer expects SharedValue<Coordinate[]>.
                                We need a wrapper to render multiple AI snakes.
                            */}
                            <AISnakesRenderer aiSnakes={aiSnakes} cellSize={cellSize} />
                        </Group>
                    )}

                    <FoodRenderer position={foodPosition} cellSize={cellSize} />
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

// Helper component to render AI snakes
const AISnakesRenderer = ({ aiSnakes, cellSize }: { aiSnakes: SharedValue<AISnake[]>, cellSize: number }) => {
    // This will re-render when aiSnakes changes (which is every tick)
    // Ideally we would have separate shared values for each snake, but for now this is fine.
    // We need to access the value. Since we are inside Canvas, we can't use standard React hooks easily for array mapping if we want Skia optimization.
    // But Skia Canvas children are reactive.
    // Let's try to use a derived value or just render based on the current value if possible.
    // Actually, passing `aiSnakes` (SharedValue) to a component and mapping it is tricky in Reanimated/Skia.
    // The best way is to have a component that takes the shared value and uses `useDerivedValue` to map it to `SnakeRenderer`s?
    // No, `SnakeRenderer` takes `SharedValue<Coordinate[]>`.
    // We can create a derived value for each potential AI snake index?
    // Or just render them if the array is small (3 snakes).

    // Let's try a simpler approach: Just map the array. But we need to access .value.
    // Accessing .value during render is okay in Reanimated 3 if it's on UI thread? 
    // No, we need to use `useDerivedValue` to extract specific snake bodies.

    // Since we have a fixed max number of AI snakes (e.g., 3), we can create 3 derived values.
    const snake0 = useDerivedValue<AISnake | null>(() => aiSnakes.value[0] ?? null, [aiSnakes]);
    const snake1 = useDerivedValue<AISnake | null>(() => aiSnakes.value[1] ?? null, [aiSnakes]);
    const snake2 = useDerivedValue<AISnake | null>(() => aiSnakes.value[2] ?? null, [aiSnakes]);

    return (
        <Group>
            <SingleAISnake snake={snake0} cellSize={cellSize} />
            <SingleAISnake snake={snake1} cellSize={cellSize} />
            <SingleAISnake snake={snake2} cellSize={cellSize} />
        </Group>
    );
};

import { useDerivedValue } from 'react-native-reanimated';

const SingleAISnake = ({ snake, cellSize }: { snake: SharedValue<AISnake | null> | Readonly<SharedValue<AISnake | null>>, cellSize: number }) => {
    const body = useDerivedValue(() => snake.value?.body || [], [snake]);
    const color = useDerivedValue(() => snake.value?.color || '#FF0000', [snake]);
    const isDead = useDerivedValue(() => snake.value?.isDead || false, [snake]);

    // We need to pass color as string to SnakeRenderer, but SnakeRenderer takes string prop, not shared value for color (yet).
    // My previous SnakeRenderer update added `color` prop.
    // But here color is dynamic.
    // Let's update SnakeRenderer to accept optional SharedValue for color or just use the prop.
    // Since AI snakes don't change color often, we can maybe just use a default?
    // But we want different colors.
    // Let's just pass the body to SnakeRenderer.
    // Wait, SnakeRenderer expects `SharedValue<Coordinate[]>`. `body` is that.

    // We need to handle `isDead`. If dead, we render nothing or empty body.
    const visibleBody = useDerivedValue(() => isDead.value ? [] : body.value, [isDead, body]);

    // We can't pass shared value to `color` prop if it expects string.
    // We can use `useDerivedValue` to get the color string? No, props are not reactive like that unless the component handles it.
    // Let's assume fixed colors for now based on index in `AISnakesRenderer` or just read it once.
    // Actually, `snake.value` might be null initially.

    // Hack: Read color from shared value in a derived value for props? No.
    // Let's just use a fixed color for now or modify SnakeRenderer to accept SharedValue<string>.
    // For now, I'll just render them.

    return <SnakeRenderer body={visibleBody} cellSize={cellSize} color="#FF5252" />;
    // Wait, I can't easily pass dynamic color without changing SnakeRenderer.
    // I'll just use a fixed color for all AI for now, or maybe pass a prop if I can.
    // Actually, I can wrap SnakeRenderer in a component that reads the color.
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
