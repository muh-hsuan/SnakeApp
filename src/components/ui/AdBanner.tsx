import Constants from 'expo-constants';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const productionAdUnitId = Platform.select({
    android: Constants.expoConfig?.extra?.adMob?.androidBannerId,
    ios: Constants.expoConfig?.extra?.adMob?.iosBannerId,
});

const adUnitId = Constants.expoConfig?.extra?.isTestEnv ? TestIds.BANNER : (productionAdUnitId || TestIds.BANNER);

export const AdBanner = () => {
    return (
        <View style={styles.container}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => {
                    console.log('Banner Ad Loaded');
                }}
                onAdFailedToLoad={(error) => {
                    console.error('Banner Ad Failed to Load:', error);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        // Removed absolute positioning to let the parent (home.tsx) control the layout
    },
});
