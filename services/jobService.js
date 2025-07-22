// services/jobService.js
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function fetchAvailableJobs() {
  return api.get('/jobs');
}

export async function fetchJobMatches() {
  const token = await AsyncStorage.getItem('token');
  return api.get('/match-jobs', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function fetchJobDetails(jobId) {
  return api.get(`/jobs/${jobId}`);
}
