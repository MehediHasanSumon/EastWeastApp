import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContext } from '../context/ThemeContext'; // Adjust path if needed

const CompanyLogoScreen = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <Text style={[styles.text, { color: theme.fontColor, fontSize: theme.fontSize + 4 }]}>
        CompanyLogoScreen
      </Text>
    </View>
  );
};

export default CompanyLogoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});
