import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export enum StorageKey {
  AuthToken = "authToken",
  OnboardingComplete = "onboardingComplete",
  ProfileFlowStage = "profileFlowStage",
}

export class StorageService {
  static async save<T>(key: StorageKey | string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  static async get<T>(key: StorageKey | string): Promise<T | undefined> {
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return undefined;
    }

    return JSON.parse(value) as T;
  }

  static async remove(key: StorageKey | string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  static async secureSave<T>(
    key: StorageKey | string,
    value: T,
  ): Promise<void> {
    await SecureStore.setItemAsync(
      key,
      JSON.stringify(value),
    );
  }

  static async secureGet<T>(
    key: StorageKey | string,
  ): Promise<T | undefined> {
    const value = await SecureStore.getItemAsync(key);

    if (value === null) {
      return undefined;
    }

    return JSON.parse(value) as T;
  }

  static async secureRemove(key: StorageKey | string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

export default StorageService;
