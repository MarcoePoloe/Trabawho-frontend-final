import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getRequest, deleteRequest } from '../services/api';
import * as WebBrowser from 'expo-web-browser';

const ApplicationDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { application } = route.params;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getRequest(`/jobdetails/${application.job_id}`);
      
      if (!response.data) {
        throw new Error('Job details not found');
      }
      
      setJob(response.data);
    } catch (error) {
      console.error('Failed to fetch job:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentUrls = async () => {
    try {
      setLoadingDocs(true);
      const response = await getRequest(
        `/applications/${application.application_id}/documents`
      );
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch document URLs:', error);
      Alert.alert('Error', 'Could not load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleWithdraw = async () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw', 
          style: 'destructive',
          onPress: async () => {
            try {
              setWithdrawing(true);
              
              await deleteRequest(`/applications/${application.application_id}`);
              
              Alert.alert('Success', 'Application withdrawn successfully');
              
              navigation.navigate('JobSeekerDashboard', { refreshApplications: true });
              
            } catch (error) {
              console.error('Withdrawal failed:', error);
              let errorMessage = 'Failed to withdraw application';
              
              if (error.response) {
                if (error.response.status === 404) {
                  errorMessage = 'Application not found - it may have already been withdrawn';
                } else if (error.response.data?.message) {
                  errorMessage = error.response.data.message;
                }
              }
              
              Alert.alert('Error', errorMessage);
            } finally {
              setWithdrawing(false);
            }
          }
        }
      ]
    );
  };
  
  const openDocument = async (url) => {
    if (!url) {
      Alert.alert('Document not available');
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Failed to open document:', error);
      Alert.alert('Error', 'Could not open document');
    }
  };

  useEffect(() => {
    fetchJobDetails();
    fetchDocumentUrls();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A6FA5" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={24} color="#d32f2f" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchJobDetails}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.location}>{job.location}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Details</Text>
          <Text style={styles.detail}>
            Applied on: {new Date(application.applied_at).toLocaleDateString()}
          </Text>
          {application.status && (
            <View style={[
              styles.statusBadge,
              application.status.toLowerCase() === 'rejected' && styles.statusRejected,
              application.status.toLowerCase() === 'accepted' && styles.statusAccepted
            ]}>
              <Text style={styles.statusText}>Status: {application.status}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          
          {loadingDocs ? (
            <ActivityIndicator size="small" color="#4A6FA5" />
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.documentButton,
                  !documents?.data?.resume && styles.disabledButton
                ]}
                onPress={() => openDocument(documents?.data?.resume)}
                disabled={!documents?.data?.resume}
              >
                <MaterialIcons name="description" size={20} color="#fff" />
                <Text style={styles.documentButtonText}>
                  {documents?.data?.resume ? 'View Resume' : 'Resume Not Available'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.documentButton,
                  !documents?.data?.cover_letter && styles.disabledButton
                ]}
                onPress={() => openDocument(documents?.data?.cover_letter)}
                disabled={!documents?.data?.cover_letter}
              >
                <MaterialIcons name="description" size={20} color="#fff" />
                <Text style={styles.documentButtonText}>
                  {documents?.data?.cover_letter ? 'View Cover Letter' : 'No Cover Letter'}
                </Text>
              </TouchableOpacity>

              {documents?.expiry && (
                <Text style={styles.expiryText}>
                  Links expire: {new Date(documents.expiry).toLocaleString()}
                </Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleWithdraw}
          disabled={withdrawing}
        >
          {withdrawing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="delete-outline" size={20} color="#fff" />
              <Text style={styles.withdrawButtonText}>Withdraw Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ... (keep your existing styles and add this new one)
const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: '#f8f9fa',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      color: '#666',
    },
    errorText: {
      color: '#d32f2f',
      fontSize: 16,
      marginTop: 10,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#4A6FA5',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 6,
      marginTop: 20,
    },
    retryButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 15,
    },
    jobTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
    },
    company: {
      fontSize: 18,
      color: '#4A6FA5',
      marginTop: 4,
    },
    location: {
      fontSize: 16,
      color: '#666',
      marginTop: 2,
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 15,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: '#555',
    },
    detail: {
      fontSize: 15,
      color: '#555',
      marginBottom: 8,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginTop: 10,
      backgroundColor: '#e0e0e0',
    },
    statusRejected: {
      backgroundColor: '#ff6d6d',
    },
    statusAccepted: {
      backgroundColor: '#79c97a',
    },
    statusText: {
      fontSize: 14,
      fontWeight: '500',
    },
    documentButton: {
      backgroundColor: '#4A6FA5',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      borderRadius: 8,
      marginBottom: 12,
    },
    disabledButton: {
      backgroundColor: '#b0b0b0',
    },
    documentButtonText: {
      color: '#fff',
      fontWeight: '600',
      marginLeft: 10,
    },
    withdrawButton: {
      backgroundColor: '#d9534f',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      borderRadius: 8,
      marginTop: 10,
    },
    withdrawButtonText: {
      color: '#fff',
      fontWeight: '600',
      marginLeft: 10,
    },
    expiryText: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    documentLoading: {
      padding: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default ApplicationDetailsScreen;