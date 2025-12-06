import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { soundManager } from '../../managers/SoundManager';
import { GlassCard } from '../ui/GlassCard';

interface GameHUDProps {
    score: number;
    highScore: number;
}

export const GameHUD = ({ score, highScore }: GameHUDProps) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.hud, { top: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => {
                soundManager.playSFX('click');
                router.back();
            }} activeOpacity={0.8}>
                <GlassCard style={styles.backButton} intensity={40}>
                    <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
                    <Text style={styles.backButtonText}>MENU</Text>
                </GlassCard>
            </TouchableOpacity>

            <GlassCard style={styles.scoreCard} intensity={20}>
                <Text style={styles.highScoreLabel}>BEST: {highScore}</Text>
                <Text style={styles.scoreLabel}>SCORE</Text>
                <ScoreCounter score={score} />
            </GlassCard>
        </View>
    );
};

function ScoreCounter({ score }: { score: number }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSequence(
            withTiming(1.5, { duration: 100 }),
            withTiming(1, { duration: 100 })
        );
    }, [score]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.Text style={[styles.scoreValue, style]}>
            {score}
        </Animated.Text>
    );
}

const styles = StyleSheet.create({
    hud: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    backButton: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    backButtonText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scoreCard: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    highScoreLabel: {
        color: Colors.dark.accent,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 2,
    },
    scoreLabel: {
        color: Colors.dark.textDim,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scoreValue: {
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
});
