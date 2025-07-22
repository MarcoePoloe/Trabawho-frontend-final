import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';

export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const deleteToken = async () => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error deleting token:', error);
  }
};
