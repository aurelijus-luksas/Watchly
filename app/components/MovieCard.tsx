import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';
import { Movie } from '../types';

type Props = {
  movie: Movie;
  onPress?: (movie: Movie) => void;
};

export default function MovieCard({ movie, onPress }: Props) {
  return (
    <TouchableOpacity onPress={() => onPress?.(movie)} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{movie.title}</Text>
        <Text style={styles.rating}>{movie.rating ?? '—'}</Text>
      </View>
      <Text style={styles.section}>{movie.section ?? 'Unsorted'}</Text>
      {movie.comment ? <Text style={styles.comment}>{movie.comment}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    shadowColor: colors.elevationShadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: '600' },
  rating: { fontSize: 14, color: colors.text },
  section: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  comment: { fontSize: 13, color: colors.muted },
});
