// navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import JobSeekerDashboard from '../screens/JobSeekerDashboard';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import ApplicationFormScreen from '../screens/ApplicationFormScreen';
import ApplicationDetailsScreen from '../screens/ApplicationDetailsScreen';

import EmployerDashboard from '../screens/EmployerDashboard';
import PostedJobDetailScreen from '../screens/PostedJobDetailScreen';
import JobApplicantListScreen from '../screens/JobApplicantListScreen';
import ApplicantDetailScreen from '../screens/ApplicantDetailScreen';
import JobCreationFormScreen from '../screens/JobCreationFormScreen';
import JobEditScreen from '../screens/JobEditScreen';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('role');

      if (token && role) {
        setInitialRoute(role === 'job-seeker' ? 'JobSeekerDashboard' : 'EmployerDashboard');
      } else {
        setInitialRoute('Login');
      }
    };  

    checkAuth();
  }, []);

  if (!initialRoute) return null; // wait for auth check

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}  />
   

      <Stack.Screen name="EmployerDashboard" component={EmployerDashboard} /> 
      <Stack.Screen name="PostedJobDetailScreen" component={PostedJobDetailScreen} />
      <Stack.Screen name="JobApplicantListScreen" component={JobApplicantListScreen} />
      <Stack.Screen name="ApplicantDetailScreen" component={ApplicantDetailScreen} />
      <Stack.Screen name="JobCreationFormScreen" component={JobCreationFormScreen} />
      <Stack.Screen name="JobEditScreen" component={JobEditScreen} />
      {/* ApplicantDetailScreen */}
      
      <Stack.Screen name="JobSeekerDashboard" component={JobSeekerDashboard} />
      <Stack.Screen name="JobDetailsScreen" component={JobDetailsScreen} />
      <Stack.Screen name="ApplicationFormScreen" component={ApplicationFormScreen} />
      <Stack.Screen name="ApplicationDetailsScreen" component={ApplicationDetailsScreen} />


      
    </Stack.Navigator>
  );
};

export default AppNavigator;
