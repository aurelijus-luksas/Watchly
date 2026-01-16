import React, { useEffect, useRef, useState } from 'react';
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
};

const sections: Section[] = ['recommend', 'good', 'neutral', 'bad'];

export default function AddMovieModal({ visible, onClose, onAdd, isToWatch }: Props) {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState<string>('');
  const [section, setSection] = useState<Section>('recommend');
  const [sectionPickerVisible, setSectionPickerVisible] = useState(false);
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

  // search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ Title: string; Year: string; imdbID: string; Poster: string }>>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  function dedupeByImdbId(items: Array<{ imdbID: string }>) {
    const seen = new Set<string>();
    const unique: typeof items = [];
    for (const item of items) {
      if (seen.has(item.imdbID)) continue;
      seen.add(item.imdbID);
      unique.push(item);
    }
    return unique;
  }

  function handleAdd() {
    if (!title.trim()) return;
    // validate rating if provided (not required for toWatch)
    if (!isToWatch && rating.trim()) {
      const n = Number(rating);
      if (Number.isNaN(n) || n < 1 || n > 10) {
        setRatingError('Rating must be a number between 1 and 10');
        return;
      }
    }
    setRatingError(undefined);

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
      section,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onAdd(movie);
    // reset
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

  async function searchOmdb(q: string) {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    // don't call OMDb when key is missing
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
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function fetchMovieDetailsById(id: string) {
    if (!OMDB_API_KEY) return null;
    try {
      const res = await fetch(`${OMDB_BASE}?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(id)}&plot=short`);
      const json = await res.json();
      if (json.Response === 'True') return json;
    } catch (e) {
      // ignore
    }
    return null;
  }

  async function pickResult(item: { Title: string; Year: string; imdbID: string; Poster: string }) {
    // fetch full details
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
    // clear search UI
    setResults([]);
    setQuery('');
  }

  // debounce search input to avoid spamming the API
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // small debounce
    // @ts-ignore - window.setTimeout number vs NodeJS.Timer cross-env
    debounceRef.current = setTimeout(() => {
      searchOmdb(query);
    }, 350) as unknown as number;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current as unknown as number);
    };
  }, [query]);

  // handle Android hardware back button while modal visible
  useEffect(() => {
    if (!visible) return;
    const onBack = () => {
      onClose();
      return true; // handled
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [visible]);

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
              {results.map((item) => (
                <TouchableOpacity
                  key={item.imdbID}
                  style={styles.resultRow}
                  onPress={() => {
                    pickResult(item);
                  }}
                >
                  {item.Poster && item.Poster !== 'N/A' ? (
                    <Image source={{ uri: item.Poster }} style={styles.resultPoster} />
                  ) : (
                    <View style={[styles.resultPoster, { backgroundColor: '#ddd' }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.text }}>{item.Title}</Text>
                    <Text style={{ color: colors.muted }}>{item.Year}</Text>
                  </View>
                </TouchableOpacity>
              ))}
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
  resultPoster: { width: 48, height: 72, borderRadius: 6, marginRight: 12 },
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
