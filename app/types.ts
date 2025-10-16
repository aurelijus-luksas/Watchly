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
  createdAt?: string;
};
