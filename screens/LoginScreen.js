import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postRequest } from '../services/api';
import { BackHandler } from 'react-native';

export default function LoginScreen() {
  const [userType, setUserType] = useState('job-seeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const navigation = useNavigation();

  // Validation functions
  const validateEmail = (email) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) return 'Password is required';
    if (trimmedPassword.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      email: emailError,
      password: passwordError
    });
    
    return !emailError && !passwordError;
  };

  const handleInputChange = (name, value) => {
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleUserType = () => {
    setUserType(prev => (prev === 'job-seeker' ? 'employer' : 'job-seeker'));
    setErrors({ email: '', password: '' });
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      const url = userType === 'job-seeker' ? '/login/job-seeker' : '/login/employer';
      const response = await postRequest(url, { 
        email: trimmedEmail, 
        password: trimmedPassword 
      }, true);
      
      // Ensure string values for AsyncStorage
      await AsyncStorage.setItem('token', String(response.data.access_token));
      await AsyncStorage.setItem('role', String(userType));
      
      navigation.replace(userType === 'job-seeker' ? 'JobSeekerDashboard' : 'EmployerDashboard');
    } catch (error) {
      Alert.alert(
        'Login Failed', 
        error.response?.data?.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        BackHandler.exitApp();
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"  // Fixed: using string instead of boolean
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>TrabaWho</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Login as {userType === 'job-seeker' ? 'Job Seeker' : 'Employer'}
          </Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Email address"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={(text) => handleInputChange('email', text)}
              onBlur={() => setErrors(prev => ({
                ...prev,
                email: validateEmail(email)
              }))}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={(text) => handleInputChange('password', text)}
              onBlur={() => setErrors(prev => ({
                ...prev,
                password: validatePassword(password)
              }))}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={isLoading}
            >
              <MaterialIcons 
                name={showPassword ? 'visibility-off' : 'visibility'} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <TouchableOpacity 
            style={[
              styles.primaryButton,
              (errors.email || errors.password) && styles.disabledButton
            ]}
            onPress={handleLogin}
            disabled={isLoading || !!errors.email || !!errors.password}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={toggleUserType}
            disabled={isLoading}
          >
            <Text style={styles.switchButtonText}>
              {userType === 'job-seeker' 
                ? 'Are you an Employer? Login here' 
                : 'Are you a Job Seeker? Login here'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
          >
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 22,
    color: '#666',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A6FA5',
    marginTop: 5,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 5,  // Reduced to make space for error text
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    height: 50,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  eyeIcon: {
    padding: 10,
  },
  primaryButton: {
    backgroundColor: '#4A6FA5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4A6FA5',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#4A6FA5',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 10,
  },
});