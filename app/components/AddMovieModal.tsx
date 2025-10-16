import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import colors from '../constants/colors';
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
  const [comment, setComment] = useState('');

  function handleAdd() {
    if (!title.trim()) return;
    const movie: Movie = {
      id: String(Date.now()),
      title: title.trim(),
      rating: rating ? Number(rating) : undefined,
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
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.heading}>Add watched movie</Text>
        <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
        <TextInput
          placeholder="Rating (1-10)"
          value={rating}
          onChangeText={setRating}
          style={styles.input}
          keyboardType="numeric"
        />
        {/* simple picker fallback */}
        <View style={styles.pickerRow}>
          <Text style={{ marginRight: 8 }}>Section:</Text>
          <Picker selectedValue={section} onValueChange={(v: string) => setSection(v as Section)} style={{ flex: 1 }}>
            {sections.map((s) => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        </View>
        <TextInput placeholder="Comment" value={comment} onChangeText={setComment} style={[styles.input, { height: 80 }]} multiline />

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
  input: { backgroundColor: colors.surface, padding: 10, borderRadius: 8, marginBottom: 10 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});
