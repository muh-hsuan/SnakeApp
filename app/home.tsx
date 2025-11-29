import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AdBanner } from '../src/components/ui/AdBanner';
import { GlassButton } from '../src/components/ui/GlassButton';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { Colors } from '../src/constants/Colors';
import { getSettings } from '../src/utils/storage';

export default function Home() {
    const router = useRouter();
    const [highScore, setHighScore] = useState(0);

    useFocusEffect(
        useCallback(() => {
            const settings = getSettings();
            setHighScore(settings.highScore);
        }, [])
    );

    return (
        <ScreenBackground style={styles.container}>
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
                        title="Start Game"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/game');
                        }}
                        variant="primary"
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
