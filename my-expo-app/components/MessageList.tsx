import React from 'react';
import { ScrollView } from 'react-native';
import { Message } from '../types/types';
import MessageItem from './MessageItem';

type MessageListProps = {
  messages: Message[];
  scrollViewRef: React.RefObject<ScrollView | null>; // <-- এখানে null অনুমোদন দিন
  handleMessagePress: (msg: Message) => void;
};

const MessageList = ({ messages, scrollViewRef, handleMessagePress }: MessageListProps) => {
  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 bg-gray-100"
      contentContainerStyle={{ padding: 16 }}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} msg={msg} onLongPress={() => handleMessagePress(msg)} />
      ))}
    </ScrollView>
  );
};

export default MessageList;
