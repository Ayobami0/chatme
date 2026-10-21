import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AuthDeviceDto } from '@shared/types/api';

export const getDeviceInfo = async (): Promise<AuthDeviceDto> => {
  const os = Platform.OS;
  const platform = (os === 'ios' || os === 'android' || os === 'web') ? os : 'unknown';
  return {
    name: Device.modelName ?? 'Unknown Device',
    platform,
  };
};
