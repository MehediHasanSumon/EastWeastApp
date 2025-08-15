import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext, useEffect, useState } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext'; // Import your ThemeContext
import { RootStackParamList } from '../types/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CallScreen'>;

const CallScreen = ({ route, navigation }: Props) => {
  const { theme } = useContext(ThemeContext); // Access current theme

  const { type } = route.params;
  const isGroupCall = 'group' in route.params;
  const name = isGroupCall ? route.params.group.name : route.params.contactName;

  const avatarText = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const avatarBgColor = theme.mode === 'dark' ? '#2563eb' : '#3b82f6';
  const textColorPrimary = theme.fontColor;
  const textColorSecondary = theme.mode === 'dark' ? '#cbd5e1' : '#374151'; // lighter/dark text

  const buttonBgColor = theme.mode === 'dark' ? '#2563eb' : '#3b82f6'; // blue shades

  return (
    <SafeAreaView
      style={{
        flex: 1,
        // Since react-native-linear-gradient isn't used here, we use a simple bg color fallback
        backgroundColor: theme.bgColor,
        // You can replace this with LinearGradient if you want gradient backgrounds:
        // <LinearGradient colors={[bgGradientStart, bgGradientMiddle, bgGradientEnd]} style={{ flex: 1 }}>
      }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Top Bar with Add Person */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 16,
        }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View
            style={{
              height: 96,
              width: 96,
              borderRadius: 48,
              backgroundColor: avatarBgColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>{avatarText}</Text>
          </View>
          <Text style={{ marginTop: 12, fontSize: 20, fontWeight: '600', color: textColorPrimary }}>
            {name}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: textColorSecondary }}>
            {type === 'video' ? 'Video calling...' : 'Audio calling...'}
          </Text>
        </View>
        <TouchableOpacity style={{ position: 'absolute', right: 24, top: 16 }}>
          <Ionicons name="person-add" size={28} color={textColorPrimary} />
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: textColorPrimary }}>
          {formatTime(seconds)}
        </Text>
      </View>

      {/* Call Controls */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}>
        {/* Flip Camera */}
        <TouchableOpacity style={{ borderRadius: 50, backgroundColor: buttonBgColor, padding: 16 }}>
          <MaterialIcons name="flip-camera-ios" size={28} color="white" />
        </TouchableOpacity>

        {/* Mic Toggle */}
        <TouchableOpacity
          onPress={() => setMicOn(!micOn)}
          style={{ borderRadius: 50, backgroundColor: buttonBgColor, padding: 16 }}>
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={28} color={micOn ? 'white' : 'red'} />
        </TouchableOpacity>

        {/* Video Toggle (only for video calls) */}
        {type === 'video' && (
          <TouchableOpacity
            onPress={() => setVideoOn(!videoOn)}
            style={{ borderRadius: 50, backgroundColor: buttonBgColor, padding: 16 }}>
            <Ionicons
              name={videoOn ? 'videocam' : 'videocam-off'}
              size={28}
              color={videoOn ? 'white' : 'gray'}
            />
          </TouchableOpacity>
        )}

        {/* Speaker Toggle */}
        <TouchableOpacity
          onPress={() => setSpeakerOn(!speakerOn)}
          style={{ borderRadius: 50, backgroundColor: buttonBgColor, padding: 16 }}>
          <Ionicons
            name={speakerOn ? 'volume-high' : 'volume-mute'}
            size={28}
            color={speakerOn ? 'white' : 'gray'}
          />
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ borderRadius: 50, backgroundColor: '#dc2626', padding: 20 }}>
          <FontAwesome name="phone" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CallScreen;
