import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    variant?: 'primary' | 'secondary' | 'default' | 'accent';
}

import { soundManager } from '../../managers/SoundManager';

export const GlassButton: React.FC<GlassButtonProps> = ({
    title,
    onPress,
    style,
    textStyle,
    variant = 'default',
}) => {
    const handlePress = () => {
        soundManager.playSFX('click');
        onPress();
    };
    let borderColor = 'rgba(255,255,255,0.3)';
    let textColor = Colors.dark.text;

    if (variant === 'primary') {
        borderColor = Colors.dark.primary;
        textColor = Colors.dark.primary;
    } else if (variant === 'secondary') {
        borderColor = Colors.dark.secondary;
        textColor = Colors.dark.secondary;
    } else if (variant === 'accent') {
        borderColor = Colors.dark.accent;
        textColor = Colors.dark.accent;
    }

    return (
        <TouchableOpacity onPress={handlePress} style={[styles.container, style]} activeOpacity={0.8}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={[styles.gradient, { borderColor }]}
            >
                <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 8,
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderWidth: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
