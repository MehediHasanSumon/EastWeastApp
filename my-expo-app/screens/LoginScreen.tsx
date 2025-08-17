import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store';
import { login } from '../store/authSlice';
import { RootStackParamList } from '../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const DUMMY_EMAIL = '';
const DUMMY_PASSWORD = '';

export default function LoginScreen({}: Props) {
  const { theme } = useContext(ThemeContext);
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const [showForgot, setShowForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const trimmedEmail = email.trim();
    
    // Check if email is empty or just whitespace
    if (!trimmedEmail) {
      return false;
    }
    
    // Check if email contains @ symbol
    if (!trimmedEmail.includes('@')) {
      return false;
    }
    
    // Check if email has domain part
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2 || !parts[1] || !parts[1].includes('.')) {
      return false;
    }
    
    // Use the same regex as backend
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmedEmail);
  };

  const handleEmailChange = (text: string) => {
    const trimmedText = text.trim();
    setEmail(trimmedText);
    
    // Clear error if user is typing
    if (emailError) {
      setEmailError('');
    }
    
    // Show validation error if user has typed something but it's invalid
    if (trimmedText && !validateEmail(trimmedText)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleResetEmailChange = (text: string) => {
    const trimmedText = text.trim();
    setResetEmail(trimmedText);
    
    // Clear error if user is typing
    if (resetEmailError) {
      setResetEmailError('');
    }
    
    // Show validation error if user has typed something but it's invalid
    if (trimmedText && !validateEmail(trimmedText)) {
      setResetEmailError('Please enter a valid email address');
    }
  };



  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    
    // Clear previous errors
    setEmailError('');
    
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Email validation
    if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Additional safety check - ensure email is properly formatted
    const cleanEmail = trimmedEmail.toLowerCase().replace(/\s+/g, '');

    const result = await dispatch(login({ email: cleanEmail, password: trimmedPassword }));
    if ((result as any).meta.requestStatus === 'fulfilled') {
      Alert.alert('Success', 'Login Successful!');
    } else if (typeof (result as any).payload === 'string') {
      Alert.alert('Login Failed', (result as any).payload);
    } else {
      Alert.alert('Login Failed', 'Something went wrong');
    }
  };

  const handleSendResetLink = () => {
    const trimmedResetEmail = resetEmail.trim();
    
    // Clear previous errors
    setResetEmailError('');
    
    if (!trimmedResetEmail) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    // Email validation
    if (!validateEmail(trimmedResetEmail)) {
      setResetEmailError('Please enter a valid email address');
      return;
    }

    Alert.alert('Success', `Reset link sent to ${trimmedResetEmail}`);
  };

  // Input styles depending on theme mode
  const inputBgColor = theme.mode === 'dark' ? '#222' : '#fff';
  const inputBorderColor = theme.mode === 'dark' ? '#555' : '#ccc';
  const placeholderTextColor = theme.fontColor + '88';

  // Button background color example
  const buttonBgColor = theme.mode === 'dark' ? '#4c51bf' : '#6366f1'; // indigo shades
  const buttonShadowColor = buttonBgColor;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.bgColor }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
          paddingTop: 40,
        }}
        keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
          <Text
            style={{
              marginBottom: 8,
              fontSize: 24,
              fontWeight: '600',
              color: theme.fontColor,
            }}>
            Welcome Back
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 14,
              color: theme.mode === 'dark' ? '#a5b4fc' : '#6366f1', // lighter indigo for dark, darker for light
            }}>
            Sign in to your account to continue
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.mode === 'dark' ? '#121212' : '#fff',
            padding: 24,
            borderRadius: 24,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 5,
          }}>
          {!showForgot ? (
            <>
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    marginBottom: 6,
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.fontColor,
                  }}>
                  Email Address
                </Text>
                <TextInput
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholderTextColor={placeholderTextColor}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: emailError ? '#ef4444' : inputBorderColor,
                    backgroundColor: inputBgColor,
                    color: theme.fontColor,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 16,
                  }}
                />
                {emailError ? (
                  <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                    {emailError}
                  </Text>
                ) : null}
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    marginBottom: 6,
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.fontColor,
                  }}>
                  Password
                </Text>
                <TextInput
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor={placeholderTextColor}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: inputBorderColor,
                    backgroundColor: inputBgColor,
                    color: theme.fontColor,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 16,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={() => setShowForgot(true)}
                style={{ marginBottom: 20, alignSelf: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: buttonBgColor,
                  }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                style={{
                  alignItems: 'center',
                  borderRadius: 12,
                  backgroundColor: buttonBgColor,
                  paddingVertical: 16,
                  shadowColor: buttonShadowColor,
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 5,
                  marginBottom: 10,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: 18,
                  }}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
              
              
              {error ? (
                <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>{error}</Text>
              ) : null}
            </>
          ) : (
            <>
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    marginBottom: 6,
                    fontSize: 16,
                    fontWeight: '500',
                    color: theme.fontColor,
                  }}>
                  Email Address
                </Text>
                <TextInput
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={resetEmail}
                  onChangeText={handleResetEmailChange}
                  placeholderTextColor={placeholderTextColor}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: resetEmailError ? '#ef4444' : inputBorderColor,
                    backgroundColor: inputBgColor,
                    color: theme.fontColor,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    fontSize: 16,
                  }}
                />
                {resetEmailError ? (
                  <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                    {resetEmailError}
                  </Text>
                ) : null}
              </View>

              <Text
                style={{
                  marginBottom: 20,
                  fontSize: 14,
                  color: theme.mode === 'dark' ? '#9ca3af' : '#6b7280',
                }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Text>

              <TouchableOpacity
                onPress={handleSendResetLink}
                style={{
                  alignItems: 'center',
                  borderRadius: 12,
                  backgroundColor: buttonBgColor,
                  paddingVertical: 16,
                  shadowColor: buttonShadowColor,
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 5,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: 18,
                  }}>
                  Send Reset Link
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowForgot(false)}
                style={{ marginTop: 24, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: buttonBgColor,
                  }}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
