import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CustomSlider } from '../src/components/ui/CustomSlider';
import { GlassCard } from '../src/components/ui/GlassCard';
import { ScreenBackground } from '../src/components/ui/ScreenBackground';
import { Colors } from '../src/constants/Colors';
import { soundManager } from '../src/managers/SoundManager';
import { GameSettings } from '../src/types/game';
import { getSettings, saveSettings } from '../src/utils/storage';

export default function Settings() {
    const router = useRouter();
    const [settings, setSettings] = useState<GameSettings | null>(null);

    useEffect(() => {
        const load = async () => {
            const s = await getSettings();
            setSettings(s);
        };
        load();
    }, []);

    const updateSettings = (updates: Partial<GameSettings>) => {
        if (!settings) return;
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        saveSettings(newSettings);

        // Apply changes immediately
        if (updates.bgmVolume !== undefined) soundManager.setBGMVolume(updates.bgmVolume);
        if (updates.sfxVolume !== undefined) soundManager.setSFXVolume(updates.sfxVolume);
        if (updates.musicEnabled !== undefined) soundManager.setMusicEnabled(updates.musicEnabled);
        if (updates.soundEnabled !== undefined) soundManager.setSoundEnabled(updates.soundEnabled);
    };

    if (!settings) return null;

    return (
        <ScreenBackground style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={Colors.dark.text} />
                </TouchableOpacity>
                <Text style={styles.title}>SETTINGS</Text>
                <View style={{ width: 28 }} />
            </View>

            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.content}>
                <GlassCard style={styles.section} intensity={30}>
                    <Text style={styles.sectionTitle}>AUDIO</Text>

                    {/* BGM Toggle */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Music</Text>
                        <Switch
                            value={settings.musicEnabled}
                            onValueChange={(val) => {
                                Haptics.selectionAsync();
                                updateSettings({ musicEnabled: val });
                            }}
                            trackColor={{ false: '#767577', true: Colors.dark.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    </View>

                    {/* BGM Volume */}
                    <View style={styles.sliderRow}>
                        <Text style={styles.subLabel}>Volume</Text>
                        <CustomSlider
                            value={settings.bgmVolume}
                            onValueChange={(val) => updateSettings({ bgmVolume: val })}
                            width={200}
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* SFX Toggle */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Sound Effects</Text>
                        <Switch
                            value={settings.soundEnabled}
                            onValueChange={(val) => {
                                Haptics.selectionAsync();
                                updateSettings({ soundEnabled: val });
                            }}
                            trackColor={{ false: '#767577', true: Colors.dark.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    </View>

                    {/* SFX Volume */}
                    <View style={styles.sliderRow}>
                        <Text style={styles.subLabel}>Volume</Text>
                        <CustomSlider
                            value={settings.sfxVolume}
                            onValueChange={(val) => {
                                // Debounce sound playing or just play on end? 
                                // For now, just update. Maybe play a click on release if we could detect it here easily.
                                updateSettings({ sfxVolume: val });
                            }}
                            width={200}
                        />
                    </View>
                </GlassCard>

                <GlassCard style={styles.section} intensity={30}>
                    <Text style={styles.sectionTitle}>GAMEPLAY</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Haptics</Text>
                        <Switch
                            value={settings.hapticsEnabled}
                            onValueChange={(val) => {
                                Haptics.selectionAsync();
                                updateSettings({ hapticsEnabled: val });
                            }}
                            trackColor={{ false: '#767577', true: Colors.dark.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    </View>
                </GlassCard>
            </Animated.View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
        letterSpacing: 2,
    },
    content: {
        gap: 20,
    },
    section: {
        padding: 20,
        borderRadius: 20,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.accent,
        letterSpacing: 1,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 10,
    },
    label: {
        fontSize: 18,
        color: Colors.dark.text,
        fontWeight: '500',
    },
    subLabel: {
        fontSize: 14,
        color: Colors.dark.textDim,
        width: 60,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    },
});
