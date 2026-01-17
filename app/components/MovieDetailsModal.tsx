import React, { useEffect, useState } from 'react';
import { BackHandler, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../_constants/colors';
import { OMDB_API_KEY, OMDB_BASE } from '../_constants/config';
import { Movie, Section } from '../_types';

type Props = {
  visible: boolean;
  movie?: Movie | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (movie: Movie) => void;
  isToWatch?: boolean;
  onMarkAsWatched?: (movie: Movie, rating: number) => void;
};

const sections: Section[] = ['recommend', 'good', 'neutral', 'bad'];

export default function MovieDetailsModal({ visible, movie, onClose, onDelete, onUpdate, isToWatch, onMarkAsWatched }: Props) {
  // Hooks must be called unconditionally. Initialize state using optional chaining
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimeoutRef = React.useRef<number | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [localRating, setLocalRating] = useState<string>(movie && movie.rating !== undefined ? String(movie.rating) : '');
  const [localComment, setLocalComment] = useState<string>(movie?.comment ?? '');
  const [localSection, setLocalSection] = useState<Section>(movie?.section || 'recommend');

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
    setLocalSection(movie?.section || 'recommend');
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

  function formatDate(dateString?: string) {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  }

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
      section: localSection,
      comment: localComment.trim() || undefined,
      createdAt: m.createdAt,
      watchedAt: m.watchedAt,
    };
    try { onUpdate?.(updated); } catch (e) {}
    onClose();
  }

  function handleMarkAsWatched() {
    if (!localRating.trim()) {
      alert('Please enter a rating (1-10)');
      return;
    }
    const rating = Number(localRating);
    if (Number.isNaN(rating) || rating < 1 || rating > 10) {
      alert('Rating must be a number between 1 and 10');
      return;
    }
    const m = movie!;
    const watchedTimestamp = new Date().toISOString();
    const watchedMovie: Movie = {
      id: m.id,
      title: m.title,
      rating,
      poster: m.poster,
      imdbID: m.imdbID,
      year: m.year,
      plot: m.plot,
      imdbRating: m.imdbRating,
      genre: m.genre,
      mediaType: m.mediaType,
      section: localSection,
      comment: localComment.trim() || undefined,
      createdAt: m.createdAt,
      watchedAt: watchedTimestamp,
    };
    try { onMarkAsWatched?.(watchedMovie, rating); } catch (e) {}
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
        {movie.watchedAt ? <Text style={styles.meta}>Watched on: {formatDate(movie.watchedAt)}</Text> : null}

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

        {isToWatch && (
          <>
            <Text style={[styles.commentLabel, { marginTop: 12 }]}>Section</Text>
            <View style={styles.sectionButtonsRow}>
              {sections.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sectionButton, localSection === s && styles.sectionButtonActive]}
                  onPress={() => setLocalSection(s)}
                >
                  <Text style={[styles.sectionButtonText, localSection === s && styles.sectionButtonTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

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
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          {isToWatch ? (
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleMarkAsWatched}>
              <Text style={styles.buttonTextPrimary}>Mark as Watched</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleSave}>
              <Text style={styles.buttonTextPrimary}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delete placed at the very bottom so user must scroll down to see it */}
        <View style={{ height: 300 }} />
        <View style={{ alignItems: 'center', marginBottom: 60 }}>
          <TouchableOpacity 
            style={[styles.deleteButton, deleteArmed && styles.deleteButtonArmed]}
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
          >
            <Text style={styles.deleteButtonText}>{deleteArmed ? 'Confirm delete' : 'Delete'}</Text>
          </TouchableOpacity>
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
  actions: { flexDirection: 'row', marginTop: 16, gap: 8 },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: '#cc3333',
  },
  deleteButtonArmed: {
    backgroundColor: '#cc3333',
  },
  deleteButtonText: {
    color: '#cc3333',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  sectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.muted + '30',
  },
  sectionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
