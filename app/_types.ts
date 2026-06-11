export type Section = 'recommend' | 'good' | 'neutral' | 'bad' | string;

export type Movie = {
  id: string;
  title: string;
  rating?: number;
  poster?: string;
  section?: Section;
  comment?: string;
  imdbID?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  genre?: string;
  mediaType?: string;
  runtime?: string;
  createdAt?: string;
  watchedAt?: string;
};

export default function _TypesPlaceholder() {
  return null;
}
