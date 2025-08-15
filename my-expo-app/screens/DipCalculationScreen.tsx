import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeContext } from '../context/ThemeContext'; // adjust path if needed

const DipCalculationScreen = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <Text style={[styles.text, { color: theme.fontColor, fontSize: theme.fontSize + 4 }]}>
        DipCalculationScreen{' '}
      </Text>
    </View>
  );
};

export default DipCalculationScreen;

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
