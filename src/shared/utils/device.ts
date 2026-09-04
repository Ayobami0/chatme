import * as Device from 'expo-device';
import { Platform } from 'react-native';

type DeviceInfo = {
  name: string;
  platform: string;
};

export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  return {
    name: Device.modelName ?? '',
    platform: Platform.OS ?? '',
  };
};
