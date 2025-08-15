import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { contacts } from '../data/data';
import { Contact } from '../types/types';

interface ForwardSelectContactProps {
  onSelectContact: (contact: Contact) => void;
  onClose: () => void;
}

const ForwardSelectContact = ({ onSelectContact, onClose }: ForwardSelectContactProps) => {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black bg-opacity-60">
      <View className="max-h-96 w-11/12 rounded-lg bg-white p-4">
        <Text className="mb-4 text-xl font-bold">Forward To</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="border-b border-gray-200 p-3"
              onPress={() => {
                onSelectContact(item);
                onClose();
              }}>
              <Text className="text-lg">{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity onPress={onClose} className="mt-4 items-center rounded bg-red-500 p-3">
          <Text className="font-semibold text-white">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForwardSelectContact;
