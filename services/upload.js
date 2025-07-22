import axios from 'axios';
import { API_URL } from '../constants/apiurl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'resume.pdf',
    type: 'application/pdf',
  });

  const token = await AsyncStorage.getItem('token');

  const response = await axios.post(`${API_URL}/upload-resume`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
} 