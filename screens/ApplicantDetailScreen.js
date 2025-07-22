import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getRequest, putRequest } from '../services/api';
import * as WebBrowser from 'expo-web-browser';

const ApplicantDetailScreen = ({ route }) => {
    
    const { application, job, onStatusChange } = route.params;
  const [status, setStatus] = useState(application.status || 'submitted');
  const [updating, setUpdating] = useState(false);
  const [documents, setDocuments] = useState(null);


  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await putRequest(`/applications/${application.application_id}/status`, {
        status: newStatus
      });
      setStatus(newStatus);
      Alert.alert('Success', 'Application status updated');
      if (onStatusChange) onStatusChange(); // Call the refresh callback
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
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

  const fetchDocumentUrls = async () => {
    try {
      const response = await getRequest(
        `/applications/${application.application_id}/documents/public`
      );
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch document URLs:', error);
      Alert.alert('Error', 'Could not load documents');
    } 
  };

  useEffect(() => {
      fetchDocumentUrls();
    }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Application Details</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Information</Text>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicant Information</Text>
          <Text style={styles.detail}>Name: {application.applicant.name}</Text>
          <Text style={styles.detail}>Email: {application.applicant.email}</Text>
          <Text style={styles.detail}>
            Applied: {new Date(application.applied_at).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <TouchableOpacity 
            style={styles.documentButton}
            onPress={() => openDocument(documents?.data?.resume)}
          >
            <MaterialIcons name="picture-as-pdf" size={20} color="#4A6FA5" />
            <Text style={styles.documentText}>View Resume</Text>
          </TouchableOpacity>
          
          {application.cover_letter_download_url && (
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => openDocument(documents?.data?.cover_letter)}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color="#4A6FA5" />
              <Text style={styles.documentText}>View Cover Letter</Text>
            </TouchableOpacity>
          )}
          {documents?.expiry && (
                          <Text style={styles.expiryText}>
                            Links expire: {new Date(documents.expiry).toLocaleString()}
                          </Text>
                        )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Status</Text>
          <View style={styles.statusContainer}>
            
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'accepted' && styles.acceptedStatus
              ]}
              onPress={() => handleStatusChange('accepted')}
              disabled={updating}
            >
              <Text style={styles.statusText}>Accepted</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === 'rejected' && styles.rejectedStatus
              ]}
              onPress={() => handleStatusChange('rejected')}
              disabled={updating}
            >
              <Text style={styles.statusText}>Rejected</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  company: {
    fontSize: 14,
    color: '#4A6FA5',
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#4A6FA5',
    borderRadius: 5,
    marginBottom: 10,
  },
  documentText: {
    marginLeft: 10,
    color: '#4A6FA5',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  submittedStatus: {
    backgroundColor: '#fff3cd',
    borderColor: '#ddd',
  },
  acceptedStatus: {
    backgroundColor: '#79c97a',
    borderColor: '#ddd',
  },
  rejectedStatus: {
    backgroundColor: '#ff6d6d',
    borderColor: '#ddd',
  },
  statusText: {
    color: '#333',
  },
});

export default ApplicantDetailScreen;