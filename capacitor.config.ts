import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otavioframos.vela',
  appName: 'Vela',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0C0F0E',
      androidSplashResourceName: 'ae_splash_mark',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00000000',
      overlaysWebView: true
    },
    Keyboard: {
      resize: 'native'
    }
  }
};

export default config;
