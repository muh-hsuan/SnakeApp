import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassButton } from '../src/components/ui/GlassButton';
import { GlassCard } from '../src/components/ui/GlassCard';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { Colors } from '../src/constants/Colors';
import { GameSettings } from '../src/types/game';
import { getSettings, saveSettings } from '../src/utils/storage';

const SKINS = [
    { id: 'default', name: 'Classic Green', color: '#4CAF50', price: 0 },
    { id: 'blue', name: 'Ocean Blue', color: '#2196F3', price: 100 },
    { id: 'gold', name: 'Golden Luxury', color: '#FFD700', price: 500 },
    { id: 'neon', name: 'Neon Cyber', color: '#bd00ff', price: 1000 },
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

    if (!settings) return <ScreenBackground><View /></ScreenBackground>;

    return (
        <ScreenBackground style={styles.container}>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text style={styles.title}>SKIN SHOP</Text>
                <Text style={styles.subtitle}>BALANCE: {settings.highScore} PTS</Text>
            </Animated.View>

            <FlatList
                data={SKINS}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInUp.delay(400 + index * 100).springify()} style={styles.itemContainer}>
                        <TouchableOpacity onPress={() => handleSelectSkin(item.id)} activeOpacity={0.8}>
                            <GlassCard
                                style={[
                                    styles.item,
                                    settings.skinId === item.id && styles.selectedItem
                                ]}
                                intensity={20}
                            >
                                <View style={[styles.preview, { backgroundColor: item.color }]} />
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>
                                    {item.price === 0 ? 'FREE' : `${item.price} PTS`}
                                </Text>
                                {settings.skinId === item.id && (
                                    <View style={styles.equippedBadge}>
                                        <Text style={styles.equippedText}>EQUIPPED</Text>
                                    </View>
                                )}
                            </GlassCard>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            />

            <View style={styles.footer}>
                <GlassButton title="Back" onPress={() => router.back()} />
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        color: Colors.dark.text,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.dark.accent,
        marginBottom: 30,
        textAlign: 'center',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 10,
    },
    itemContainer: {
        flex: 1,
        margin: 8,
    },
    item: {
        alignItems: 'center',
        padding: 15,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        height: 180,
        justifyContent: 'space-between',
    },
    selectedItem: {
        borderColor: Colors.dark.primary,
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
    },
    preview: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    itemName: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    itemPrice: {
        color: Colors.dark.textDim,
        fontSize: 12,
        fontWeight: '600',
    },
    equippedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    equippedText: {
        color: '#000',
        fontSize: 8,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
});
