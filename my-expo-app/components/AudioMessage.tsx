import { FontAwesome } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AudioMessageProps = {
  uri: string;
};

const AudioMessage = ({ uri }: AudioMessageProps) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const successStatus = status as AVPlaybackStatusSuccess;

    setPositionMillis(successStatus.positionMillis);
    setDurationMillis(successStatus.durationMillis ?? 0);

    if (successStatus.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(0);
    }
  };

  const onPlayPause = async () => {
    if (!sound) {
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
      setDurationMillis((status as AVPlaybackStatusSuccess).durationMillis ?? 0);
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const formatMillis = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity onPress={onPlayPause} style={styles.playPauseButton}>
        <FontAwesome name={isPlaying ? 'pause' : 'play'} size={24} color="white" />
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: durationMillis ? `${(positionMillis / durationMillis) * 100}%` : '0%' },
          ]}
        />
      </View>
      <Text style={styles.durationText}>{formatMillis(positionMillis)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1877f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 240,
  },
  playPauseButton: {
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'white',
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
});

export default AudioMessage;
