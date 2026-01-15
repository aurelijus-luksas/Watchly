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

type MediaFilter = 'all' | 'movies' | 'series' | 'anime';

export default function Index() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'watched' | 'toWatch'>('watched');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
  const [toWatchMovies, setToWatchMovies] = useState<Movie[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    (async () => {
      if (AsyncStorage) {
        try {
          const watched = await AsyncStorage.getItem('@movieRate:watched');
          const toWatch = await AsyncStorage.getItem('@movieRate:toWatch');
          if (watched) setWatchedMovies(JSON.parse(watched));
          if (toWatch) setToWatchMovies(JSON.parse(toWatch));
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
          await AsyncStorage.setItem('@movieRate:watched', JSON.stringify(watchedMovies));
        } catch (e) {}
      }
    })();
  }, [watchedMovies]);

  useEffect(() => {
    (async () => {
      if (AsyncStorage) {
        try {
          await AsyncStorage.setItem('@movieRate:toWatch', JSON.stringify(toWatchMovies));
        } catch (e) {}
      }
    })();
  }, [toWatchMovies]);

  function handleAdd(movie: Movie) {
    if (activeTab === 'watched') {
      setWatchedMovies((s) => [movie, ...s]);
    } else {
      setToWatchMovies((s) => [movie, ...s]);
    }
  }

  const currentMovies = activeTab === 'watched' ? watchedMovies : toWatchMovies;
  
  const filteredMovies = currentMovies.filter((movie) => {
    if (mediaFilter === 'all') return true;
    const type = movie.mediaType?.toLowerCase() || '';
    // Match against different filter types
    if (mediaFilter === 'movies') return type === 'movie';
    if (mediaFilter === 'series') return type === 'series';
    if (mediaFilter === 'anime') return type.includes('anime');
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'watched' && styles.activeTab]}
            onPress={() => setActiveTab('watched')}
          >
            <Text style={[styles.tabText, activeTab === 'watched' && styles.activeTabText]}>
              Watched
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'toWatch' && styles.activeTab]}
            onPress={() => setActiveTab('toWatch')}
          >
            <Text style={[styles.tabText, activeTab === 'toWatch' && styles.activeTabText]}>
              To Watch
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'movies', 'series', 'anime'] as MediaFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, mediaFilter === filter && styles.activeFilterButton]}
            onPress={() => setMediaFilter(filter)}
          >
            <Text style={[styles.filterText, mediaFilter === filter && styles.activeFilterText]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredMovies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.muted }}>
            {currentMovies.length === 0
              ? `No movies yet. Add your first ${activeTab === 'watched' ? 'watched' : 'to watch'} movie.`
              : `No ${mediaFilter === 'all' ? '' : mediaFilter} movies found.`}
          </Text>
          <View style={{ height: 12 }} />
          <Button title="Add movie" onPress={() => setShowAdd(true)} />
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
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
        isToWatch={activeTab === 'toWatch'}
      />

      <MovieDetailsModal
        visible={showDetails}
        movie={selected}
        onClose={() => setShowDetails(false)}
        onDelete={(id) => {
          if (activeTab === 'watched') {
            setWatchedMovies((s) => s.filter((m) => m.id !== id));
          } else {
            setToWatchMovies((s) => s.filter((m) => m.id !== id));
          }
          setShowDetails(false);
        }}
        onUpdate={(updated) => {
          if (activeTab === 'watched') {
            setWatchedMovies((s) => s.map((m) => (m.id === updated.id ? updated : m)));
          } else {
            setToWatchMovies((s) => s.map((m) => (m.id === updated.id ? updated : m)));
          }
        }}
        isToWatch={activeTab === 'toWatch'}
        onMarkAsWatched={(movie) => {
          setToWatchMovies((s) => s.filter((m) => m.id !== movie.id));
          setWatchedMovies((s) => [movie, ...s]);
          setShowDetails(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  tabContainer: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.muted + '20',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  activeTabText: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.muted + '20',
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  activeFilterText: {
    color: '#fff',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
