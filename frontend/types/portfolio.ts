/** Category of a portfolio entry. */
export type PortfolioCategory = 'project' | 'deliverable' | 'example';

/** Visibility of a portfolio entry. */
export type PortfolioVisibility = 'public' | 'private';

/** A single portfolio entry owned by a user. */
export interface PortfolioEntry {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: PortfolioCategory;
  visibility: PortfolioVisibility;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Public portfolio returned by the public page endpoint. */
export interface PublicPortfolio {
  userId: string;
  displayName: string;
  entries: PortfolioEntry[];
  profile?: {
    skillCategories: any[];
    topInterests: string[];
    topStrengths: string[];
  };
}
