import Slider from '@react-native-community/slider';
import { useContext, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import WheelColorPicker from 'react-native-wheel-color-picker';
import { ThemeContext } from '../context/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system';

const defaultColors = {
  light: { bgColor: '#ffffff', fontColor: '#000000' },
  dark: { bgColor: '#121212', fontColor: '#ffffff' },
};

type ManualColors = {
  light: { bgColor: string; fontColor: string };
  dark: { bgColor: string; fontColor: string };
};

export default function GeneralSettingsScreen() {
  const systemScheme = useColorScheme() as 'light' | 'dark' | null;
  const { theme, updateTheme } = useContext(ThemeContext);

  // active mode (light | dark | system)
  const [mode, setMode] = useState<ThemeMode>((theme.mode as ThemeMode) || 'light');

  // manual colors for light & dark so user's custom picks are kept per-mode
  const [manualColors, setManualColors] = useState<ManualColors>(() => ({
    light: {
      bgColor: (theme.mode === 'light' && theme.bgColor) || defaultColors.light.bgColor,
      fontColor: (theme.mode === 'light' && theme.fontColor) || defaultColors.light.fontColor,
    },
    dark: {
      bgColor: (theme.mode === 'dark' && theme.bgColor) || defaultColors.dark.bgColor,
      fontColor: (theme.mode === 'dark' && theme.fontColor) || defaultColors.dark.fontColor,
    },
  }));

  const [fontSize, setFontSize] = useState<number>(theme.fontSize || 16);

  // compute the effective colors used by the UI (covers both manual & system)
  const effectiveBgColor = useMemo(() => {
    if (mode === 'system') {
      if (systemScheme && defaultColors[systemScheme]) {
        return defaultColors[systemScheme].bgColor;
      }
      return manualColors.light.bgColor; // fallback
    }
    return manualColors[mode as 'light' | 'dark'].bgColor;
  }, [mode, systemScheme, manualColors]);

  const effectiveFontColor = useMemo(() => {
    if (mode === 'system') {
      if (systemScheme && defaultColors[systemScheme]) {
        return defaultColors[systemScheme].fontColor;
      }
      return manualColors.light.fontColor; // fallback
    }
    return manualColors[mode as 'light' | 'dark'].fontColor;
  }, [mode, systemScheme, manualColors]);

  // For small UI bits that previously used `mode === 'dark' ? '#222' : '#fff'`,
  // we keep the same contrast rule but base it on the *effective mode* (system or selected).
  const effectiveContrastMode = mode === 'system' ? (systemScheme ?? 'light') : mode;
  const inputBgColor = effectiveContrastMode === 'dark' ? '#222' : '#fff';

  const isManualMode = mode !== 'system';

  const onFontSizeChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num < 12) {
        setFontSize(12);
        Alert.alert('Font size too small', 'Minimum font size is 12');
      } else if (num > 40) {
        setFontSize(40);
        Alert.alert('Font size too large', 'Maximum font size is 40');
      } else {
        setFontSize(num);
      }
    }
  };

  const incrementFontSize = () => {
    setFontSize((prev) => {
      if (prev < 40) return prev + 1;
      Alert.alert('Maximum font size is 40');
      return prev;
    });
  };

  const decrementFontSize = () => {
    setFontSize((prev) => {
      if (prev > 12) return prev - 1;
      Alert.alert('Minimum font size is 12');
      return prev;
    });
  };

  // update manual bg/font colors for the currently selected manual mode (light/dark)
  const updateManualBg = (color: string) => {
    if (mode === 'system') return;
    setManualColors((prev) => ({
      ...prev,
      [mode as 'light' | 'dark']: {
        ...prev[mode as 'light' | 'dark'],
        bgColor: color,
      },
    }));
  };

  const updateManualFont = (color: string) => {
    if (mode === 'system') return;
    setManualColors((prev) => ({
      ...prev,
      [mode as 'light' | 'dark']: {
        ...prev[mode as 'light' | 'dark'],
        fontColor: color,
      },
    }));
  };

  const saveSettings = () => {
    if (mode === 'system') {
      updateTheme({ mode, bgColor: '', fontColor: '', fontSize });
    } else {
      updateTheme({
        mode,
        bgColor: manualColors[mode as 'light' | 'dark'].bgColor,
        fontColor: manualColors[mode as 'light' | 'dark'].fontColor,
        fontSize,
      });
    }
    Alert.alert('Settings Saved', 'Your theme settings have been updated.');
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: effectiveBgColor,
        padding: 16,
      }}
      contentContainerStyle={{ paddingBottom: 40 }}>
      <Text
        style={{
          color: effectiveFontColor,
          fontSize: fontSize + 6,
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center',
        }}>
        Customize Your Theme
      </Text>

      {/* Theme Mode */}
      <Text style={{ color: effectiveFontColor, fontSize, fontWeight: '600', marginBottom: 8 }}>
        Theme Mode
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setMode(t)}
            style={{
              flex: 1,
              marginHorizontal: 6,
              backgroundColor: mode === t ? '#3b82f6' : '#d1d5db',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: mode === t ? '#fff' : '#000',
                fontWeight: '700',
                textTransform: 'capitalize',
                fontSize,
              }}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Background Color */}
      <Text style={{ color: effectiveFontColor, fontSize, fontWeight: '600', marginBottom: 8 }}>
        Background Color
      </Text>
      {isManualMode ? (
        <View style={{ height: 220, marginBottom: 30, borderRadius: 12, borderWidth: 1 }}>
          <WheelColorPicker
            color={manualColors[mode as 'light' | 'dark'].bgColor}
            onColorChange={updateManualBg}
            onColorChangeComplete={updateManualBg}
            thumbSize={28}
            sliderSize={28}
          />
        </View>
      ) : (
        <Text
          style={{
            color: effectiveFontColor,
            fontStyle: 'italic',
            marginBottom: 30,
            textAlign: 'center',
          }}>
          Background color is managed by system theme.
        </Text>
      )}

      {/* Font Color */}
      <Text
        className="mt-12"
        style={{ color: effectiveFontColor, fontSize, fontWeight: '600', marginBottom: 8 }}>
        Font Color
      </Text>
      {isManualMode ? (
        <View style={{ height: 220, marginBottom: 30, borderRadius: 12, borderWidth: 1 }}>
          <WheelColorPicker
            color={manualColors[mode as 'light' | 'dark'].fontColor}
            onColorChange={updateManualFont}
            onColorChangeComplete={updateManualFont}
            thumbSize={28}
            sliderSize={28}
          />
        </View>
      ) : (
        <Text
          style={{
            color: effectiveFontColor,
            fontStyle: 'italic',
            marginBottom: 30,
            textAlign: 'center',
          }}>
          Font color is managed by system theme.
        </Text>
      )}

      {/* Font Size */}
      <Text
        className="mt-12"
        style={{ color: effectiveFontColor, fontSize, fontWeight: '600', marginBottom: 8 }}>
        Font Size
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          onPress={decrementFontSize}
          style={{
            backgroundColor: '#ddd',
            padding: 12,
            borderRadius: 8,
            marginRight: 16,
          }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>-</Text>
        </TouchableOpacity>

        <TextInput
          style={{
            flex: 1,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#aaa',
            paddingVertical: 10,
            paddingHorizontal: 14,
            color: effectiveFontColor,
            fontSize,
            backgroundColor: inputBgColor,
            textAlign: 'center',
          }}
          keyboardType="numeric"
          value={fontSize.toString()}
          onChangeText={onFontSizeChange}
          maxLength={2}
          placeholder="Enter font size (12-40)"
          placeholderTextColor={effectiveFontColor + '88'}
        />

        <TouchableOpacity
          onPress={incrementFontSize}
          style={{
            backgroundColor: '#ddd',
            padding: 12,
            borderRadius: 8,
            marginLeft: 16,
          }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Slider */}
      <Slider
        minimumValue={12}
        maximumValue={40}
        step={1}
        value={fontSize}
        onValueChange={(v) => setFontSize(v)}
        minimumTrackTintColor="#10b981"
        maximumTrackTintColor="#ddd"
        thumbTintColor="#10b981"
        style={{ marginBottom: 40 }}
      />

      {/* Save Button */}
      <TouchableOpacity
        onPress={saveSettings}
        style={{
          backgroundColor: '#10b981',
          paddingVertical: 16,
          borderRadius: 14,
        }}>
        <Text
          style={{
            color: '#fff',
            fontWeight: '800',
            fontSize: fontSize + 2,
            textAlign: 'center',
          }}>
          Save Settings
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
