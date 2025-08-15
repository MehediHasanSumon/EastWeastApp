import { useContext } from 'react';
import { Text, View } from 'react-native';
import { ThemeContext } from '../context/ThemeContext'; // adjust path if needed

const CustomerBillScreen = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bgColor }}>
      <Text className="text-2xl" style={{ color: theme.fontColor, fontSize: theme.fontSize + 4 }}>
        CustomerBillScreen
      </Text>
    </View>
  );
};

export default CustomerBillScreen;
