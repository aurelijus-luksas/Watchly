import React, { useEffect, useState } from 'react';
import { Button, FlatList, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AddMovieModal from './components/AddMovieModal';
import MovieCard from './components/MovieCard';
import MovieDetailsModal from './components/MovieDetailsModal';
import colors from './constants/colors';
import { Movie } from './types';

// Try to use AsyncStorage if available. If not, fallback to in-memory.
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // noop - fallback
}

export default function Index() {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Movies</Text>
        <Button title="Add" onPress={() => setShowAdd(true)} />
      </View>

      {movies.length === 0 ? (
        <View style={styles.empty}>
          <Text>No movies yet. Tap Add to start.</Text>
        </View>
        ) : (
        <FlatList
          data={movies}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12 }}
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

      <AddMovieModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      <MovieDetailsModal
        visible={showDetails}
        movie={selected}
        onClose={() => setShowDetails(false)}
        onDelete={(id) => {
          setMovies((s) => s.filter((m) => m.id !== id));
          setShowDetails(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
