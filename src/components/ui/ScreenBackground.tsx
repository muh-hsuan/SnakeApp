import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ children, style }) => {
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={[Colors.dark.background, '#1a1a2e']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
});
