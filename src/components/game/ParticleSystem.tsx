import React, { useEffect } from 'react';
import { SharedValue, useDerivedValue, useSharedValue, withTiming, withSequence, withDelay, Easing, runOnJS } from 'react-native-reanimated';
import { Group, Circle, Skia, Paint, vec } from '@shopify/react-native-skia';
import { Coordinate } from '../../types/game';

interface Particle {
    id: number;
    x: SharedValue<number>;
    y: SharedValue<number>;
    opacity: SharedValue<number>;
    scale: SharedValue<number>;
    color: string;
}

interface Props {
    trigger: SharedValue<number>; // Increment to trigger
    position: SharedValue<Coordinate>;
    cellSize: number;
    color?: string;
}

const MAX_PARTICLES = 10;

export const ParticleSystem = ({ trigger, position, cellSize, color = '#FFD700' }: Props) => {
    // We can't easily create dynamic arrays of hooks. 
    // So we create a fixed pool of particles.

    // This is a simplified particle system. 
    // For a robust one, we might need a custom Skia shader or Atlas, but Circle group is fine for MVP polish.

    const particles = Array.from({ length: MAX_PARTICLES }).map((_, i) => ({
        id: i,
        x: useSharedValue(0),
        y: useSharedValue(0),
        opacity: useSharedValue(0),
        scale: useSharedValue(0),
    }));

    useDerivedValue(() => {
        if (trigger.value > 0) {
            const cx = position.value.x * cellSize + cellSize / 2;
            const cy = position.value.y * cellSize + cellSize / 2;

            // We need to trigger animation on JS side or use a worklet that fires animations
            // But useDerivedValue runs on UI thread.
            // Let's try to fire animations here.

            // Randomize and animate each particle
            for (const p of particles) {
                p.x.value = cx;
                p.y.value = cy;
                p.opacity.value = 1;
                p.scale.value = 1;

                const angle = Math.random() * 2 * Math.PI;
                const dist = cellSize * (1 + Math.random() * 2);
                const duration = 500 + Math.random() * 300;

                p.x.value = withTiming(cx + Math.cos(angle) * dist, { duration });
                p.y.value = withTiming(cy + Math.sin(angle) * dist, { duration });
                p.opacity.value = withTiming(0, { duration });
                p.scale.value = withTiming(0, { duration });
            }
        }
    }, [trigger]);

    return (
        <Group>
            {particles.map((p) => (
                <Circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={useDerivedValue(() => (cellSize / 4) * p.scale.value)}
                    opacity={p.opacity}
                    color={color}
                />
            ))}
        </Group>
    );
};
