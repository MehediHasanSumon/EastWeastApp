import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../utils/api';

interface Role {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  status: boolean;
  verify_at: string | null;
  address?: string;
  phone?: string;
  bio?: string;
  profession?: string;
  date_of_birth?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  roles: string[];
  status: boolean;
  address?: string;
  phone?: string;
  bio?: string;
  profession?: string;
  date_of_birth?: string;
}

export default function EmployeeScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    roles: [],
    status: true,
    address: '',
    phone: '',
    bio: '',
    profession: '',
    date_of_birth: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/get/users');
      if (response.data.status) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/admin/get/roles-for-user');
      if (response.data.status) {
        setRoles(response.data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      roles: [],
      status: true,
      address: '',
      phone: '',
      bio: '',
      profession: '',
      date_of_birth: '',
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password for editing
      roles: user.roles.map(role => role._id),
      status: user.status,
      address: user.address || '',
      phone: user.phone || '',
      bio: user.bio || '',
      profession: user.profession || '',
      date_of_birth: user.date_of_birth || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleInputChange = (field: keyof UserFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Validation Error', 'Password is required for new users');
      return false;
    }
    if (formData.roles.length === 0) {
      Alert.alert('Validation Error', 'At least one role must be selected');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingUser) {
        // Update existing user
        const updateData: Partial<UserFormData> = { ...formData };
        if (!updateData.password?.trim()) {
          updateData.password = undefined; // Set to undefined instead of deleting
        }
        
        const response = await api.put(`/api/admin/update/user/${editingUser._id}`, updateData);
        if (response.data.status) {
          Alert.alert('Success', 'User updated successfully');
          closeModal();
          fetchUsers();
        } else {
          throw new Error(response.data.message || 'Failed to update user');
        }
      } else {
        // Create new user
        const response = await api.post('/api/admin/create/user', formData);
        if (response.data.status) {
          Alert.alert('Success', 'User created successfully');
          closeModal();
          fetchUsers();
        } else {
          throw new Error(response.data.message || 'Failed to create user');
        }
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      let errorMessage = 'Failed to save user';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/api/admin/delete/users', { userIds: [userId] });
              if (response.data.status) {
                Alert.alert('Success', 'User deleted successfully');
                fetchUsers();
              } else {
                throw new Error(response.data.message || 'Failed to delete user');
              }
            } catch (error: any) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };



  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && user.status) ||
                         (selectedStatus === 'inactive' && !user.status);
    return matchesSearch && matchesStatus;
  });

  const renderUserItem = ({ item }: { item: User }) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
          <Text className="text-sm text-gray-600">{item.email}</Text>
          <View className="flex-row flex-wrap mt-2">
            {item.roles.map((role, index) => (
              <View key={role._id} className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                <Text className="text-xs text-blue-800">{role.name}</Text>
              </View>
            ))}
          </View>
          {item.phone && (
            <Text className="text-sm text-gray-500 mt-1">📞 {item.phone}</Text>
          )}
          {item.profession && (
            <Text className="text-sm text-gray-500">💼 {item.profession}</Text>
          )}
        </View>
        <View className="items-end">
          <View className={`px-3 py-1 rounded-full mb-2 ${
            item.status ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs font-medium ${
              item.status ? 'text-green-800' : 'text-red-800'
            }`}>
              {item.status ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              className="p-2 rounded-full bg-blue-100">
              <Ionicons name="create" size={16} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteUser(item._id)}
              className="p-2 rounded-full bg-red-100">
              <Ionicons name="trash" size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.verify_at && (
          <Text className="text-xs text-green-600">
            ✓ Verified: {new Date(item.verify_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        className="pt-12 pb-6 px-4"
        style={{ overflow: 'hidden' }}>
        <Text className="text-2xl font-bold text-white text-center mb-2">
          👥 Employee Management
        </Text>
        <Text className="text-white text-center opacity-90">
          Manage users, roles, and permissions
        </Text>
      </LinearGradient>

      {/* Search and Filters */}
      <View className="px-4 mt-4 gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextInput
              className="bg-white rounded-lg px-4 py-3 border border-gray-300"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            onPress={openCreateModal}
            className="bg-blue-600 px-6 py-3 rounded-lg">
            <Text className="text-white font-semibold">Add User</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <View className="bg-white rounded-lg border border-gray-300">
              <Picker
                selectedValue={selectedStatus}
                onValueChange={setSelectedStatus}
                style={{ height: 50 }}>
                <Picker.Item label="All Status" value="all" />
                <Picker.Item label="Active Only" value="active" />
                <Picker.Item label="Inactive Only" value="inactive" />
              </Picker>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-center py-3 text-gray-600">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Users List */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-xl font-semibold text-gray-600">No users found</Text>
          <Text className="mt-2 text-gray-500 text-center">
            {searchQuery || selectedStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first user'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          className="mt-4 px-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Create/Edit User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View className="flex-1 justify-center bg-black/50 p-5">
          <ScrollView className="bg-white rounded-2xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-gray-800">
                {editingUser ? 'Edit User' : 'Create New User'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Name *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="Enter full name"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Email *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!editingUser && (
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Password *</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </View>
              )}

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Roles *</Text>
                <View className="border border-gray-300 rounded-lg bg-gray-50">
                  <Picker
                    selectedValue={formData.roles[0] || ''}
                    onValueChange={(value) => handleInputChange('roles', [value])}
                    style={{ height: 50 }}>
                    <Picker.Item label="Select a role" value="" />
                    {roles.map((role) => (
                      <Picker.Item key={role._id} label={role.name} value={role._id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Phone</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Profession</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  value={formData.profession}
                  onChangeText={(value) => handleInputChange('profession', value)}
                  placeholder="Enter profession"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Address</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Bio</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                  value={formData.bio}
                  onChangeText={(value) => handleInputChange('bio', value)}
                  placeholder="Enter bio"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="flex-row items-center space-x-3">
                <TouchableOpacity
                  onPress={() => handleInputChange('status', !formData.status)}
                  className="flex-row items-center">
                  <View className={`h-5 w-5 rounded border-2 border-indigo-600 ${
                    formData.status ? 'bg-indigo-600' : 'bg-transparent'
                  }`} />
                  <Text className="ml-2 font-medium text-gray-700">Active Status</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                onPress={closeModal}
                className="flex-1 bg-gray-500 py-3 rounded-lg">
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-1 bg-blue-600 py-3 rounded-lg">
                <Text className="text-white font-semibold text-center">
                  {editingUser ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
