import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../store';
import { createConversation } from '../store/chatSlice';
import { chatApiService } from '../utils/chatApi';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const NewConversationScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateConversation = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      // First, search for the user by email
      const users = await chatApiService.searchUsers(email.trim());
      
      if (users.length === 0) {
        Alert.alert('Error', 'No user found with this email address');
        return;
      }

      const targetUser = users[0];
      
      // Create conversation with the found user
      await dispatch(createConversation({
        participantIds: [targetUser._id],
        type: 'direct'
      })).unwrap();

      Alert.alert('Success', 'Conversation created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.fontColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.fontColor }]}>New Conversation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.fontColor }]}>
          Enter the email address of the person you want to start a conversation with:
        </Text>
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.mode === 'dark' ? '#333' : '#f5f5f5',
            color: theme.fontColor,
            borderColor: theme.mode === 'dark' ? '#555' : '#ddd'
          }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          placeholderTextColor={theme.fontColor + '60'}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: email.trim() ? '#6366F1' : '#ccc' }]}
          onPress={handleCreateConversation}
          disabled={!email.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Start Conversation</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 30,
  },
  createButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewConversationScreen;
