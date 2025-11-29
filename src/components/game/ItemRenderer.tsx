import React from 'react';
import { Group, Circle, Paint, RadialGradient, vec } from '@shopify/react-native-skia';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Coordinate } from '../../types/game';
import { ItemType, GameItem } from '../../types/items';

interface Props {
    items: SharedValue<GameItem[]>;
    cellSize: number;
}

export const ItemRenderer = ({ items, cellSize }: Props) => {
    const radius = cellSize / 2;

    // We need to render a list of items. 
    // Since Skia Canvas declarative model works best with known number of elements or mapping,
    // we can map the items array. However, SharedValue<GameItem[]> updates might be tricky to map directly inside Canvas without a wrapper.
    // A common pattern is to pass the array and map it, but re-renders depend on the array reference changing.
    // For smooth animation, we might need a different approach if items move, but items are static until eaten.

    // Actually, we can just access .value in the render if we wrap it in a component that re-renders on change, 
    // or use a derived value if we want to animate properties.
    // For now, let's assume items are static positions.

    return (
        <Group>
            {items.value.map((item) => {
                const cx = item.position.x * cellSize + radius;
                const cy = item.position.y * cellSize + radius;

                let color = '#FFD700'; // Default Gold
                if (item.type === ItemType.MAGNET) {
                    color = '#9C27B0'; // Purple
                }

                return (
                    <Group key={item.id}>
                        <Circle cx={cx} cy={cy} r={radius * 0.8} color={color}>
                            {/* Optional: Add a gradient or effect */}
                            <RadialGradient
                                c={vec(cx, cy)}
                                r={radius}
                                colors={['white', color]}
                                positions={[0, 1]}
                            />
                        </Circle>
                    </Group>
                );
            })}
        </Group>
    );
};
