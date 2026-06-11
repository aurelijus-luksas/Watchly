import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, FlatList, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from './_constants/colors';
import { Movie } from './_types';
import AddMovieModal from './components/AddMovieModal';
import MovieCard from './components/MovieCard';
import MovieDetailsModal from './components/MovieDetailsModal';
import SearchScreen from './components/SearchScreen';

type MediaFilter = 'all' | 'movies' | 'series' | 'animation';
const MEDIA_FILTERS: MediaFilter[] = ['all', 'movies', 'series', 'animation'];

export default function Index() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLoadedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'watched' | 'toWatch'>('watched');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
  const [toWatchMovies, setToWatchMovies] = useState<Movie[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showImportText, setShowImportText] = useState(false);
  const [importText, setImportText] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    (async () => {
      if (AsyncStorage) {
        try {
          const watched = await AsyncStorage.getItem('@movieRate:watched');
          const toWatch = await AsyncStorage.getItem('@movieRate:toWatch');
          if (watched) {
            setWatchedMovies(JSON.parse(watched));
          }
          if (toWatch) {
            setToWatchMovies(JSON.parse(toWatch));
          }
          isLoadedRef.current = true;
        } catch {
          console.error('✗ Error loading movies');
          isLoadedRef.current = true;
        }
      } else {
        console.warn('⚠ AsyncStorage not available - no persistence');
        isLoadedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (AsyncStorage && isLoadedRef.current) {
        try {
          const jsonStr = JSON.stringify(watchedMovies);
          await AsyncStorage.setItem('@movieRate:watched', jsonStr);
        } catch {
          console.error('✗ Error saving watched movies');
        }
      }
    })();
  }, [watchedMovies]);

  useEffect(() => {
    (async () => {
      if (AsyncStorage && isLoadedRef.current) {
        try {
          const jsonStr = JSON.stringify(toWatchMovies);
          await AsyncStorage.setItem('@movieRate:toWatch', jsonStr);
        } catch {
          console.error('✗ Error saving to-watch movies');
        }
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

  async function exportData() {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        watched: watchedMovies,
        toWatch: toWatchMovies,
      };
      const jsonString = JSON.stringify(payload, null, 2);
      
      try {
        await Share.share({
          message: jsonString,
          title: 'Watchly Backup',
        });
      } catch {
        Alert.alert('Share error', 'Could not share backup. Try copying the text manually.');
      }
    } catch {
      Alert.alert('Export failed', 'Could not create backup.');
    }
  }

  async function importData() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = JSON.parse(content);
      const nextWatched = Array.isArray(parsed?.watched) ? parsed.watched : parsed?.watchedMovies;
      const nextToWatch = Array.isArray(parsed?.toWatch) ? parsed.toWatch : parsed?.toWatchMovies;

      if (!Array.isArray(nextWatched) || !Array.isArray(nextToWatch)) {
        Alert.alert('Import failed', 'File must contain watched and toWatch arrays.');
        return;
      }

      setWatchedMovies(nextWatched as Movie[]);
      setToWatchMovies(nextToWatch as Movie[]);
      Alert.alert('Import complete', 'Lists updated from backup.');
    } catch {
      Alert.alert('Import failed', 'Could not read or parse the backup file.');
    }
  }

  function importFromText() {
    try {
      if (!importText.trim()) {
        Alert.alert('Import failed', 'Paste JSON text first.');
        return;
      }
      const parsed = JSON.parse(importText);
      const nextWatched = Array.isArray(parsed?.watched) ? parsed.watched : parsed?.watchedMovies;
      const nextToWatch = Array.isArray(parsed?.toWatch) ? parsed.toWatch : parsed?.toWatchMovies;

      if (!Array.isArray(nextWatched) || !Array.isArray(nextToWatch)) {
        Alert.alert('Import failed', 'JSON must contain watched and toWatch arrays.');
        return;
      }

      setWatchedMovies(nextWatched as Movie[]);
      setToWatchMovies(nextToWatch as Movie[]);
      setImportText('');
      setShowImportText(false);
      Alert.alert('Import complete', 'Lists updated from backup.');
    } catch {
      Alert.alert('Import failed', 'Invalid JSON format.');
    }
  }

  const currentMovies = activeTab === 'watched' ? watchedMovies : toWatchMovies;
  
  const filteredMovies = currentMovies.filter((movie) => {
    const type = movie.mediaType?.toLowerCase() || '';
    const genre = movie.genre?.toLowerCase() || '';
    const isAnimation = genre.includes('animation') || genre.includes('anime');

    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'animation') return isAnimation;
    if (mediaFilter === 'movies') return type === 'movie' && !isAnimation;
    if (mediaFilter === 'series') return type === 'series' && !isAnimation;
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
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(true)}>
            <Text style={{ color: colors.primary, fontWeight: '700', marginRight: 12 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAdd(true)}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.menuPager}
        style={styles.menuStrip}
      >
        <View style={[styles.menuPage, { width }]}>
          <View style={styles.filterContainer}>
            {MEDIA_FILTERS.map((filter) => (
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
          <Text style={styles.menuHint}>Filters • swipe →</Text>
        </View>

        <View style={[styles.menuPage, { width }]}>
          <View style={styles.backupRow}>
            <TouchableOpacity style={styles.backupButton} onPress={exportData}>
              <Text style={styles.backupButtonText}>Export JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backupButton} onPress={importData}>
              <Text style={styles.backupButtonText}>Import File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backupButton} onPress={() => setShowImportText(true)}>
              <Text style={styles.backupButtonText}>Import Text</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.menuHint}>Backup/Restore</Text>
        </View>
      </ScrollView>

      <Modal visible={showImportText} transparent animationType="fade" onRequestClose={() => setShowImportText(false)}>
        <View style={styles.importOverlay}>
          <View style={styles.importModal}>
            <Text style={styles.importTitle}>Paste JSON Backup</Text>
            <TextInput
              style={styles.importInput}
              placeholder="Paste your backup JSON here..."
              placeholderTextColor={colors.muted}
              value={importText}
              onChangeText={setImportText}
              multiline
            />
            <View style={styles.importButtons}>
              <Button title="Cancel" onPress={() => { setShowImportText(false); setImportText(''); }} />
              <Button title="Import" onPress={importFromText} />
            </View>
          </View>
        </View>
      </Modal>

      {filteredMovies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.muted }}>
            {currentMovies.length === 0
              ? `No movies yet. Add your first ${activeTab === 'watched' ? 'watched' : 'to watch'} movie.`
              : `No ${mediaFilter === 'all' ? '' : mediaFilter + ' '}items found.`}
          </Text>
          <View style={{ height: 12 }} />
          <Button title="Add movie" onPress={() => setShowAdd(true)} />
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
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
        watchedMovies={watchedMovies}
        toWatchMovies={toWatchMovies}
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

      <Modal
        visible={showSearch}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.searchTitle}>Search & Filter</Text>
            <View style={{ width: 24 }} />
          </View>
          <SearchScreen
            allMovies={[...watchedMovies, ...toWatchMovies]}
            onSelectMovie={(movie: Movie) => {
              setSelected(movie);
              setShowDetails(true);
              setShowSearch(false);
            }}
          />
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 0,
    gap: 8,
  },
  menuPager: {
    flexGrow: 0,
  },
  menuStrip: {
    flexGrow: 0,
  },
  menuPage: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  menuHint: {
    paddingHorizontal: 12,
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  backupRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 6,
  },
  backupButton: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.muted + '30',
    alignItems: 'center',
  },
  backupButtonText: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 12,
  },
  importOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  importModal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  importTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  importInput: {
    backgroundColor: colors.background,
    borderColor: colors.muted + '30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    height: 150,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  importButtons: {
    flexDirection: 'row',
    gap: 12,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted + '20',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.muted,
    fontWeight: '600',
  },
});
