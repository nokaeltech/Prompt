import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

class MobileService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1e293b' });
      
      // Hide splash screen
      await SplashScreen.hide();
      
      // Set up keyboard handling
      await Keyboard.setAccessoryBarVisible({ isVisible: false });
      
      // Set up app state handling
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      App.addListener('appUrlOpen', (data) => {
        console.log('App opened with URL:', data.url);
      });

      App.addListener('appRestoredResult', (data) => {
        console.log('Restored state:', data);
      });

      this.isInitialized = true;
      console.log('Mobile service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize mobile service:', error);
    }
  }

  async hapticFeedback(style: ImpactStyle = ImpactStyle.Light) {
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  async showKeyboard() {
    try {
      await Keyboard.show();
    } catch (error) {
      console.error('Failed to show keyboard:', error);
    }
  }

  async hideKeyboard() {
    try {
      await Keyboard.hide();
    } catch (error) {
      console.error('Failed to hide keyboard:', error);
    }
  }

  async setStatusBarStyle(style: Style) {
    try {
      await StatusBar.setStyle({ style });
    } catch (error) {
      console.error('Failed to set status bar style:', error);
    }
  }

  async setStatusBarColor(color: string) {
    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('Failed to set status bar color:', error);
    }
  }

  async hideSplashScreen() {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('Failed to hide splash screen:', error);
    }
  }

  async showSplashScreen() {
    try {
      await SplashScreen.show();
    } catch (error) {
      console.error('Failed to show splash screen:', error);
    }
  }

  // Check if running on mobile device
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if running in Capacitor
  isCapacitor(): boolean {
    return typeof window !== 'undefined' && 'Capacitor' in window;
  }

  // Get device info
  async getDeviceInfo() {
    try {
      const info = await App.getInfo();
      return info;
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  // Get app state
  async getAppState() {
    try {
      const state = await App.getState();
      return state;
    } catch (error) {
      console.error('Failed to get app state:', error);
      return null;
    }
  }
}

export const mobileService = new MobileService(); 