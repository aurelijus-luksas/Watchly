import React, { useEffect, useState } from 'react';
import { BackHandler, Button, Image, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import colors from '../_constants/colors';
import { OMDB_API_KEY, OMDB_BASE } from '../_constants/config';
import { Movie } from '../_types';

type Props = {
  visible: boolean;
  movie?: Movie | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (movie: Movie) => void;
};

export default function MovieDetailsModal({ visible, movie, onClose, onDelete, onUpdate }: Props) {
  // Hooks must be called unconditionally. Initialize state using optional chaining
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimeoutRef = React.useRef<number | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [localRating, setLocalRating] = useState<string>(movie && movie.rating !== undefined ? String(movie.rating) : '');
  const [localComment, setLocalComment] = useState<string>(movie?.comment ?? '');

  useEffect(() => {
    if (!visible) return;
    const onBack = () => {
      onClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [visible]);

  // load remote OMDb details when modal opens
  useEffect(() => {
    setDetails(null);
    setLoadingDetails(false);
    setLocalRating(movie && movie.rating !== undefined ? String(movie.rating) : '');
    setLocalComment(movie?.comment ?? '');
    if (!visible) return;
    if (!movie?.imdbID) return;
    if (!OMDB_API_KEY) return;
    setLoadingDetails(true);
    (async () => {
      try {
        const res = await fetch(`${OMDB_BASE}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(movie.imdbID as string)}&plot=full`);
        const json = await res.json();
        if (json.Response === 'True') setDetails(json);
      } catch (e) {
        // ignore
      } finally {
        setLoadingDetails(false);
      }
    })();
  }, [visible, movie?.imdbID]);

  // If no movie provided, render nothing. This check must be after hooks.
  if (!movie) return null;

  function handleSave() {
    const m = movie!;
    const updated: Movie = {
      id: m.id,
      title: m.title,
      rating: localRating.trim() ? Number(localRating) : undefined,
      poster: m.poster,
      imdbID: m.imdbID,
      year: m.year,
      plot: m.plot,
      imdbRating: m.imdbRating,
      genre: m.genre,
      mediaType: m.mediaType,
      section: m.section,
      comment: localComment.trim() || undefined,
      createdAt: m.createdAt,
    };
    try { onUpdate?.(updated); } catch (e) {}
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
        {movie.poster ? <Image source={{ uri: movie.poster }} style={styles.posterSmall} /> : null}
        <Text style={styles.title}>{movie.title}</Text>
        <View style={styles.metaRow}>
          {movie.year ? <Text style={styles.meta}>Year: {movie.year}</Text> : null}
          {movie.mediaType ? <Text style={styles.meta}> • {movie.mediaType}</Text> : null}
          {movie.genre ? <Text style={styles.meta}> • {movie.genre}</Text> : null}
        </View>
        {movie.imdbRating ? <Text style={styles.meta}>IMDB: {movie.imdbRating}</Text> : null}

        {details?.Director ? <Text style={styles.meta}>Director: {details.Director}</Text> : null}
        {details?.Writer ? <Text style={styles.meta}>Writer: {details.Writer}</Text> : null}
        {details?.Runtime ? <Text style={styles.meta}>Runtime: {details.Runtime}</Text> : null}

        {movie.plot ? <Text style={styles.plot}>{movie.plot}</Text> : null}

        <Text style={styles.commentLabel}>Your rating</Text>
        <TextInput
          value={localRating}
          onChangeText={setLocalRating}
          keyboardType="numeric"
          placeholder="1-10"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={[styles.commentLabel, { marginTop: 12 }]}>Your note</Text>
        <TextInput
          value={localComment}
          onChangeText={setLocalComment}
          multiline
          placeholder="Write something..."
          placeholderTextColor={colors.muted}
          style={[styles.input, { height: 120 }]}
        />

        <View style={styles.actions}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Button title="Close" onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Save" onPress={handleSave} />
          </View>
        </View>

        {/* Delete placed at the bottom so user must scroll down to see it */}
        <View style={{ marginTop: 36 }} />
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 200 }}>
            <Button
              color={deleteArmed ? '#b33' : undefined}
              title={deleteArmed ? 'Confirm delete' : 'Delete'}
              onPress={() => {
                if (!deleteArmed) {
                  setDeleteArmed(true);
                  deleteTimeoutRef.current = setTimeout(() => setDeleteArmed(false), 4000) as unknown as number;
                  return;
                }
                // confirmed
                try { (onDelete as any)?.(movie.id); } catch (e) {}
                setDeleteArmed(false);
                if (deleteTimeoutRef.current) {
                  clearTimeout(deleteTimeoutRef.current as unknown as number);
                  deleteTimeoutRef.current = null;
                }
                onClose();
              }}
            />
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
  input: { backgroundColor: colors.surface, color: colors.text, padding: 10, borderRadius: 8, marginTop: 6 },
  posterSmall: { width: 140, height: 210, borderRadius: 8, marginBottom: 12, backgroundColor: colors.surface, alignSelf: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  actions: { flexDirection: 'row', marginTop: 16 },
});
