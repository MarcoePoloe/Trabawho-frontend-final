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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { postRequest } from '../../services/api';
import { BackHandler } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('job-seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });

  // Validation (live already applied earlier)
  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email';
    return '';
  };
  const validatePassword = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Password is required';
    if (trimmed.length < 6) return 'Must be at least 6 characters';
    return '';
  };
  const validateName = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Full name is required';
    if (trimmed.length < 2) return 'Enter a valid name';
    return '';
  };

  // Live validation handlers
  const handleNameChange = (v) => {
    setName(v);
    setErrors((p) => ({ ...p, name: validateName(v) }));
  };
  const handleEmailChange = (v) => {
    setEmail(v);
    setErrors((p) => ({ ...p, email: validateEmail(v) }));
  };
  const handlePasswordChange = (v) => {
    setPassword(v);
    setErrors((p) => ({ ...p, password: validatePassword(v) }));
  };

  const toggleUserType = () => {
    setUserType((prev) => (prev === 'job-seeker' ? 'employer' : 'job-seeker'));
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const allValid = !errors.name && !errors.email && !errors.password && name && email && password;

  const handleRegister = async () => {
    // final validation
    const n = validateName(name);
    const e = validateEmail(email);
    const p = validatePassword(password);
    setErrors({ name: n, email: e, password: p });
    if (n || e || p) return;

    setIsLoading(true);

    // <-- IMPORTANT: payload exactly as you asked (no trimming)
    const payload = { name, email, password };
    const url = userType === 'job-seeker' ? '/register/job-seeker' : '/register/employer';

    // debug logs
    console.log('🛰️ Register - endpoint:', url);
    console.log('📦 Register - payload (raw):', payload);

    try {
      // note: postRequest(..., true) will send x-www-form-urlencoded per your helper
      const response = await postRequest(url, payload, true);

      console.log('✅ Registration response data:', response?.data);

      Alert.alert(
        'Success',
        `Successfully registered as ${userType === 'job-seeker' ? 'Job Seeker' : 'Employer'}.\n\nPlease check your email for verification.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      // better error printing for axios error objects
      console.log('❌ Registration error (raw):', err);
      try {
        console.log('❌ Registration error (props):', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } catch (_e) {
        // ignore stringify errors
      }

      // Determine friendly message
      let message = 'Registration failed. Please try again.';
      if (err?.response) {
        // server responded with status
        message = err.response.data?.detail || err.response.data?.message || JSON.stringify(err.response.data);
      } else if (err?.request) {
        // request made but no response
        message = 'Network Error: no response from server. Please check your backend URL and device connectivity.';
      } else if (err?.message) {
        message = err.message;
      }

      // Helpful network troubleshooting hint if network error
      if (message.toLowerCase().includes('network')) {
        message += '\n\nTip: If you are running the backend locally, make sure API_URL is reachable from your device (use your PC LAN IP or ngrok).';
      }

      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require('../../assets/Rectangle-logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register as {userType === 'job-seeker' ? 'Job Seeker' : 'Employer'}</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder="Full Name" placeholderTextColor="#999" style={styles.input} value={name} onChangeText={handleNameChange} autoCapitalize="words" editable={!isLoading} />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder="Email Address" placeholderTextColor="#999" style={styles.input} value={email} onChangeText={handleEmailChange} autoCapitalize="none" keyboardType="email-address" editable={!isLoading} />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Password */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput placeholder="Password" placeholderTextColor="#999" style={[styles.input, { flex: 1 }]} value={password} onChangeText={handlePasswordChange} secureTextEntry={!showPassword} autoCapitalize="none" editable={!isLoading} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={isLoading}>
              <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <TouchableOpacity style={[styles.primaryButton, !allValid && styles.disabledButton]} onPress={handleRegister} disabled={!allValid || isLoading}>
            {isLoading ? <ActivityIndicator color="#f5f5f5" /> : <Text style={styles.primaryButtonText}>Register</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={toggleUserType} disabled={isLoading}>
            <Text style={styles.switchButtonText}>{userType === 'job-seeker' ? 'Registering as Employer instead?' : 'Registering as Job Seeker instead?'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
            <Text style={styles.footerLink}>Login here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logo: { width: 400, height: 180, marginBottom: 10, borderRadius: 8 },
  header: { alignItems: 'center', marginBottom: 30 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 25, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 25, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 10, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { height: 50, fontSize: 16, color: '#333', flex: 1 },
  eyeIcon: { padding: 10 },
  primaryButton: { backgroundColor: '#5271ff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#f5f5f5', fontSize: 18, fontWeight: '600' },
  disabledButton: { backgroundColor: '#ccc' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchButtonText: { color: '#5271ff', fontSize: 14, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#5271ff', fontSize: 14, fontWeight: '600', marginLeft: 5 },
  errorText: { color: '#ff5252', fontSize: 12, marginBottom: 10, marginLeft: 10 },
});
