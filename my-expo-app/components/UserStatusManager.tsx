import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStatus } from '../context/UserStatusContext';
import UserStatusIndicator from './UserStatusIndicator';

type StatusOption = {
  key: 'online' | 'away' | 'busy' | 'offline';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
};

const statusOptions: StatusOption[] = [
  {
    key: 'online',
    label: 'Online',
    icon: 'ellipse',
    color: '#10B981',
    description: 'Available for chat and calls'
  },
  {
    key: 'away',
    label: 'Away',
    icon: 'time',
    color: '#F59E0B',
    description: 'Temporarily unavailable'
  },
  {
    key: 'busy',
    label: 'Busy',
    icon: 'pause-circle',
    color: '#EF4444',
    description: 'Do not disturb'
  },
  {
    key: 'offline',
    label: 'Offline',
    icon: 'ellipse-outline',
    color: '#6B7280',
    description: 'Appear offline to others'
  }
];

const UserStatusManager: React.FC = () => {
  const { userStatus, updateStatus, lastSeen } = useUserStatus();
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusChange = async (newStatus: 'online' | 'away' | 'busy' | 'offline') => {
    try {
      await updateStatus(newStatus);
      setShowStatusModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const currentStatus = statusOptions.find(option => option.key === userStatus);

  return (
    <>
      {/* Status Display Button */}
      <TouchableOpacity
        style={styles.statusButton}
        onPress={() => setShowStatusModal(true)}
        activeOpacity={0.7}
      >
        <UserStatusIndicator showText size="medium" />
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </TouchableOpacity>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.statusOption,
                    userStatus === option.key && styles.selectedStatusOption
                  ]}
                  onPress={() => handleStatusChange(option.key)}
                >
                  <View style={styles.statusOptionContent}>
                    <View style={[styles.statusIcon, { backgroundColor: option.color }]}>
                      <Ionicons name={option.icon} size={20} color="white" />
                    </View>
                    <View style={styles.statusTextContainer}>
                      <Text style={[
                        styles.statusLabel,
                        userStatus === option.key && styles.selectedStatusLabel
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.statusDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {userStatus === option.key && (
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {lastSeen && userStatus === 'offline' && (
              <View style={styles.lastSeenContainer}>
                <Text style={styles.lastSeenLabel}>
                  Last seen: {lastSeen.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  statusOptions: {
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedStatusOption: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedStatusLabel: {
    color: '#10B981',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lastSeenContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  lastSeenLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default UserStatusManager;
