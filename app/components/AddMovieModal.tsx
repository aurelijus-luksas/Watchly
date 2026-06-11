import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    BackHandler,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../_constants/colors';
import { OMDB_API_KEY, OMDB_BASE } from '../_constants/config';
import { Movie, Section } from '../_types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => void;
  isToWatch?: boolean;
  watchedMovies?: Movie[];
  toWatchMovies?: Movie[];
};

const sections: Section[] = ['recommend', 'good', 'neutral', 'bad'];

function dedupeByImdbId<T extends { imdbID: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    if (seen.has(item.imdbID)) continue;
    seen.add(item.imdbID);
    unique.push(item);
  }
  return unique;
}

export default function AddMovieModal({ visible, onClose, onAdd, isToWatch, watchedMovies = [], toWatchMovies = [] }: Props) {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState<string>('');
  const [section, setSection] = useState<Section>('recommend');
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState<string | undefined>(undefined);
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const [year, setYear] = useState<string | undefined>(undefined);
  const [plot, setPlot] = useState<string | undefined>(undefined);
  const [imdbID, setImdbID] = useState<string | undefined>(undefined);
  const [imdbRating, setImdbRating] = useState<string | undefined>(undefined);
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<string | undefined>(undefined);
  const [runtime, setRuntime] = useState<string | undefined>(undefined);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ Title: string; Year: string; imdbID: string; Poster: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function isMovieAlreadyAdded(imdbID: string): { exists: boolean; list?: 'watched' | 'toWatch' } {
    const inWatched = watchedMovies.find(m => m.imdbID === imdbID);
    if (inWatched) return { exists: true, list: 'watched' };

    const inToWatch = toWatchMovies.find(m => m.imdbID === imdbID);
    if (inToWatch) return { exists: true, list: 'toWatch' };

    return { exists: false };
  }

  function handleAdd() {
    if (!title.trim()) return;
    if (!isToWatch && rating.trim()) {
      const n = Number(rating);
      if (Number.isNaN(n) || n < 1 || n > 10) {
        setRatingError('Rating must be a number between 1 and 10');
        return;
      }
    }
    setRatingError(undefined);

    const timestamp = new Date().toISOString();

    const movie: Movie = {
      id: String(Date.now()),
      title: title.trim(),
      rating: isToWatch ? undefined : (rating ? Number(rating) : undefined),
      poster,
      imdbID,
      year,
      plot,
      imdbRating,
      runtime,
      genre,
      mediaType,
      section: isToWatch ? undefined : section,
      comment: comment.trim() || undefined,
      createdAt: timestamp,
      watchedAt: isToWatch ? undefined : timestamp,
    };
    onAdd(movie);
    setTitle('');
    setRating('');
    setSection('recommend');
    setComment('');
    setPoster(undefined);
    setYear(undefined);
    setPlot(undefined);
    setImdbID(undefined);
    setImdbRating(undefined);
  setGenre(undefined);
  setMediaType(undefined);
    setRuntime(undefined);
    setRatingError(undefined);
    onClose();
  }

  const searchOmdb = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    if (!OMDB_API_KEY) {
      setResults([]);
      setSearching(false);
      return;
    }
    try {
      const res = await fetch(`${OMDB_BASE}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.Response === 'True') {
        setResults(dedupeByImdbId(json.Search || []));
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const fetchMovieDetailsById = useCallback(async (id: string) => {
    if (!OMDB_API_KEY) return null;
    try {
      const res = await fetch(`${OMDB_BASE}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(id)}&plot=short`);
      const json = await res.json();
      if (json.Response === 'True') return json;
    } catch {
    }
    return null;
  }, []);

  async function pickResult(item: { Title: string; Year: string; imdbID: string; Poster: string }) {
    const details = await fetchMovieDetailsById(item.imdbID);
    setTitle(item.Title);
    setPoster(item.Poster !== 'N/A' ? item.Poster : details?.Poster !== 'N/A' ? details?.Poster : undefined);
    setYear(item.Year || details?.Year);
    setPlot(details?.Plot);
    setImdbID(item.imdbID);
    setImdbRating(details?.imdbRating);
    setGenre(details?.Genre);
    setMediaType(details?.Type);
    setRuntime(details?.Runtime);
    setResults([]);
    setQuery('');
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchOmdb(query);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchOmdb]);

  useEffect(() => {
    if (!visible) return;
    const onBack = () => {
      onClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>{isToWatch ? 'Add movie to watch' : 'Add watched movie'}</Text>

        <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.searchContainer}>
            <TextInput placeholder="Search title (movie, series, etc.)" value={query} onChangeText={setQuery} style={styles.input} placeholderTextColor={colors.text} />
            {searching ? <Text style={{ color: colors.muted, marginBottom: 8 }}>Searching...</Text> : null}

            {!OMDB_API_KEY ? (
              <Text style={styles.missingKey}>
                OMDb API key is not set. Add OMDB_API_KEY to your .env and restart the app to enable search.
              </Text>
            ) : null}
          </View>

          {results.length > 0 && (
            <View style={styles.resultsDropdown}>
              {results.map((item) => {
                const alreadyAdded = isMovieAlreadyAdded(item.imdbID);
                return (
                  <TouchableOpacity
                    key={item.imdbID}
                    style={[styles.resultRow, alreadyAdded.exists && styles.resultRowDisabled]}
                    onPress={() => {
                      if (alreadyAdded.exists) return;
                      pickResult(item);
                    }}
                    disabled={alreadyAdded.exists}
                  >
                    {item.Poster && item.Poster !== 'N/A' ? (
                      <Image source={{ uri: item.Poster }} style={[styles.resultPoster, alreadyAdded.exists && styles.resultPosterDisabled]} />
                    ) : (
                      <View style={[styles.resultPoster, { backgroundColor: '#ddd' }, alreadyAdded.exists && styles.resultPosterDisabled]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontWeight: '600', color: colors.text }, alreadyAdded.exists && styles.resultTextDisabled]}>{item.Title}</Text>
                      <Text style={[{ color: colors.muted }, alreadyAdded.exists && styles.resultTextDisabled]}>{item.Year}</Text>
                      {alreadyAdded.exists && (
                        <Text style={styles.alreadyAddedText}>Already in {alreadyAdded.list === 'watched' ? 'watched' : 'to watch'}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={colors.text} />
          {!isToWatch && (
            <>
              <TextInput
                placeholder="Rating (1-10)"
                value={rating}
                onChangeText={(t) => {
                  setRating(t);
                  if (ratingError) setRatingError(undefined);
                }}
                style={styles.input}
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
              {ratingError ? <Text style={{ color: '#b33', marginBottom: 6 }}>{ratingError}</Text> : null}
            </>
          )}
          {year ? <Text style={{ color: '#666', marginBottom: 6 }}>Year: {year}</Text> : null}
          {plot ? <Text style={{ color: '#666', marginBottom: 6 }}>{plot}</Text> : null}

          {!isToWatch && (
            <>
              <Text style={styles.sectionLabel}>Section:</Text>
              <View style={styles.sectionButtonsRow}>
                {sections.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sectionButton, section === s && styles.sectionButtonActive]}
                    onPress={() => setSection(s)}
                  >
                    <Text style={[styles.sectionButtonText, section === s && styles.sectionButtonTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TextInput placeholder="Comment" value={comment} onChangeText={setComment} style={[styles.input, { height: 80 }]} multiline placeholderTextColor={colors.text} />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleAdd}>
            <Text style={styles.buttonTextPrimary}>Add</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, color: colors.text },
  scrollContent: { flex: 1, paddingHorizontal: 16 },
  input: { backgroundColor: colors.surface, padding: 12, borderRadius: 10, marginBottom: 12, color: colors.text, fontSize: 16 },
  searchContainer: { marginBottom: 12 },
  sectionLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  sectionButtonsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
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
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  picker: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  buttonContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.muted + '20' },
  button: {
    flex: 1,
    paddingVertical: 14,
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
  resultRow: { flexDirection: 'row', padding: 12, alignItems: 'center', borderRadius: 10, marginBottom: 8 },
  resultRowDisabled: { opacity: 0.5, backgroundColor: colors.surface + '80' },
  resultPoster: { width: 48, height: 72, borderRadius: 6, marginRight: 12 },
  resultPosterDisabled: { opacity: 0.4 },
  resultTextDisabled: { opacity: 0.6 },
  alreadyAddedText: { color: colors.primary, fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  missingKey: { color: '#b33', marginBottom: 12, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sectionDropdownContainer: { backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
  sectionItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomColor: colors.muted + '20', borderBottomWidth: 1 },
  sectionItemText: { color: colors.text, fontSize: 16 },
  resultsDropdown: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.muted + '30',
    overflow: 'hidden',
  },
});
