import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../_constants/colors';
import { Movie } from '../_types';

type Props = {
  movie: Movie;
  onPress?: (movie: Movie) => void;
};

export default function MovieCard({ movie, onPress }: Props) {
  return (
    <TouchableOpacity onPress={() => onPress?.(movie)} style={styles.card}>
      <View style={styles.row}>
        {movie.poster ? (
          <Image source={{ uri: movie.poster }} style={styles.poster} />
        ) : (
          <View style={styles.posterPlaceholder} />
        )}

        <View style={styles.content}>
          <View>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {movie.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.sectionPill}>{movie.section ?? 'Unsorted'}</Text>
              {movie.mediaType ? <Text style={styles.typePill}>{movie.mediaType}</Text> : null}
              {movie.imdbRating ? <Text style={styles.imdb}>IMDb {movie.imdbRating}</Text> : null}
            </View>
            {movie.genre ? <Text style={styles.genre} numberOfLines={1}>{movie.genre}</Text> : null}
            {movie.comment ? <Text style={styles.comment} numberOfLines={2}>{movie.comment}</Text> : null}
          </View>

          <View style={styles.footerRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{movie.rating ?? '—'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: colors.elevationShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  content: { flex: 1, justifyContent: 'space-between' },
  poster: { width: 84, height: 126, borderRadius: 8, marginRight: 14, backgroundColor: '#111' },
  posterPlaceholder: { width: 84, height: 126, borderRadius: 8, marginRight: 14, backgroundColor: '#111' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  comment: { fontSize: 13, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  sectionPill: {
    backgroundColor: colors.subtle,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    color: colors.text,
    fontSize: 12,
    marginRight: 8,
  },
  typePill: {
    backgroundColor: '#162028',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    color: colors.text,
    fontSize: 12,
    marginRight: 8,
  },
  genre: { color: colors.muted, fontSize: 12, marginTop: 6 },
  imdb: { color: colors.muted, fontSize: 12 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'},
  ratingBadge: {
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: { color: colors.text, fontWeight: '700' },
});
