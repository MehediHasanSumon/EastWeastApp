import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';
import { ChatMessage } from '../types/chat';

const { width } = Dimensions.get('window');

interface MessageActionsProps {
  visible: boolean;
  onClose: () => void;
  message: ChatMessage;
  isOwnMessage: boolean;
  onReact: (emoji: string) => void;
  onEdit: (newContent: string) => void;
  onDelete: (deleteForEveryone: boolean) => void;
  onReply: () => void;
  onForward: () => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯'];

const MessageActions: React.FC<MessageActionsProps> = ({
  visible,
  onClose,
  message,
  isOwnMessage,
  onReact,
  onEdit,
  onDelete,
  onReply,
  onForward,
}) => {
  const { theme } = useContext(ThemeContext);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(editContent.trim());
      setShowEditModal(false);
      onClose();
    }
  };

  const handleDelete = (deleteForEveryone: boolean) => {
    Alert.alert(
      deleteForEveryone ? 'Delete for Everyone' : 'Delete for Me',
      deleteForEveryone 
        ? 'This message will be deleted for everyone. This action cannot be undone.'
        : 'This message will be deleted for you only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(deleteForEveryone);
            setShowDeleteModal(false);
            onClose();
          },
        },
      ]
    );
  };

  const handleReaction = (emoji: string) => {
    onReact(emoji);
    onClose();
  };

  return (
    <>
      {/* Main Actions Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
          <View style={[styles.container, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            {/* Reactions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.fontColor + '99' }]}>React</Text>
              <View style={styles.reactionsGrid}>
                {REACTION_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionButton}
                    onPress={() => handleReaction(emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Message Actions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.fontColor + '99' }]}>Actions</Text>
              
              <TouchableOpacity style={styles.actionButton} onPress={onReply}>
                <Ionicons name="arrow-undo" size={20} color={theme.fontColor} />
                <Text style={[styles.actionText, { color: theme.fontColor }]}>Reply</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={onForward}>
                <Ionicons name="arrow-forward" size={20} color={theme.fontColor} />
                <Text style={[styles.actionText, { color: theme.fontColor }]}>Forward</Text>
              </TouchableOpacity>

              {isOwnMessage && message.canEdit && (
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={20} color={theme.fontColor} />
                  <Text style={[styles.actionText, { color: theme.fontColor }]}>Edit</Text>
                </TouchableOpacity>
              )}

              {isOwnMessage && message.canDelete && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => setShowDeleteModal(true)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
                </TouchableOpacity>
              )}

              {!isOwnMessage && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => onDelete(false)}
                >
                  <Ionicons name="remove-circle-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.actionText, { color: '#FF3B30' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editOverlay}>
          <View style={[styles.editContainer, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            <Text style={[styles.editTitle, { color: theme.fontColor }]}>Edit Message</Text>
            
            <TextInput
              style={[styles.editInput, { 
                color: theme.fontColor,
                backgroundColor: theme.mode === 'dark' ? '#3A3B3C' : '#F0F2F5',
                borderColor: theme.mode === 'dark' ? '#3A3B3C' : '#E4E6EB'
              }]}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              placeholder="Edit your message..."
              placeholderTextColor={theme.fontColor + '66'}
            />
            
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton]} 
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.editButton, styles.saveButton]} 
                onPress={handleEditSubmit}
                disabled={!editContent.trim() || editContent === message.content}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.editOverlay}>
          <View style={[styles.editContainer, { backgroundColor: theme.mode === 'dark' ? '#242526' : '#FFFFFF' }]}>
            <Text style={[styles.editTitle, { color: theme.fontColor }]}>Delete Message</Text>
            
            <Text style={[styles.deleteDescription, { color: theme.fontColor + '99' }]}>
              Choose how you want to delete this message:
            </Text>
            
            <View style={styles.deleteActions}>
              <TouchableOpacity 
                style={[styles.deleteOptionButton, { borderColor: theme.fontColor + '30' }]} 
                onPress={() => handleDelete(false)}
              >
                <Ionicons name="person-outline" size={20} color={theme.fontColor} />
                <Text style={[styles.deleteOptionText, { color: theme.fontColor }]}>Delete for Me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteOptionButton, { borderColor: theme.fontColor + '30' }]} 
                onPress={() => handleDelete(true)}
              >
                <Ionicons name="people-outline" size={20} color={theme.fontColor} />
                <Text style={[styles.deleteOptionText, { color: theme.fontColor }]}>Delete for Everyone</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.editButton, styles.cancelButton]} 
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reactionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F0F2F5',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FF3B3010',
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F2F5',
  },
  saveButton: {
    backgroundColor: '#0084FF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteActions: {
    marginBottom: 20,
  },
  deleteOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: '#F8F9FA',
  },
  deleteOptionText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default MessageActions;
