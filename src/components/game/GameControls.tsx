import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Direction } from '../../types/game';
import { GlassCard } from '../ui/GlassCard';

interface GameControlsProps {
    currentDirectionShared: SharedValue<Direction>;
    handleSwipe: (dir: Direction) => void;
}

export const GameControls = ({ currentDirectionShared, handleSwipe }: GameControlsProps) => {
    const insets = useSafeAreaInsets();

    const handlePress = (targetDir: 'UP' | 'DOWN') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const current = currentDirectionShared.value;
        let nextDir = Direction.DOWN;

        if (targetDir === 'DOWN') {
            // Left Button Logic (Bottom/Left)
            if (current === Direction.LEFT || current === Direction.RIGHT) {
                // Horizontal -> Turn DOWN
                nextDir = Direction.DOWN;
            } else {
                // Vertical -> Turn LEFT
                nextDir = Direction.LEFT;
            }
        } else {
            // Right Button Logic (Top/Right)
            if (current === Direction.LEFT || current === Direction.RIGHT) {
                // Horizontal -> Turn UP
                nextDir = Direction.UP;
            } else {
                // Vertical -> Turn RIGHT
                nextDir = Direction.RIGHT;
            }
        }
        handleSwipe(nextDir);
    };

    return (
        <View style={[styles.controlsContainer, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity
                onPressIn={() => handlePress('DOWN')}
                style={styles.controlButtonWrapper}
                activeOpacity={0.7}
            >
                <GlassCard style={styles.controlButton} intensity={30}>
                    <Ionicons
                        name="arrow-down"
                        size={32}
                        color={Colors.dark.text}
                        style={{ transform: [{ rotate: '45deg' }] }}
                    />
                </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity
                onPressIn={() => handlePress('UP')}
                style={styles.controlButtonWrapper}
                activeOpacity={0.7}
            >
                <GlassCard style={styles.controlButton} intensity={30}>
                    <Ionicons
                        name="arrow-up"
                        size={32}
                        color={Colors.dark.text}
                        style={{ transform: [{ rotate: '45deg' }] }}
                    />
                </GlassCard>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    controlsContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        zIndex: 5,
    },
    controlButtonWrapper: {
        width: 80,
        height: 80,
    },
    controlButton: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
});
