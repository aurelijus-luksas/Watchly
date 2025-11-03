import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from './_constants/colors';
import { Movie } from './_types';
import AddMovieModal from './components/AddMovieModal';
import MovieCard from './components/MovieCard';
import MovieDetailsModal from './components/MovieDetailsModal';

// Try to use AsyncStorage if available. If not, fallback to in-memory.
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // noop - fallback
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    (async () => {
      if (AsyncStorage) {
        try {
          const raw = await AsyncStorage.getItem('@movieRate:movies');
          if (raw) setMovies(JSON.parse(raw));
        } catch (e) {
          // ignore
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (AsyncStorage) {
        try {
          await AsyncStorage.setItem('@movieRate:movies', JSON.stringify(movies));
        } catch (e) {}
      }
    })();
  }, [movies]);

  function handleAdd(movie: Movie) {
    setMovies((s) => [movie, ...s]);
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>movieRate</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {movies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.muted }}>No movies yet. Add your first watched movie.</Text>
          <View style={{ height: 12 }} />
          <Button title="Add movie" onPress={() => setShowAdd(true)} />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={(m) => {
                setSelected(m);
                setShowDetails(true);
              }}
            />
          )}
        />
      )}

      <AddMovieModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(movie) => {
          handleAdd(movie);
          setShowAdd(false);
        }}
      />

      <MovieDetailsModal
        visible={showDetails}
        movie={selected}
        onClose={() => setShowDetails(false)}
        onDelete={(id) => {
          setMovies((s) => s.filter((m) => m.id !== id));
          setShowDetails(false);
        }}
        onUpdate={(updated) => {
          setMovies((s) => s.map((m) => (m.id === updated.id ? updated : m)));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
