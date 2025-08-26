import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { updateMe, uploadAvatar } from '../utils/api';
import { useAppDispatch } from '../store';
import { logout } from '../store/authSlice';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BackButton from '../components/BackButton';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  address: string;
  bio: string;
  profession: string;
  avatarText: string;
  profileImage?: string;
}

const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

const EditProfileScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { user } = route.params;
  const initialEdited: User = {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    birthday: user.birthday || '',
    address: user.location || '',
    bio: user.bio || '',
    profession: (user as any).profession || '',
    avatarText: user.avatarText || '',
    profileImage: user.profileImage,
  };
  const [editedUser, setEditedUser] = useState<User>(initialEdited);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [changesMade, setChangesMade] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // removed gender picker, not in model
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const isChanged = JSON.stringify(initialEdited) !== JSON.stringify(editedUser);
    setChangesMade(isChanged);
  }, [editedUser]);

  useEffect(() => {
    if (user.birthday) {
      const dateParts = user.birthday.split('/');
      if (dateParts.length === 3) {
        const date = new Date(
          parseInt(dateParts[2]),
          parseInt(dateParts[0]) - 1,
          parseInt(dateParts[1])
        );
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    }
  }, [user.birthday]);

  const dispatch = useAppDispatch();

  const handleSave = async () => {
    if (!changesMade) {
      Alert.alert('No Changes', "You haven't made any changes to save.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        address: editedUser.address,
        bio: editedUser.bio,
        profession: editedUser.profession,
      };
      if (editedUser.birthday) {
        const [m, d, y] = editedUser.birthday.split('/');
        if (m && d && y) payload.date_of_birth = new Date(+y, +m - 1, +d).toISOString();
      }
      await updateMe(payload);
      navigation.goBack();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      if (e?.response?.status === 401) {
        dispatch(logout());
        return;
      }
      const message = e?.response?.data?.message || e?.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    setImageLoading(true);
    try {
        // Request permission proactively
        let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
        if (perm.status !== 'granted') {
          Alert.alert('Permission required', 'Media library permission is needed to pick an image.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Upload to backend
        const asset = result.assets[0];
        const uri = asset.uri;
        const form = new FormData();
        // Prefer mimeType from asset; fall back by extension
        const defaultName = 'avatar.jpg';
        const nameFromPath = uri.split('/').pop();
        const name = nameFromPath && nameFromPath.includes('.') ? nameFromPath : defaultName;
        const type = (asset as any).mimeType || (name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
        // @ts-ignore React Native FormData file shape
        form.append('avatar', { uri, name, type } as any);
        try {
          await uploadAvatar(form);
          setEditedUser({ ...editedUser, profileImage: uri });
        } catch (e: any) {
          const msg = e?.response?.data?.message || 'Failed to upload avatar';
          Alert.alert('Error', msg);
        }
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to pick image. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setImageLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedUser({
      ...editedUser,
      [field]: value,
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      handleInputChange('birthday', formattedDate);
    }
  };

  // no gender

  return (
    <SafeAreaView className="mt-[50px] flex-1 bg-[#f0f2f5]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-[#e4e6e9] bg-white px-4 py-3"
        style={Platform.OS === 'ios' ? { paddingTop: 50 } : undefined}>
        <BackButton />
        <Text className="text-lg font-bold">Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || !changesMade}>
          <Text
            className={`text-base font-semibold text-blue-600 ${
              !changesMade || loading ? 'opacity-50' : ''
            }`}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="rounded-lg bg-white p-5">
          {/* Profile Picture */}
          <View className="relative mb-5 items-center">
            {editedUser.profileImage ? (
              <Image source={{ uri: editedUser.profileImage }} className="h-32 w-32 rounded-full" />
            ) : (
              <View className="h-32 w-32 items-center justify-center rounded-full bg-blue-700">
                <Text className="text-6xl font-bold text-white">
                  {editedUser.name ? editedUser.name.charAt(0) : 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              className="absolute bottom-0 right-[35%] h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-700"
              onPress={pickImage}
              disabled={imageLoading}>
              {imageLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialIcons name="photo-camera" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Full Name</Text>
            <TextInput
              className="rounded-md border border-gray-300 bg-white p-3 text-base"
              value={editedUser.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter your full name"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Email</Text>
            <TextInput
              className="rounded-md border border-gray-300 bg-white p-3 text-base"
              value={editedUser.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              placeholder="Your email address"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Phone</Text>
            <TextInput
              className="rounded-md border border-gray-300 bg-white p-3 text-base"
              value={editedUser.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              placeholder="Your phone number"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Address</Text>
            <TextInput
              className="rounded-md border border-gray-300 bg-white p-3 text-base"
              value={editedUser.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Street, city, country"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Bio</Text>
            <TextInput
              className="text-top h-24 rounded-md border border-gray-300 bg-white p-3 text-base"
              value={editedUser.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Profession</Text>
            <TextInput
              className="rounded-md border border-gray-300 bg-white p-3 text-base"
              value={editedUser.profession}
              onChangeText={(text) => handleInputChange('profession', text)}
              placeholder="Your profession"
            />
          </View>

          {/* Date Picker */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Birthday</Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-md border border-gray-300 bg-white p-3"
              onPress={() => setShowDatePicker(true)}>
              <Text
                className={
                  editedUser.birthday ? 'text-base text-black' : 'text-base text-gray-600'
                }>
                {editedUser.birthday || 'Select birthday'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* gender UI removed */}

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-white bg-opacity-70">
          <ActivityIndicator size="large" color="#1877f2" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default EditProfileScreen;
