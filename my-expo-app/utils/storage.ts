// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group } from '../types/types';

const GROUPS_KEY = 'MESSENGER_GROUPS';

export const saveGroupsToStorage = async (groups: Group[]) => {
  try {
    const json = JSON.stringify(groups);
    await AsyncStorage.setItem(GROUPS_KEY, json);
  } catch (error) {
    console.error('Failed to save groups:', error);
  }
};

export const loadGroupsFromStorage = async (): Promise<Group[]> => {
  try {
    const json = await AsyncStorage.getItem(GROUPS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to load groups:', error);
    return [];
  }
};
