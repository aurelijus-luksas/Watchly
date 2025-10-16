export type Section = 'recommend' | 'good' | 'neutral' | 'bad' | string;

export type Movie = {
  id: string;
  title: string;
  rating?: number; // 1-10
  section?: Section;
  comment?: string;
  createdAt?: string;
};
