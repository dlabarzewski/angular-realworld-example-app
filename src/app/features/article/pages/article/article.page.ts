import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Article } from '../../models/article.model';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ArticleMetaComponent } from '../../components/article-meta.component';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { combineLatest, merge, Observable, Subject, throwError } from 'rxjs';
import { Profile } from '../../../profile/models/profile.model';
import { FavoriteButtonComponent } from '../../components/favorite-button.component';
import { FollowButtonComponent } from '../../../profile/components/follow-button.component';
import { User } from 'src/app/core/auth/user.model';
import { ArticleSettingsComponent } from '../../components/article-settings.component';
import { ArticleCommentsComponent } from '../../components/article-comments.component';

@Component({
  selector: 'app-article-page',
  templateUrl: './article.page.html',
  imports: [
    ArticleMetaComponent,
    FollowButtonComponent,
    FavoriteButtonComponent,
    MarkdownPipe,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    ArticleSettingsComponent,
    NgTemplateOutlet,
    ArticleCommentsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArticlePage {
  private readonly route = inject(ActivatedRoute);
  private readonly articleService = inject(ArticlesService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly articleSubject = new Subject<Article>();
  private readonly articleData$: Observable<Article> = this.route.params.pipe(
    switchMap(params => this.articleService.get(params['slug'])),
    catchError(err => {
      void this.router.navigate(['/']);
      return throwError(() => err);
    }),
    shareReplay(1),
  );
  protected readonly article$: Observable<Article> = merge(this.articleData$, this.articleSubject.asObservable());

  protected readonly currentUser$: Observable<User | null> = this.userService.currentUser;

  protected readonly canModify$: Observable<boolean> = combineLatest([this.article$, this.currentUser$]).pipe(
    map(([article, currentUser]) => currentUser?.username === article.author.username),
  );

  onToggleFavorite(favorited: boolean): void {
    this.article$
      .pipe(
        tap(article => {
          this.articleSubject.next({
            ...article,
            favorited: favorited,
            favoritesCount: favorited ? article.favoritesCount + 1 : article.favoritesCount - 1,
          });
        }),
        take(1),
      )
      .subscribe();
  }

  toggleFollowing(profile: Profile): void {
    this.article$
      .pipe(
        tap(article => {
          this.articleSubject.next({
            ...article,
            author: {
              ...article.author,
              following: profile.following,
            },
          });
        }),
        take(1),
      )
      .subscribe();
  }
}
