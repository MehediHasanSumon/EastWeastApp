import { FontAwesome } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { Message } from '../types/types';

type MessageItemProps = {
  msg: Message;
  onLongPress: () => void;
};

const MessageItem = ({ msg, onLongPress }: MessageItemProps) => {
  return (
    <Pressable
      className={`mb-4 max-w-[80%] flex-row ${
        msg.isSent ? 'flex-row-reverse self-end' : 'self-start'
      }`}
      onLongPress={onLongPress}>
      {!msg.isSent && msg.sender && (
        <Image source={{ uri: msg.sender.avatar }} className="ml-2 mr-2 h-8 w-8 rounded-full" />
      )}
      <View className="max-w-full flex-col">
        {!msg.isSent && msg.sender && (
          <Text className="mb-1 ml-2 text-xs text-gray-500">{msg.sender.name}</Text>
        )}

        <View
          className={`rounded-2xl px-4 py-3 ${
            msg.isSent ? 'rounded-br-sm bg-blue-500' : 'rounded-bl-sm bg-white shadow-sm'
          }`}>
          {msg.text && (
            <Text className={msg.isSent ? 'text-base text-white' : 'text-base text-gray-900'}>
              {msg.text}
            </Text>
          )}

          {msg.attachment && (
            <View className="mt-2 overflow-hidden rounded-md">
              {msg.attachment.type === 'image' ? (
                <Image
                  source={{ uri: msg.attachment.uri }}
                  className="h-36 w-48 rounded-md"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center rounded-md bg-blue-500 p-3">
                  <FontAwesome name="paper-plane" size={20} color="white" />
                  <Text
                    className={`mt-2 text-xs ${msg.isSent ? 'text-white' : 'text-white'}`}
                    numberOfLines={1}>
                    {msg.attachment.name}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Text
          className={`mt-1 text-xs ${
            msg.isSent ? 'self-end text-gray-400' : 'self-start text-gray-500'
          }`}>
          {msg.time}
        </Text>
      </View>
    </Pressable>
  );
};

export default MessageItem;
