import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../_constants/colors';
import { Movie, Section } from '../_types';
import MovieCard from './MovieCard';

interface SearchScreenProps {
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

type SectionFilter = Section | 'all';

export default function SearchScreen({ allMovies, onSelectMovie }: SearchScreenProps) {
  const [searchText, setSearchText] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionFilter>('all');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<Set<string>>(new Set());

  // Get unique sections from movies
  const uniqueSections = useMemo(() => {
    const sections = new Set(allMovies.map((m) => m.section).filter(Boolean) as Section[]);
    return Array.from(sections).sort();
  }, [allMovies]);

  // Get unique genres from movies (excluding "Animation" which is handled as media type)
  const uniqueGenres = useMemo(() => {
    const genres = new Set<string>();
    allMovies.forEach((m) => {
      if (m.genre) {
        m.genre.split(',').forEach((g) => {
          const trimmed = g.trim();
          if (trimmed !== 'Animation') {
            genres.add(trimmed);
          }
        });
      }
    });
    return Array.from(genres).sort();
  }, [allMovies]);

  // Filter movies based on search criteria
  const filteredMovies = useMemo(() => {
    let results = [...allMovies];

    // Filter by name
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      results = results.filter((m) => m.title.toLowerCase().includes(searchLower));
    }

    // Filter by minimum rating
    if (minRating) {
      const min = parseFloat(minRating);
      if (!isNaN(min)) {
        results = results.filter((m) => (m.rating ?? 0) >= min);
      }
    }

    // Filter by maximum rating
    if (maxRating) {
      const max = parseFloat(maxRating);
      if (!isNaN(max)) {
        results = results.filter((m) => (m.rating ?? 0) <= max);
      }
    }

    // Filter by section
    if (selectedSection !== 'all') {
      results = results.filter((m) => m.section === selectedSection);
    }

    // Filter by genre (multiple selection)
    if (selectedGenres.size > 0) {
      results = results.filter((m) => {
        if (!m.genre) return false;
        return m.genre.split(',').some((g) => selectedGenres.has(g.trim()));
      });
    }

    // Filter by media type (multiple selection)
    if (selectedMediaTypes.size > 0) {
      results = results.filter((m) => {
        // Handle "Animation" as a genre filter
        if (selectedMediaTypes.has('Animation')) {
          const hasAnimation = m.genre?.split(',').some((g) => g.trim() === 'Animation');
          if (selectedMediaTypes.size === 1) {
            return hasAnimation;
          }
          // If Animation is selected with other types, check if it has Animation genre OR matches other types
          const otherTypes = Array.from(selectedMediaTypes).filter((t) => t !== 'Animation');
          const matchesOtherTypes = otherTypes.some((type) => m.mediaType?.toLowerCase() === type.toLowerCase());
          return hasAnimation || matchesOtherTypes;
        }
        // For non-Animation types, match mediaType
        const mediaType = m.mediaType?.toLowerCase();
        return Array.from(selectedMediaTypes).some((type) => mediaType === type.toLowerCase());
      });
    }

    return results;
  }, [allMovies, searchText, minRating, maxRating, selectedSection, selectedGenres, selectedMediaTypes]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Search & Filter</Text>

      {/* Search Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Movie Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by title..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Rating Range */}
      <View style={styles.section}>
        <Text style={styles.label}>Rating Range</Text>
        <View style={styles.ratingRow}>
          <View style={styles.ratingInput}>
            <Text style={styles.smallLabel}>Min</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.muted}
              value={minRating}
              onChangeText={setMinRating}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.ratingInput}>
            <Text style={styles.smallLabel}>Max</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={colors.muted}
              value={maxRating}
              onChangeText={setMaxRating}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      {/* Section Filter */}
      {uniqueSections.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Section</Text>
          <View style={styles.filterGrid}>
            <TouchableOpacity
              style={[styles.filterChip, selectedSection === 'all' && styles.activeFilterChip]}
              onPress={() => setSelectedSection('all')}
            >
              <Text style={[styles.chipText, selectedSection === 'all' && styles.activeChipText]}>All</Text>
            </TouchableOpacity>
            {uniqueSections.map((section) => (
              <TouchableOpacity
                key={section}
                style={[styles.filterChip, selectedSection === section && styles.activeFilterChip]}
                onPress={() => setSelectedSection(section)}
              >
                <Text style={[styles.chipText, selectedSection === section && styles.activeChipText]}>
                  {String(section).charAt(0).toUpperCase() + String(section).slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Genre Filter */}
      {uniqueGenres.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Genre</Text>
          <View style={styles.filterGrid}>
            {uniqueGenres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[styles.filterChip, selectedGenres.has(genre) && styles.activeFilterChip]}
                onPress={() => {
                  const newGenres = new Set(selectedGenres);
                  if (newGenres.has(genre)) {
                    newGenres.delete(genre);
                  } else {
                    newGenres.add(genre);
                  }
                  setSelectedGenres(newGenres);
                }}
              >
                <Text style={[styles.chipText, selectedGenres.has(genre) && styles.activeChipText]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Media Type Filter */}
      <View style={styles.section}>
        <Text style={styles.label}>Media Type</Text>
        <View style={styles.filterGrid}>
          {['Movie', 'Series', 'Animation'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, selectedMediaTypes.has(type) && styles.activeFilterChip]}
              onPress={() => {
                const newTypes = new Set(selectedMediaTypes);
                if (newTypes.has(type)) {
                  newTypes.delete(type);
                } else {
                  newTypes.add(type);
                }
                setSelectedMediaTypes(newTypes);
              }}
            >
              <Text style={[styles.chipText, selectedMediaTypes.has(type) && styles.activeChipText]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <Text style={styles.resultCount}>
        {filteredMovies.length} result{filteredMovies.length !== 1 ? 's' : ''}
      </Text>

      {/* Movie Results */}
      {filteredMovies.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No movies found matching your filters</Text>
        </View>
      ) : (
        filteredMovies.map((item) => (
          <View key={item.id} style={styles.movieCardContainer}>
            <MovieCard movie={item} onPress={onSelectMovie} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.muted + '30',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingInput: {
    flex: 1,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.muted + '30',
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  activeChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
    fontWeight: '500',
  },
  movieCardContainer: {
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
