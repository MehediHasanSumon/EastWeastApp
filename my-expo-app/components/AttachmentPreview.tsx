import { FontAwesome } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Attachment } from '../types/types';

type AttachmentPreviewProps = {
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
};

const AttachmentPreview = ({ attachments, setAttachments }: AttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  const attachment = attachments[0];

  return (
    <View className="relative mx-4 mb-2 rounded-lg border border-gray-300 bg-gray-100 p-3">
      {attachment.type === 'image' ? (
        <Image source={{ uri: attachment.uri }} className="h-48 w-full rounded" />
      ) : (
        <View className="flex-row items-center rounded bg-white p-3">
          <FontAwesome name="file" size={24} color="#666" />
          <Text className="ml-3 flex-1 text-gray-600" numberOfLines={1}>
            {attachment.name}
          </Text>
        </View>
      )}
      <TouchableOpacity
        className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500"
        onPress={() => setAttachments([])}>
        <FontAwesome name="times" size={12} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default AttachmentPreview;
