// CreateGroupScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { contacts } from '../data/data';
import { Group, RootStackParamList, SelectedUser, User, UserRole } from '../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

const GROUPS_KEY = 'MESSENGER_GROUPS';

const CreateGroupScreen = ({ navigation }: Props) => {
  // State
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [allUsers] = useState<User[]>(
    contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      avatarText: contact.avatarText,
      online: contact.online,
      lastActive: contact.time,
    }))
  );
  const [filteredUsers, setFilteredUsers] = useState<User[]>(allUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation refs
  const successAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;

  // Filter users based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  // AI-generated group name suggestions
  const generateGroupName = () => {
    if (selectedUsers.length > 0) {
      const names = selectedUsers.slice(0, 3).map((u) => u.name.split(' ')[0]);
      return `${names.join(', ')} `;
    }
    return 'New Group';
  };

  // Handle user selection
  const toggleUserSelection = (user: User) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);

    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, { ...user, role: 'Member' }]);
    }
  };

  // Change user role
  const changeUserRole = (userId: string, role: UserRole) => {
    setSelectedUsers(selectedUsers.map((user) => (user.id === userId ? { ...user, role } : user)));
  };

  // Validate form
  const validateForm = () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      showErrorBanner();
      return false;
    }

    if (selectedUsers.length === 0) {
      setError('At least one member is required');
      showErrorBanner();
      return false;
    }

    return true;
  };

  // Show error banner
  const showErrorBanner = () => {
    Animated.sequence([
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(errorAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Save group to AsyncStorage
  const saveGroup = async (newGroup: Group) => {
    try {
      const existingGroups = await AsyncStorage.getItem(GROUPS_KEY);
      const groups = existingGroups ? JSON.parse(existingGroups) : [];
      groups.push(newGroup);
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
      return true;
    } catch (error) {
      console.error('Failed to save group:', error);
      return false;
    }
  };

  // Create group
  const createGroup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Create new group object
      const newGroup: Group = {
        id: Date.now().toString(),
        name: groupName,
        members: selectedUsers.map((user) => ({
          id: user.id,
          name: user.name,
          avatar: `https://ui-avatars.com/api/?name=${user.name}&background=random`,
          status: user.online ? 'online' : 'offline',
          role: user.role,
        })),
        icon: groupIcon || undefined,
        createdAt: new Date().toISOString(),
        isMuted: false,
        description: `Group created on ${new Date().toLocaleDateString()}`,
      };

      // Save the group
      const success = await saveGroup(newGroup);

      if (success) {
        setIsLoading(false);
        setIsSuccessVisible(true);
      } else {
        throw new Error('Failed to save group');
      }
    } catch {
      setIsLoading(false);
      setError('Failed to create group. Please try again.');
      showErrorBanner();
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Media library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setGroupIcon(result.assets[0].uri);
    }
  };

  // Render user item
  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item)}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>{item.avatarText}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userStatus}>
            {item.online ? 'Online' : `Last seen ${item.lastActive}`}
          </Text>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#4361ee" />}
      </TouchableOpacity>
    );
  };

  // Render selected user item
  const renderSelectedUserItem = ({ item, index }: { item: SelectedUser; index: number }) => (
    <View style={styles.selectedUserContainer}>
      <View style={styles.selectedUserItem}>
        <View style={styles.selectedUserAvatar}>
          <Text style={styles.avatarText}>{item.avatarText}</Text>
        </View>
        <View style={styles.selectedUserInfo}>
          <Text style={styles.selectedUserName}>{item.name}</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, item.role === 'Admin' && styles.adminRole]}
              onPress={() => changeUserRole(item.id, item.role === 'Admin' ? 'Member' : 'Admin')}>
              <Text style={[styles.roleText, item.role === 'Admin' && styles.adminRoleText]}>
                {item.role}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => toggleUserSelection(item)} style={styles.removeUserButton}>
          <Ionicons name="close" size={20} color="#f72585" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render preview modal
  const renderPreviewModal = () => (
    <Modal visible={isPreviewVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Preview</Text>
            <TouchableOpacity onPress={() => setIsPreviewVisible(false)}>
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.previewContent}>
            {groupIcon ? (
              <Image source={{ uri: groupIcon }} style={styles.previewIcon} />
            ) : (
              <View style={styles.previewIconPlaceholder}>
                <Text style={styles.previewIconText}>{groupName.charAt(0) || 'G'}</Text>
              </View>
            )}

            <Text style={styles.previewGroupName}>{groupName}</Text>

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Members ({selectedUsers.length})</Text>
              {selectedUsers.map((user) => (
                <View key={user.id} style={styles.previewMemberItem}>
                  <View style={styles.previewMemberAvatar}>
                    <Text style={styles.avatarText}>{user.avatarText}</Text>
                  </View>
                  <View style={styles.previewMemberInfo}>
                    <Text style={styles.previewMemberName}>{user.name}</Text>
                    <Text style={styles.previewMemberRole}>{user.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsPreviewVisible(false)}>
              <Text style={styles.cancelButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={createGroup}
              disabled={isLoading}>
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Creating...' : 'Create Group'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render success modal
  const renderSuccessModal = () => (
    <Modal visible={isSuccessVisible} animationType="fade" transparent={true}>
      <View style={styles.successOverlay}>
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={60} color="#4cc9f0" />
          <Text style={styles.successTitle}>Group Created!</Text>
          <Text style={styles.successMessage}>
            {`Your group "${groupName}" has been successfully created.`}
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => {
              setIsSuccessVisible(false);
              navigation.navigate('Messages');
            }}>
            <Text style={styles.successButtonText}>Continue to Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Error Banner */}
      <Animated.View
        style={[
          styles.banner,
          styles.errorBanner,
          {
            transform: [
              {
                translateY: errorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.bannerText}>{error}</Text>
      </Animated.View>

      {/* Success Banner */}
      <Animated.View
        style={[
          styles.banner,
          styles.successBanner,
          {
            transform: [
              {
                translateY: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.bannerText}>Group created successfully!</Text>
      </Animated.View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Icon - Centered at top */}
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.iconUploadContainer}>
            {groupIcon ? (
              <Image source={{ uri: groupIcon }} style={styles.groupIcon} />
            ) : (
              <View style={styles.iconPlaceholder}>
                <Ionicons name="camera" size={24} color="#6c757d" />
                <Text style={styles.iconPlaceholderText}>Add Icon</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Group Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
            />
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={() => setGroupName(generateGroupName())}>
              <Text style={styles.suggestionButtonText}>AI Suggest</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Selected Members ({selectedUsers.length})</Text>
            <FlatList
              data={selectedUsers}
              renderItem={renderSelectedUserItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* User Search */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Add Members</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users..."
            />
          </View>
        </View>

        {/* User List */}
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={() => {
            if (validateForm()) {
              setIsPreviewVisible(true);
            }
          }}
          disabled={selectedUsers.length === 0}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderPreviewModal()}
      {renderSuccessModal()}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
  },
  errorBanner: {
    backgroundColor: '#f72585',
  },
  successBanner: {
    backgroundColor: '#4cc9f0',
  },
  bannerText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  suggestionButton: {
    backgroundColor: '#4361ee',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginLeft: 8,
  },
  suggestionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  iconUploadContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  groupIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  groupIconSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupIconPlaceholderSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconTextSmall: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconPlaceholder: {
    alignItems: 'center',
  },
  iconPlaceholderText: {
    color: '#6c757d',
    fontSize: 12,
    marginTop: 4,
  },
  tagsContainer: {
    height: 50,
  },
  tagItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
  },
  tagText: {
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
  },
  userList: {
    marginTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectedUserItem: {
    backgroundColor: '#e7f5ff',
    borderLeftWidth: 4,
    borderLeftColor: '#4361ee',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  userStatus: {
    fontSize: 12,
    color: '#6c757d',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedUserContainer: {
    marginRight: 12,
    width: 100,
  },
  selectedUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedUserInfo: {
    alignItems: 'center',
  },
  selectedUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  roleContainer: {
    marginTop: 4,
  },
  roleButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminRole: {
    backgroundColor: '#4361ee',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
  },
  adminRoleText: {
    color: 'white',
  },
  removeUserButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4361ee',
    marginRight: 8,
  },
  editButtonText: {
    color: '#4361ee',
    fontWeight: '600',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#4361ee',
    marginLeft: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  previewContent: {
    padding: 20,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 16,
  },
  previewIconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  previewIconText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  previewGroupName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  previewMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  previewMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4361ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewMemberInfo: {
    flex: 1,
  },
  previewMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  previewMemberRole: {
    fontSize: 14,
    color: '#6c757d',
  },
  previewTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewTagText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6c757d',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#4361ee',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    width: width * 0.8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginVertical: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#4361ee',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupInfo: {
    marginLeft: 15,
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#495057',
  },
  groupListContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#212529',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CreateGroupScreen;
