import { Profile } from '../../profile/models/profile.model';

export interface Article {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly body: string;
  readonly tagList: string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  readonly author: Profile;
}
