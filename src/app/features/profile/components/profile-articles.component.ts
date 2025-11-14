import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleListComponent } from '../../article/components/article-list.component';
import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';
import { ArticleListConfig } from '../../article/models/article-list-config.model';
import { ListConfigType } from '../../article/statics/list-config-type.enum';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';

interface RouteData {
  favorites?: boolean;
}

@Component({
  selector: 'app-profile-articles',
  template: `@if (articlesConfig$ | async; as articlesConfig) {
    <app-article-list [limit]="10" [config]="articlesConfig" />
  }`,
  imports: [ArticleListComponent, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileArticlesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly profileService = inject(ProfileService);

  private readonly profile$: Observable<Profile> = this.route.params.pipe(
    switchMap(params => this.profileService.get(params['username'])),
  );
  private readonly isFavorites$ = this.route.data.pipe(map((data: RouteData) => data.favorites === true));

  protected readonly articlesConfig$: Observable<ArticleListConfig> = combineLatest([
    this.profile$,
    this.isFavorites$,
  ]).pipe(
    map(([profile, isFavorites]: [Profile, boolean]) => ({
      type: ListConfigType.ALL,
      filters: isFavorites ? { favorited: profile.username } : { author: profile.username },
    })),
  );
}
