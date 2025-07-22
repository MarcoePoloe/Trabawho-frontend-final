import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput
} from 'react-native';
import { uploadFile } from '../services/upload';
import { MaterialIcons } from '@expo/vector-icons';
import { getRequest } from '../services/api';
import { getToken } from '../services/Auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
const ITEMS_PER_PAGE = 5;

const JobSeekerDashboard = ({ navigation, route }) => {
  const [token, setToken] = useState(null);
  const [name, setName] = useState('');
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [matchPage, setMatchPage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    };
    checkAuth();
  }, [navigation]);

  const fetchData = async () => {
    const t = await getToken();
    setToken(t);
    await fetchName(t);
    await fetchMatches(token);
    await fetchApplications(t);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    
    if (route.params?.refreshApplications) {
      fetchData();
    }

    fetchData();
    return unsubscribe;
  }, [navigation, route.params]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchName = async (authToken) => {
    try {
      const res = await getRequest('/me', authToken);
      setName(res.data.name);
    } catch (error) {
      console.warn('Failed to fetch name:', error);
    }
  };

  const fetchMatches = async (authToken) => {
    setLoadingMatches(true);
    try {
      const res = await getRequest('/match-jobs', authToken);
      setMatches(res.data);
    } catch (error) {
     /*  console.error('Error fetching AI matches:', error);
      Alert.alert('Error', 'Failed to fetch AI matches'); */
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchApplications = async (authToken) => {
    setLoadingApps(true);
    try {
      const res = await getRequest('/applications/me', authToken);
      
      if (!res.data?.applications || res.data.applications.length === 0) {
        setApplications([]);
        return;
      }
      
      setApplications(res.data.applications);
    } catch (error) {
      if (error.response?.status === 404) {
        setApplications([]);
      } else {
       /*  console.error('Error fetching applications:', error);
        Alert.alert('Error', 'Failed to fetch applications'); */
      }
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchAllJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await getRequest(`/get-jobs?search=${searchQuery}`, token);
      setAllJobs(res.data || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      Alert.alert('Error', 'Failed to fetch job listings');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSearch = () => {
    setJobsPage(1); // Reset to first page when searching
    fetchAllJobs();
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled || !result.assets) return;

      const file = result.assets[0];
      const res = await uploadFile(file);

      Alert.alert('Success', 'Resume uploaded!');
    } catch (err) {
      console.error('Upload failed:', err);
      Alert.alert('Upload failed', 'Something went wrong');
    } 
  };

  const paginatedMatches = matches.slice((matchPage - 1) * ITEMS_PER_PAGE, matchPage * ITEMS_PER_PAGE);
  const paginatedApps = applications.slice((appPage - 1) * ITEMS_PER_PAGE, appPage * ITEMS_PER_PAGE);
  const paginatedJobs = allJobs.slice((jobsPage - 1) * ITEMS_PER_PAGE, jobsPage * ITEMS_PER_PAGE);

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>Welcome, {name}</Text>

      {/* AI Job Matches Section */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>AI Job Matches</Text>
          <TouchableOpacity onPress={() => fetchMatches(token)}>
            <MaterialIcons name="refresh" size={20} color="#4A6FA5" />
          </TouchableOpacity>
        </View>
        
        {loadingMatches ? (
          <ActivityIndicator size="small" color="#4A6FA5" />
        ) : paginatedMatches.length === 0 ? (
          <Text style={styles.emptyText}>No job matches found</Text>
        ) : (
          <>
            {paginatedMatches.map((job) => (
              <TouchableOpacity
                key={job.job_id}
                onPress={() => navigation.navigate('JobDetailsScreen', { job })}
                style={styles.item}
              >
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.company}>{job.company}</Text>
                {job.match_percentage && (
                  <View style={styles.matchContainer}>
                    <Text style={styles.matchPercentage}>{job.match_percentage}% match</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.pagination}>
              <TouchableOpacity 
                onPress={() => setMatchPage((p) => Math.max(p - 1, 1))} 
                disabled={matchPage === 1}
                style={styles.paginationButton}
              >
                <Text style={styles.paginationButtonText}>← Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>Page {matchPage}</Text>
              <TouchableOpacity
                onPress={() =>
                  setMatchPage((p) => (p * ITEMS_PER_PAGE < matches.length ? p + 1 : p))
                }
                disabled={matchPage * ITEMS_PER_PAGE >= matches.length}
                style={styles.paginationButton}
              >
                <Text style={styles.paginationButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Upload Resume Section */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUpload}
        >
          <MaterialIcons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload Resume</Text>
        </TouchableOpacity>
      </View>

      {/* All Jobs Search Section */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>Browse All Jobs</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loadingJobs ? (
          <ActivityIndicator size="small" color="#4A6FA5" />
        ) : !hasSearched ? (
          <View style={styles.initialStateContainer}>
            <Text style={styles.initialStateText}>Click the search button to display jobs</Text>
          </View>
        ) : paginatedJobs.length === 0 ? (
          <Text style={styles.emptyText}>No jobs found matching your search</Text>
        ) : (
          <>
            {paginatedJobs.map((job) => (
              <TouchableOpacity
                key={job.job_id}
                onPress={() => navigation.navigate('JobDetailsScreen', { job })}
                style={styles.item}
              >
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.company}>{job.company}</Text>
                <Text style={styles.location}>{job.location}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.pagination}>
              <TouchableOpacity 
                onPress={() => setJobsPage((p) => Math.max(p - 1, 1))} 
                disabled={jobsPage === 1}
                style={styles.paginationButton}
              >
                <Text style={styles.paginationButtonText}>← Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>Page {jobsPage}</Text>
              <TouchableOpacity
                onPress={() =>
                  setJobsPage((p) => (p * ITEMS_PER_PAGE < allJobs.length ? p + 1 : p))
                }
                disabled={jobsPage * ITEMS_PER_PAGE >= allJobs.length}
                style={styles.paginationButton}
              >
                <Text style={styles.paginationButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Application History Section */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>Application History</Text>
          <TouchableOpacity onPress={() => fetchApplications(token)}>
            <MaterialIcons name="refresh" size={20} color="#4A6FA5" />
          </TouchableOpacity>
        </View>
        
        {loadingApps ? (
          <ActivityIndicator size="small" color="#4A6FA5" />
        ) : applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No applications yet</Text>
          </View>
        ) : (
          <>
            {paginatedApps.map((app) => (
              <TouchableOpacity
                key={app.application_id}
                onPress={() => navigation.navigate('ApplicationDetailsScreen', { 
                  application: {...app, job_id: app.job.job_id, resume_signed_url:app.resume}
                })}
                style={styles.item}
              >
                <Text style={styles.jobTitle}>{app.job.title}</Text>
                <Text style={styles.company}>{app.job.company}</Text>
                <Text style={styles.date}>Applied: {new Date(app.applied_at).toLocaleDateString()}</Text>
                {app.status && (
                  <View style={[
                    styles.statusBadge,
                    app.status.toLowerCase() === 'rejected' && styles.statusRejected,
                    app.status.toLowerCase() === 'accepted' && styles.statusAccepted
                  ]}>
                    <Text style={styles.statusText}>Status: {app.status}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.pagination}>
              <TouchableOpacity 
                onPress={() => setAppPage((p) => Math.max(p - 1, 1))} 
                disabled={appPage === 1}
                style={styles.paginationButton}
              >
                <Text style={styles.paginationButtonText}>← Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>Page {appPage}</Text>
              <TouchableOpacity
                onPress={() =>
                  setAppPage((p) => (p * ITEMS_PER_PAGE < applications.length ? p + 1 : p))
                }
                disabled={appPage * ITEMS_PER_PAGE >= applications.length}
                style={styles.paginationButton}
              >
                <Text style={styles.paginationButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('role');
          navigation.replace('Login');
        }}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#4A6FA5',
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  initialStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  initialStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  initialStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#4A6FA5',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  matchPercentage: {
    color: '#4A6FA5',
    fontWeight: '600',
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 5,
    backgroundColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRejected: {
    backgroundColor: '#ff6d6d',
    color: '#d32f2f',
  },
  statusAccepted: {
    backgroundColor: '#79c97a',
    color: '#2e7d32',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonText: {
    color: '#4A6FA5',
    fontSize: 14,
  },
  pageText: {
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#4A6FA5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#d9534f',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default JobSeekerDashboard;