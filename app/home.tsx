import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdBanner } from '../src/components/ui/AdBanner';
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
        <View style={styles.container}>
            <Text style={styles.title}>Modern Snake</Text>
            <Text style={styles.highScore}>High Score: {highScore}</Text>

            <TouchableOpacity style={styles.button} onPress={() => router.push('/game')}>
                <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.shopButton]} onPress={() => router.push('/shop')}>
                <Text style={styles.buttonText}>Skin Shop</Text>
            </TouchableOpacity>
            <AdBanner />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 48,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    highScore: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: '#2196F3',
    },
    buttonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
