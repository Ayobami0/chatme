import * as Device from 'expo-device';

type DeviceInfo = {
  name: string;
  platform: string;
};

export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  return {
    name: Device.modelName ?? '',
    platform: Device.osName?.toLowerCase() ?? '',
  };
};
