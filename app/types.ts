export type Section = 'recommend' | 'good' | 'neutral' | 'bad' | string;

export type Movie = {
  id: string;
  title: string;
  // user's personal rating (1-10)
  rating?: number;
  // optional poster URL
  poster?: string;
  section?: Section;
  // user's personal note/comment
  comment?: string;
  // optional fields pulled from OMDb
  imdbID?: string;
  year?: string;
  plot?: string;
  imdbRating?: string; // OMDb's aggregated rating string
  // OMDb 'Genre' field (comma-separated) and 'Type' (movie, series, episode, game)
  genre?: string;
  mediaType?: string;
  // OMDb runtime string like '142 min'
  runtime?: string;
  createdAt?: string;
  // date when the user marked it as watched
  watchedAt?: string;
};


// Default export to satisfy expo-router route requirement for files under `app/`.
export default function _TypesPlaceholder() {
  return null as any;
}
