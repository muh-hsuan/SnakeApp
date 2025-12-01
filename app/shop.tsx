import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassButton } from '../src/components/ui/GlassButton';
import { GlassCard } from '../src/components/ui/GlassCard';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { Colors } from '../src/constants/Colors';
import { SKINS } from '../src/constants/Skins';
import { soundManager } from '../src/managers/SoundManager';
import { GameSettings } from '../src/types/game';
import { getSettings, saveSettings } from '../src/utils/storage';

export default function Shop() {
    const router = useRouter();
    const [settings, setSettings] = useState<GameSettings | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const s = await getSettings();
            setSettings(s);
        };
        loadSettings();
    }, []);

    const handleSelectSkin = async (skinId: string, unlockScore: number) => {
        if (!settings) return;

        if (settings.highScore < unlockScore) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Locked', `You need a high score of ${unlockScore} to unlock this skin!`);
            return;
        }

        Haptics.selectionAsync();
        soundManager.playSFX('click');
        const newSettings = { ...settings, skinId };
        await saveSettings(newSettings);
        setSettings(newSettings);
    };

    if (!settings) return <ScreenBackground><View /></ScreenBackground>;

    return (
        <ScreenBackground style={styles.container}>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text style={styles.title}>SKIN SHOP</Text>
                <Text style={styles.subtitle}>HIGH SCORE: {settings.highScore}</Text>
            </Animated.View>

            <FlatList
                data={SKINS}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                numColumns={2}
                renderItem={({ item, index }) => {
                    const isLocked = settings.highScore < item.unlockScore;
                    const isEquipped = settings.skinId === item.id;

                    return (
                        <Animated.View entering={FadeInUp.delay(400 + index * 100).springify()} style={styles.itemContainer}>
                            <TouchableOpacity onPress={() => handleSelectSkin(item.id, item.unlockScore)} activeOpacity={0.8}>
                                <GlassCard
                                    style={[
                                        styles.item,
                                        isEquipped && styles.selectedItem,
                                        isLocked && styles.lockedItem
                                    ]}
                                    intensity={isLocked ? 10 : 20}
                                >
                                    <View style={[styles.preview, { backgroundColor: item.color, opacity: isLocked ? 0.5 : 1 }]} />
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>
                                        {item.unlockScore === 0 ? 'FREE' : `Score: ${item.unlockScore}`}
                                    </Text>

                                    {isEquipped && (
                                        <View style={styles.equippedBadge}>
                                            <Text style={styles.equippedText}>EQUIPPED</Text>
                                        </View>
                                    )}

                                    {isLocked && (
                                        <View style={styles.lockedBadge}>
                                            <Text style={styles.lockedText}>LOCKED</Text>
                                        </View>
                                    )}
                                </GlassCard>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                }}
            />

            <View style={styles.footer}>
                <GlassButton
                    title="Back"
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // GlassButton handles click sound now, so no need to add it here explicitly if GlassButton is used.
                        // Wait, GlassButton has soundManager.playSFX('click') inside it now.
                        // So I don't need to add it here for GlassButton.
                        router.back();
                    }}
                />
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
    lockedItem: {
        opacity: 0.7,
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
    lockedBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: Colors.dark.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    lockedText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
});
