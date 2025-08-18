import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useToast } from '../context/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          visible={true}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => hideToast(toast.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});

export default ToastContainer;
