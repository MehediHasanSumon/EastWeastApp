import { Modal, Text, TouchableOpacity, View } from 'react-native';

type MessageActionsModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedMessage: any;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
};

const MessageActionsModal = ({
  visible,
  onClose,
  selectedMessage,
  onCopy,
  onForward,
  onDelete,
}: MessageActionsModalProps) => {
  if (!selectedMessage) return null;

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-xl bg-white p-4">
          <TouchableOpacity className="border-b border-gray-200 py-4" onPress={onCopy}>
            <Text className="text-center text-base text-gray-900">Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity className="border-b border-gray-200 py-4" onPress={onForward}>
            <Text className="text-center text-base text-gray-900">Forward</Text>
          </TouchableOpacity>
          <TouchableOpacity className="border-b border-gray-200 py-4" onPress={onDelete}>
            <Text className="text-center text-base text-red-500">Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity className="pt-4" onPress={onClose}>
            <Text className="text-center text-base text-gray-900">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default MessageActionsModal;
