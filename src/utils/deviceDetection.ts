import React from 'react';

export interface DeviceInfo {
  isIPhone: boolean;
  isIPad: boolean;
  isIPod: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  userAgent: string;
  iphoneModel?: string;
  iosVersion?: string;
}

export class DeviceDetection {
  private static instance: DeviceDetection;
  private deviceInfo: DeviceInfo;

  private constructor() {
    this.deviceInfo = this.detectDevice();
  }

  static getInstance(): DeviceDetection {
    if (!DeviceDetection.instance) {
      DeviceDetection.instance = new DeviceDetection();
    }
    return DeviceDetection.instance;
  }

  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1;

    const isIPhone = /iPhone/i.test(userAgent);
    const isIPad = /iPad/i.test(userAgent);
    const isIPod = /iPod/i.test(userAgent);
    const isIOS = isIPhone || isIPad || isIPod;
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;
    const isDesktop = !isMobile;

    let iphoneModel: string | undefined;
    let iosVersion: string | undefined;

    if (isIPhone) {
      iphoneModel = this.detectIPhoneModel(screenWidth, screenHeight, devicePixelRatio);
      iosVersion = this.detectIOSVersion(userAgent);
    }

    return {
      isIPhone,
      isIPad,
      isIPod,
      isIOS,
      isAndroid,
      isMobile,
      isDesktop,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      userAgent,
      iphoneModel,
      iosVersion
    };
  }

  private detectIPhoneModel(width: number, height: number, pixelRatio: number): string {
    // iPhone screen dimensions and pixel ratios
    const models = [
      { name: 'iPhone 15 Pro Max', width: 430, height: 932, ratio: 3 },
      { name: 'iPhone 15 Plus', width: 430, height: 932, ratio: 3 },
      { name: 'iPhone 15 Pro', width: 393, height: 852, ratio: 3 },
      { name: 'iPhone 15', width: 393, height: 852, ratio: 3 },
      { name: 'iPhone 14 Pro Max', width: 430, height: 932, ratio: 3 },
      { name: 'iPhone 14 Plus', width: 430, height: 932, ratio: 3 },
      { name: 'iPhone 14 Pro', width: 393, height: 852, ratio: 3 },
      { name: 'iPhone 14', width: 390, height: 844, ratio: 3 },
      { name: 'iPhone 13 Pro Max', width: 428, height: 926, ratio: 3 },
      { name: 'iPhone 13 Pro', width: 390, height: 844, ratio: 3 },
      { name: 'iPhone 13', width: 390, height: 844, ratio: 3 },
      { name: 'iPhone 13 mini', width: 375, height: 812, ratio: 3 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926, ratio: 3 },
      { name: 'iPhone 12 Pro', width: 390, height: 844, ratio: 3 },
      { name: 'iPhone 12', width: 390, height: 844, ratio: 3 },
      { name: 'iPhone 12 mini', width: 375, height: 812, ratio: 3 },
      { name: 'iPhone 11 Pro Max', width: 414, height: 896, ratio: 3 },
      { name: 'iPhone 11 Pro', width: 375, height: 812, ratio: 3 },
      { name: 'iPhone 11', width: 414, height: 896, ratio: 2 },
      { name: 'iPhone XS Max', width: 414, height: 896, ratio: 3 },
      { name: 'iPhone XS', width: 375, height: 812, ratio: 3 },
      { name: 'iPhone XR', width: 414, height: 896, ratio: 2 },
      { name: 'iPhone X', width: 375, height: 812, ratio: 3 },
      { name: 'iPhone 8 Plus', width: 414, height: 736, ratio: 3 },
      { name: 'iPhone 8', width: 375, height: 667, ratio: 2 },
      { name: 'iPhone SE (2nd gen)', width: 375, height: 667, ratio: 2 },
      { name: 'iPhone SE (3rd gen)', width: 375, height: 667, ratio: 2 }
    ];

    // Find matching model
    const model = models.find(m => 
      m.width === width && 
      m.height === height && 
      Math.abs(m.ratio - pixelRatio) < 0.1
    );

    return model?.name || 'Unknown iPhone';
  }

  private detectIOSVersion(userAgent: string): string {
    const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      const major = match[1];
      const minor = match[2];
      const patch = match[3] || '0';
      return `${major}.${minor}.${patch}`;
    }
    return 'Unknown';
  }

  // Utility methods
  isIPhoneXOrNewer(): boolean {
    if (!this.deviceInfo.isIPhone) return false;
    
    const newerModels = [
      'iPhone X', 'iPhone XS', 'iPhone XS Max', 'iPhone XR',
      'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
      'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
      'iPhone 13', 'iPhone 13 mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
      'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
      'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'
    ];
    
    return newerModels.includes(this.deviceInfo.iphoneModel || '');
  }

  hasDynamicIsland(): boolean {
    if (!this.deviceInfo.isIPhone) return false;
    
    const dynamicIslandModels = [
      'iPhone 14 Pro', 'iPhone 14 Pro Max',
      'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'
    ];
    
    return dynamicIslandModels.includes(this.deviceInfo.iphoneModel || '');
  }

  hasNotch(): boolean {
    return this.isIPhoneXOrNewer() && !this.hasDynamicIsland();
  }

  getSafeAreaClass(): string {
    if (this.hasDynamicIsland()) {
      return 'dynamic-island-area';
    } else if (this.isIPhoneXOrNewer()) {
      return 'iphone-safe-area';
    }
    return '';
  }

  getResponsiveClass(): string {
    if (this.deviceInfo.screenWidth >= 430) {
      return 'iphone-large';
    } else if (this.deviceInfo.screenWidth >= 393) {
      return 'iphone-medium';
    } else {
      return 'iphone-small';
    }
  }
}

// Export singleton instance
export const deviceDetection = DeviceDetection.getInstance();

// React hook for device detection
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = React.useState(deviceDetection.getDeviceInfo());

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(deviceDetection.getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}; 