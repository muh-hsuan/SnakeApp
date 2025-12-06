import { Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import React from 'react';
import { runOnJS, SharedValue, useDerivedValue } from 'react-native-reanimated';
import { GameItem, ItemType } from '../../types/items';

interface Props {
    items: SharedValue<GameItem[]>;
    cellSize: number;
}

export const ItemRenderer = ({ items, cellSize }: Props) => {
    // Determine the list of items using a derived value or state.
    // Since we need to map them, and the number of items changes, we can use a state that updates when the shared value changes.
    const [currentItems, setCurrentItems] = React.useState<GameItem[]>([]);

    useDerivedValue(() => {
        // This runs on UI thread
        const val = items.value;
        // Invoke state update on JS thread
        runOnJS(setCurrentItems)(val);
    }, [items]);

    const radius = cellSize / 2;

    return (
        <Group>
            {currentItems.map((item) => {
                const cx = item.position.x * cellSize + radius;
                const cy = item.position.y * cellSize + radius;

                let color = '#FFD700'; // Default Gold
                if (item.type === ItemType.MAGNET) {
                    color = '#9C27B0'; // Purple
                }

                return (
                    <Group key={item.id}>
                        <Circle cx={cx} cy={cy} r={radius * 0.8} color={color}>
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
