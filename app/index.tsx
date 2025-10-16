import React, { useEffect, useState } from 'react';
import { Button, FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import AddMovieModal from './components/AddMovieModal';
import MovieCard from './components/MovieCard';
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
        <Text style={styles.title}>movieRate</Text>
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
          renderItem={({ item }) => <MovieCard movie={item} />}
        />
      )}

      <AddMovieModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
