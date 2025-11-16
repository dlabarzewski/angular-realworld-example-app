import { Profile } from '../../profile/models/profile.model';

export interface Comment {
  readonly id: string;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly author: Profile;
}
