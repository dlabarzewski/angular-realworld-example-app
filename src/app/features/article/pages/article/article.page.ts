import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Article } from '../../models/article.model';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ArticleMetaComponent } from '../../components/article-meta.component';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { ArticleCommentComponent } from '../../components/article-comment.component';
import { catchError, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, Subject, throwError } from 'rxjs';
import { Comment } from '../../models/comment.model';
import { Errors } from '../../../../core/models/errors.model';
import { Profile } from '../../../profile/models/profile.model';
import { FavoriteButtonComponent } from '../../components/favorite-button.component';
import { FollowButtonComponent } from '../../../profile/components/follow-button.component';
import { User } from 'src/app/core/auth/user.model';
import { ArticleSettingsComponent } from '../../components/article-settings.component';

@Component({
  selector: 'app-article-page',
  templateUrl: './article.page.html',
  imports: [
    ArticleMetaComponent,
    RouterLink,
    FollowButtonComponent,
    FavoriteButtonComponent,
    MarkdownPipe,
    AsyncPipe,
    ListErrorsComponent,
    FormsModule,
    ArticleCommentComponent,
    ReactiveFormsModule,
    ArticleSettingsComponent,
    NgTemplateOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ArticlePage {
  private readonly route = inject(ActivatedRoute);
  private readonly articleService = inject(ArticlesService);
  private readonly commentsService = inject(CommentsService);
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

  private readonly commentsSubject = new Subject<Comment[]>();
  private readonly commentsData$: Observable<Comment[]> = this.route.params.pipe(
    switchMap(params => this.commentsService.getAll(params['slug'])),
    shareReplay(1),
  );
  protected readonly comments$ = merge(this.commentsData$, this.commentsSubject.asObservable());

  protected readonly commentControl = new FormControl<string>('', { nonNullable: true });

  private readonly commentFormErrorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly commentFormErrors$ = this.commentFormErrorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  private readonly isDeletingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isDeleting$ = this.isDeletingSubject.asObservable();

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

  deleteArticle(): void {
    this.isDeletingSubject.next(true);

    this.article$
      .pipe(
        switchMap(article => this.articleService.delete(article.slug)),
        take(1),
      )
      .subscribe(() => {
        void this.router.navigate(['/']);
      });
  }

  addComment() {
    this.isSubmittingSubject.next(true);
    this.commentFormErrorsSubject.next(null);

    combineLatest([this.article$, this.comments$])
      .pipe(
        switchMap(([article, comments]) =>
          this.commentsService.add(article.slug, this.commentControl.value).pipe(
            tap(comment => {
              const updatedComments = [comment, ...comments];
              this.commentsSubject.next(updatedComments);
            }),
          ),
        ),
        take(1),
      )
      .subscribe({
        next: () => {
          this.commentControl.reset('');
          this.isSubmittingSubject.next(false);
        },
        error: errors => {
          this.isSubmittingSubject.next(false);
          this.commentFormErrorsSubject.next(errors);
        },
      });
  }

  deleteComment(comment: Comment): void {
    combineLatest([this.article$, this.comments$])
      .pipe(
        switchMap(([article, comments]) =>
          this.commentsService.delete(comment.id, article.slug).pipe(
            tap(() => {
              const updatedComments = comments.filter(c => c.id !== comment.id);
              this.commentsSubject.next(updatedComments);
            }),
          ),
        ),
        take(1),
      )
      .subscribe();
  }
}
