---
description: Deploy to iOS App Store
---

This workflow guides you through the process of publishing your app to the iOS App Store using EAS.

## Prerequisites

1.  **Apple Developer Account**: Ensure you have a paid [Apple Developer Program](https://developer.apple.com/programs/) membership.
2.  **App Store Connect**:
    *   Go to [App Store Connect](https://appstoreconnect.apple.com/).
    *   Click "+" -> "New App".
    *   **Bundle ID**: Select `com.muhhsuan.snake` (or create it in the Apple Developer Portal if it doesn't exist).
    *   **SKU**: Enter a unique ID (e.g., `snake-app-001`).
    *   **Language**: Select your primary language.

## Step 1: Build for Production

Run the following command to build your app for the App Store. This will create an `.ipa` file.

```bash
eas build --platform ios --profile production
```

> **Note**: You will be asked to log in to your Apple account during this process to generate certificates and provisioning profiles automatically.

## Step 2: Submit to App Store Connect

Once the build is complete, you can submit it directly to App Store Connect.

```bash
eas submit --platform ios
```

*   Select the build you just created from the list.
*   Wait for the submission to complete.

## Step 3: Finalize in App Store Connect

1.  Go back to [App Store Connect](https://appstoreconnect.apple.com/).
2.  Select your app.
3.  Go to the **TestFlight** tab to see your uploaded build (it may take a few minutes to process).
4.  To publish to the App Store:
    *   Go to the **App Store** tab.
    *   Fill in all required metadata (Screenshots, Description, Keywords, Support URL, Marketing URL, Privacy Policy).
    *   Scroll down to the **Build** section and select the build you uploaded.
    *   Click **Save** and then **Add for Review**.

## Troubleshooting

*   **Certificate/Provisioning Errors**: If `eas build` fails due to credentials, try running `eas credentials` to manage them manually or reset them.
*   **Version Number**: If you've already uploaded a build with version `1.0.0`, you must increment the `version` in `package.json` and `app.json` (or `buildNumber` in `app.json` / `eas.json`) before building again.
