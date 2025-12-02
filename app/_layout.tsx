import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useEffect } from 'react';
import { soundManager } from '../src/managers/SoundManager';

export default function Layout() {
  useEffect(() => {
    const initAudio = async () => {
      await soundManager.loadSounds();
      soundManager.playBGM();

      // Request App Tracking Transparency permission
      await requestTrackingPermissionsAsync();
    };
    initAudio();
  }, []);
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" hidden={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="game" />
        <Stack.Screen name="shop" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
