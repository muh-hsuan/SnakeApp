import { ConfigContext, ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return 'com.muhhsuan.snake.dev';
    }
    if (IS_PREVIEW) {
        return 'com.muhhsuan.snake.preview';
    }
    return 'com.muhhsuan.snake';
};

const getAppName = () => {
    if (IS_DEV) {
        return 'Snake (Dev)';
    }
    if (IS_PREVIEW) {
        return 'Snake (Preview)';
    }
    return 'SnakeApp';
};

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        name: getAppName(),
        slug: "snake",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "snakeapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: getUniqueIdentifier(),
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."
            }
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            package: getUniqueIdentifier()
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        backgroundColor: "#000000"
                    }
                }
            ],
            "expo-asset",
            "expo-font",
            [
                "react-native-google-mobile-ads",
                {
                    androidAppId: process.env.ANDROID_ADMOB_APP_ID || "ca-app-pub-3940256099942544~3347511713",
                    iosAppId: process.env.IOS_ADMOB_APP_ID || "ca-app-pub-3940256099942544~1458002511"
                }
            ],
            "expo-audio"
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true
        },
        extra: {
            router: {},
            eas: {
                projectId: "f2caae79-ef51-4194-86d4-278f26a165fa"
            }
        },
        owner: "muh_hsuan"
    };
};
