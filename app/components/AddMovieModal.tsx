import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Button,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../constants/colors';
import { OMDB_API_KEY, OMDB_BASE } from '../constants/config';
import { Movie, Section } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (movie: Movie) => void;
};

const sections: Section[] = ['recommend', 'good', 'neutral', 'bad'];

export default function AddMovieModal({ visible, onClose, onAdd }: Props) {
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

  // search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ Title: string; Year: string; imdbID: string; Poster: string }>>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  function handleAdd() {
    if (!title.trim()) return;
    // validate rating if provided
    if (rating.trim()) {
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
      rating: rating ? Number(rating) : undefined,
      poster,
      imdbID,
      year,
      plot,
      imdbRating,
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
      const res = await fetch(`${OMDB_BASE}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(q)}&type=movie`);
      const json = await res.json();
      if (json.Response === 'True') {
        setResults(json.Search || []);
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
      <View style={styles.container}>
        <Text style={styles.heading}>Add watched movie</Text>

        <View style={styles.searchContainer}>
          <TextInput placeholder="Search movie (title)" value={query} onChangeText={setQuery} style={styles.input} placeholderTextColor={colors.text} />
          {searching ? <Text style={{ color: colors.muted, marginBottom: 8 }}>Searching...</Text> : null}

          {!OMDB_API_KEY ? (
            <Text style={styles.missingKey}>
              OMDb API key is not set. Add OMDB_API_KEY to your .env and restart the app to enable search.
            </Text>
          ) : null}

          {results.length > 0 && (
            // dropdown box positioned under the input
            <View style={styles.dropdown}>
              <FlatList
                data={results}
                keyExtractor={(i) => i.imdbID}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 240 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
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
                )}
              />
            </View>
          )}
        </View>

  <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={colors.text} />
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
        {/* optional display of fetched details */}
        {year ? <Text style={{ color: '#666', marginBottom: 6 }}>Year: {year}</Text> : null}
        {plot ? <Text style={{ color: '#666', marginBottom: 6 }}>{plot}</Text> : null}
        {/* simple picker fallback (custom dropdown for themed open state) */}
        <View style={styles.pickerRow}>
          <Text style={{ marginRight: 8, color: colors.text }}>Section:</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setSectionPickerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text }}>{section}</Text>
              <Text style={{ color: colors.muted }}>▾</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Modal
          visible={sectionPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSectionPickerVisible(false)}
        >
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSectionPickerVisible(false)}>
            <View style={styles.sectionDropdownContainer}>
              {sections.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.sectionItem}
                  onPress={() => {
                    setSection(s);
                    setSectionPickerVisible(false);
                  }}
                >
                  <Text style={[styles.sectionItemText, s === section ? { fontWeight: '700' } : {}]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
  <TextInput placeholder="Comment" value={comment} onChangeText={setComment} style={[styles.input, { height: 80 }]} multiline placeholderTextColor={colors.text} />

        <View style={styles.buttons}>
          <Button title="Cancel" onPress={onClose} />
          <Button title="Add" onPress={handleAdd} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.subtle },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text },
  input: { backgroundColor: colors.surface, padding: 10, borderRadius: 8, marginBottom: 10, color: colors.text },
  searchContainer: { position: 'relative', zIndex: 10 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  picker: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  resultRow: { flexDirection: 'row', padding: 8, alignItems: 'center', borderRadius: 8 },
  resultPoster: { width: 48, height: 72, borderRadius: 4, marginRight: 8 },
  missingKey: { color: '#b33', marginBottom: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sectionDropdownContainer: { backgroundColor: colors.surface, borderRadius: 8, overflow: 'hidden' },
  sectionItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomColor: '#111', borderBottomWidth: 1 },
  sectionItemText: { color: colors.text },
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 54,
    backgroundColor: colors.surface,
    borderRadius: 8,
    shadowColor: colors.elevationShadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    padding: 6,
  },
});
