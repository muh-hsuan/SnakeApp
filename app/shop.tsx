import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getSettings, saveSettings } from '../src/utils/storage';
import { GameSettings } from '../src/types/game';

const SKINS = [
    { id: 'default', name: 'Classic Green', color: '#4CAF50', price: 0 },
    { id: 'blue', name: 'Ocean Blue', color: '#2196F3', price: 100 },
    { id: 'gold', name: 'Golden Luxury', color: '#FFD700', price: 500 },
];

export default function Shop() {
    const router = useRouter();
    const [settings, setSettings] = useState<GameSettings | null>(null);

    useEffect(() => {
        setSettings(getSettings());
    }, []);

    const handleSelectSkin = (skinId: string) => {
        if (!settings) return;
        const newSettings = { ...settings, skinId };
        saveSettings(newSettings);
        setSettings(newSettings);
        Alert.alert('Success', 'Skin equipped!');
    };

    if (!settings) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Skin Shop</Text>
            <Text style={styles.subtitle}>High Score: {settings.highScore}</Text>

            <FlatList
                data={SKINS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.item,
                            settings.skinId === item.id && styles.selectedItem
                        ]}
                        onPress={() => handleSelectSkin(item.id)}
                    >
                        <View style={[styles.preview, { backgroundColor: item.color }]} />
                        <View style={styles.info}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemPrice}>{item.price === 0 ? 'Free' : `${item.price} pts`}</Text>
                        </View>
                        {settings.skinId === item.id && <Text style={styles.equipped}>Equipped</Text>}
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#aaa',
        marginBottom: 30,
        textAlign: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedItem: {
        borderColor: '#4CAF50',
    },
    preview: {
        width: 40,
        height: 40,
        borderRadius: 5,
        marginRight: 15,
    },
    info: {
        flex: 1,
    },
    itemName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemPrice: {
        color: '#aaa',
        fontSize: 14,
    },
    equipped: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#444',
        borderRadius: 10,
        alignItems: 'center',
    },
    backButtonText: {
        color: 'white',
        fontSize: 18,
    },
});
