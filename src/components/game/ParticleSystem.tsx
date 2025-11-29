import { Group, Rect, vec } from '@shopify/react-native-skia';
import React from 'react';
import { Easing, SharedValue, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { Coordinate } from '../../types/game';

interface Props {
    trigger: SharedValue<number>; // Increment to trigger
    position: SharedValue<Coordinate>;
    cellSize: number;
    color?: string;
}

const MAX_PARTICLES = 12;

export const ParticleSystem = ({ trigger, position, cellSize, color = '#FFD700' }: Props) => {
    const particles = Array.from({ length: MAX_PARTICLES }).map((_, i) => ({
        id: i,
        x: useSharedValue(0),
        y: useSharedValue(0),
        opacity: useSharedValue(0),
        scale: useSharedValue(0),
        rotation: useSharedValue(0),
    }));

    useDerivedValue(() => {
        if (trigger.value > 0) {
            const cx = position.value.x * cellSize + cellSize / 2;
            const cy = position.value.y * cellSize + cellSize / 2;

            for (const p of particles) {
                p.x.value = cx;
                p.y.value = cy;
                p.opacity.value = 1;
                p.scale.value = 1;
                p.rotation.value = Math.random() * 360;

                const angle = Math.random() * 2 * Math.PI;
                const dist = cellSize * (1.5 + Math.random() * 2.5); // Explode further
                const duration = 600 + Math.random() * 400;

                p.x.value = withTiming(cx + Math.cos(angle) * dist, { duration, easing: Easing.out(Easing.quad) });
                p.y.value = withTiming(cy + Math.sin(angle) * dist, { duration, easing: Easing.out(Easing.quad) });
                p.opacity.value = withTiming(0, { duration });
                p.scale.value = withTiming(0, { duration });
                p.rotation.value = withTiming(p.rotation.value + 180, { duration });
            }
        }
    }, [trigger]);

    return (
        <Group>
            {particles.map((p) => {
                const size = cellSize / 3;
                return (
                    <Group
                        key={p.id}
                        origin={useDerivedValue(() => vec(p.x.value, p.y.value))}
                        transform={useDerivedValue(() => [{ rotate: p.rotation.value * (Math.PI / 180) }])}
                    >
                        <Rect
                            x={useDerivedValue(() => p.x.value - size / 2)}
                            y={useDerivedValue(() => p.y.value - size / 2)}
                            width={useDerivedValue(() => size * p.scale.value)}
                            height={useDerivedValue(() => size * p.scale.value)}
                            color={color}
                            opacity={p.opacity}
                        />
                    </Group>
                );
            })}
        </Group>
    );
};
