import { Canvas, Group } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { GridBackground } from '../src/components/game/GridBackground';
import { SnakeRenderer } from '../src/components/game/SnakeRenderer';
import { AdBanner } from '../src/components/ui/AdBanner';
import { GlassButton } from '../src/components/ui/GlassButton';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { Colors } from '../src/constants/Colors';
import { SKINS } from '../src/constants/Skins';
import { GameMode } from '../src/types/game';
import { getSettings } from '../src/utils/storage';

export default function Home() {
    const router = useRouter();
    const [highScore, setHighScore] = useState(0);
    const { width, height } = useWindowDimensions();
    const [snakeColor, setSnakeColor] = useState(Colors.dark.primary);

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                const settings = await getSettings();
                setHighScore(settings.highScore);
                const skin = SKINS.find(s => s.id === settings.skinId);
                if (skin) setSnakeColor(skin.color);
            };
            loadSettings();
        }, [])
    );

    return (
        <ScreenBackground style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <BackgroundSnake width={width} height={height} color={snakeColor} />
            </View>

            <View style={styles.content}>
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={styles.title}>MODERN</Text>
                    <Text style={[styles.title, styles.subtitle]}>SNAKE</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <Text style={styles.highScore}>HIGH SCORE: {highScore}</Text>
                </Animated.View>

                <Animated.View style={styles.buttonContainer} entering={FadeInUp.delay(600).springify()}>
                    <GlassButton
                        title="Classic Mode"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push({ pathname: '/game', params: { mode: GameMode.CLASSIC } });
                        }}
                        variant="primary"
                        style={styles.button}
                    />
                    <GlassButton
                        title="Challenge Mode"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push({ pathname: '/game', params: { mode: GameMode.CHALLENGE } });
                        }}
                        variant="accent"
                        style={styles.button}
                    />
                    <GlassButton
                        title="Skin Shop"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/shop');
                        }}
                        variant="secondary"
                        style={styles.button}
                    />
                </Animated.View>
            </View>
            <View style={styles.adContainer}>
                <AdBanner />
            </View>
        </ScreenBackground>
    );
}

const BackgroundSnake = ({ width, height, color }: { width: number, height: number, color?: string }) => {
    const snakeBody = useSharedValue([
        { x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }, { x: 2, y: 10 }
    ]);

    // Animate rotation/position to make it float
    const rotation = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        translateY.value = withRepeat(
            withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const transform = useDerivedValue(() => {
        return [
            { rotate: rotation.value * (Math.PI / 180) },
            { translateY: translateY.value }
        ];
    });

    return (
        <Canvas style={{ flex: 1 }}>
            <Group transform={transform} origin={{ x: width / 2, y: height / 2 }}>
                <GridBackground width={width} height={height} cellSize={40} />
                <Group transform={[{ translateX: width / 2 - 100 }, { translateY: height / 2 - 200 }]}>
                    <SnakeRenderer body={snakeBody} cellSize={40} color={color} />
                </Group>
            </Group>
        </Canvas>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 42,
        color: Colors.dark.text,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 4,
    },
    subtitle: {
        fontSize: 64,
        color: Colors.dark.primary,
        marginTop: -10,
        textShadowColor: Colors.dark.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    highScore: {
        color: Colors.dark.accent,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 2,
        marginTop: 20,
        marginBottom: 60,
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 300,
    },
    button: {
        marginBottom: 16,
    },
    adContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
});
