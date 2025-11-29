# Modern Snake Game

A modern, high-performance implementation of the classic Snake game built with React Native and Expo.

## Features

*   **High-Performance Rendering**: Powered by `@shopify/react-native-skia` for 60fps+ graphics.
*   **Smooth Animations**: Utilizing `react-native-reanimated` for fluid movements and effects.
*   **Modern Controls**: Virtual Joystick for precise control.
*   **Skin Shop**: Unlockable skins for your snake.
*   **Monetization**: Integrated AdMob for rewarded ads.
*   **Haptic Feedback**: Tactile response for game events.

## Tech Stack

*   **Framework**: [Expo](https://expo.dev) (SDK 54)
*   **Core**: React Native, TypeScript
*   **Graphics**: React Native Skia
*   **Animations**: React Native Reanimated
*   **Routing**: Expo Router
*   **Storage**: React Native MMKV

## Getting Started

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Start Development Server**

    ```bash
    npm start
    ```

3.  **Run on Device/Emulator**

    *   Android: `npm run android`
    *   iOS: `npm run ios`

## Build & Deploy

This project uses **EAS Build** and is configured for multiple environments (Dev, Preview, Production) with separate App IDs.

### Environments

| Environment | App Name | Bundle ID / Package Name |
| :--- | :--- | :--- |
| **Development** | Snake (Dev) | `com.muhhsuan.snake.dev` |
| **Preview** | Snake (Preview) | `com.muhhsuan.snake.preview` |
| **Production** | SnakeApp | `com.muhhsuan.snake` |

### Building

To build for a specific environment, use the `APP_VARIANT` environment variable implicitly handled by `eas.json` profiles:

```bash
# Development Build
eas build --profile development --platform ios

# Preview Build
eas build --profile preview --platform ios

# Production Build
eas build --profile production --platform ios
```

### iOS Deployment

For a detailed guide on deploying to the iOS App Store, please refer to the workflow guide:
[.agent/workflows/deploy-ios.md](.agent/workflows/deploy-ios.md)
