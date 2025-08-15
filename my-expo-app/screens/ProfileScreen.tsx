import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string;
  location: string;
  joined: string;
  bio: string;
  avatarText: string;
  profileImage?: string;
  isOnline: boolean;
  lastActive?: string;
}

import { API_BASE_URL, getMe } from '../utils/api';
import { useAppDispatch } from '../store';
import { logout } from '../store/authSlice';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    // Refresh profile whenever the screen gains focus
    React.useCallback(() => {
      loadUserData();
      return () => {};
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await getMe();
      const u = data.user;
      const name = u?.name || u?.email || 'User';
      const avatarText = String(name)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const roles: string = Array.isArray(u?.roles)
        ? u.roles
            .map((r: any) => r?.name || r?.title || r?._id)
            .filter(Boolean)
            .join(', ')
        : '';
      const mapped: User = {
        id: u?._id || '0',
        name,
        username: u?.email ? `@${u.email.split('@')[0]}` : '@user',
        email: u?.email || '',
        phone: u?.phone || '',
        gender: '',
        birthday: u?.date_of_birth ? new Date(u.date_of_birth).toLocaleDateString() : '',
        location: u?.address || roles,
        joined: '',
        bio: u?.bio || '',
        avatarText,
        isOnline: true,
        lastActive: 'now',
        profileImage: u?.profile_picture?.image
          ? (u.profile_picture.image.startsWith('http')
              ? u.profile_picture.image
              : `${API_BASE_URL.replace(/\/$/, '')}${u.profile_picture.image.startsWith('/') ? '' : '/'}${u.profile_picture.image}`)
          : undefined,
      };
      setUser(mapped);
    } catch (e: any) {
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message || 'Failed to load profile';
      if (status === 401) {
        // Token invalid/expired -> force logout
        dispatch(logout());
        return;
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f0f2f5]">
        <ActivityIndicator size="large" color="#1877f2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className=" flex-1 bg-[#f0f2f5]">
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1877f2']} />
        }>
        {user && (
          <View className="mx-4 my-4 rounded-lg bg-white p-5 shadow-md">
            <View className="items-center border-b border-gray-300 pb-5">
              <View className="relative mb-4 h-[100px] w-[100px] items-center justify-center rounded-full bg-[#1877f2]">
                {user.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    className="h-[100px] w-[100px] rounded-full"
                  />
                ) : (
                  <Text className="text-[40px] font-bold text-white">{user.avatarText}</Text>
                )}

                <TouchableOpacity
                  className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600"
                  onPress={handleEditProfile}>
                  <MaterialIcons name="photo-camera" size={20} color="white" />
                </TouchableOpacity>

                {user.isOnline && (
                  <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#31A24C]" />
                )}
              </View>

              <Text className="mb-1 text-[22px] font-extrabold text-[#050505]">{user.name}</Text>
              <Text className="mb-4 text-[14px] text-gray-500">
                {user.isOnline ? 'Active now' : `Last active ${user.lastActive}`}
              </Text>
            </View>

            <Text className="mb-3 mt-5 border-b border-gray-300 pb-2 text-lg font-semibold text-[#050505]">
              Menu
            </Text>

            <TouchableOpacity
              className="mb-1 flex-row items-center gap-3 space-x-3 rounded-md bg-white p-3"
              onPress={handleEditProfile}>
              <Feather name="user" size={20} color="#65676b" />
              <Text className="flex-1 text-base text-[#050505]">My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity className="mb-1 flex-row items-center gap-3 space-x-3 rounded-md bg-white p-3">
              <Feather name="settings" size={20} color="#65676b" />
              <Text className="flex-1 text-base text-[#050505]">Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mb-1 flex-row items-center gap-3 space-x-3 rounded-md bg-white p-3"
              onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#65676b" />
              <Text className="flex-1 text-base text-[#050505]">Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
