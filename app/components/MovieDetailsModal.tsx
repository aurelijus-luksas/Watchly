import React, { useEffect } from 'react';
import { BackHandler, Button, Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';
import { Movie } from '../types';

type Props = {
  visible: boolean;
  movie?: Movie | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
};

export default function MovieDetailsModal({ visible, movie, onClose, onDelete }: Props) {
  if (!movie) return null;

  useEffect(() => {
    if (!visible) return;
    const onBack = () => {
      onClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        {movie.poster ? <Image source={{ uri: movie.poster }} style={styles.poster} /> : null}
        <Text style={styles.title}>{movie.title}</Text>
        {movie.year ? <Text style={styles.meta}>Year: {movie.year}</Text> : null}
        {movie.imdbRating ? <Text style={styles.meta}>IMDB: {movie.imdbRating}</Text> : null}
        {movie.rating !== undefined ? <Text style={styles.meta}>Your rating: {movie.rating}</Text> : null}
        {movie.section ? <Text style={styles.section}>Section: {movie.section}</Text> : null}
        {movie.plot ? <Text style={styles.plot}>{movie.plot}</Text> : null}
        {movie.comment ? <Text style={styles.commentLabel}>Your note:</Text> : null}
        {movie.comment ? <Text style={styles.comment}>{movie.comment}</Text> : null}

        <View style={styles.actions}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Button title="Close" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button color="#b33" title="Delete" onPress={() => {
              // if onDelete provided, call it then close
              // @ts-ignore - onDelete is optional in props destructuring
              try { (movie && (onDelete as any))?.(movie.id); } catch (e) {}
              onClose();
            }} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  poster: { width: '100%', height: 420, borderRadius: 8, marginBottom: 12, backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  meta: { color: colors.muted, marginBottom: 4 },
  section: { color: colors.primary, marginBottom: 8 },
  plot: { color: colors.text, marginTop: 8, lineHeight: 20 },
  commentLabel: { color: colors.muted, marginTop: 12 },
  comment: { color: colors.text, marginTop: 2 },
  actions: { flexDirection: 'row', marginTop: 16 },
});
