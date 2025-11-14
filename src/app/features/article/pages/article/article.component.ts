import { Component, DestroyRef, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Article } from '../../models/article.model';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ArticleMetaComponent } from '../../components/article-meta.component';
import { AsyncPipe, NgClass } from '@angular/common';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { ArticleCommentComponent } from '../../components/article-comment.component';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { Comment } from '../../models/comment.model';
import { IfAuthenticatedDirective } from '../../../../core/auth/if-authenticated.directive';
import { Errors } from '../../../../core/models/errors.model';
import { Profile } from '../../../profile/models/profile.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FavoriteButtonComponent } from '../../components/favorite-button.component';
import { FollowButtonComponent } from '../../../profile/components/follow-button.component';
import { User } from 'src/app/core/auth/user.model';

@Component({
  selector: 'app-article-page',
  templateUrl: './article.component.html',
  imports: [
    ArticleMetaComponent,
    RouterLink,
    NgClass,
    FollowButtonComponent,
    FavoriteButtonComponent,
    MarkdownPipe,
    AsyncPipe,
    ListErrorsComponent,
    FormsModule,
    ArticleCommentComponent,
    ReactiveFormsModule,
    IfAuthenticatedDirective,
  ],
})
export default class ArticleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly articleService = inject(ArticlesService);
  private readonly commentsService = inject(CommentsService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshSubject = new BehaviorSubject<void>(undefined);
  protected readonly article$: Observable<Article> = combineLatest([this.route.params, this.refreshSubject]).pipe(
    switchMap(([params]) => this.articleService.get(params['slug'])),
    catchError(err => {
      void this.router.navigate(['/']);
      return throwError(() => err);
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly currentUser$: Observable<User | null> = this.userService.currentUser;

  protected readonly canModify$: Observable<boolean> = combineLatest([this.article$, this.currentUser$]).pipe(
    map(([article, currentUser]) => {
      return currentUser?.username === article.author.username;
    }),
  );

  private readonly commentsRefreshSubject = new BehaviorSubject<void>(undefined);
  protected readonly comments$: Observable<Comment[]> = combineLatest([
    this.route.params,
    this.commentsRefreshSubject,
  ]).pipe(
    switchMap(([params]) => this.commentsService.getAll(params['slug'])),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly commentControl = new FormControl<string>('', { nonNullable: true });

  private readonly commentFormErrorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly commentFormErrors$ = this.commentFormErrorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  private readonly isDeletingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isDeleting$ = this.isDeletingSubject.asObservable();

  onToggleFavorite(favorited: boolean): void {
    this.refreshSubject.next();
    // this.article.favorited = favorited;

    // if (favorited) {
    //   this.article.favoritesCount++;
    // } else {
    //   this.article.favoritesCount--;
    // }
  }

  toggleFollowing(profile: Profile): void {
    this.refreshSubject.next();
    // this.article.author.following = profile.following;
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

    this.article$
      .pipe(
        switchMap(article => this.commentsService.add(article.slug, this.commentControl.value)),
        take(1),
      )
      .subscribe({
        next: comment => {
          this.commentsRefreshSubject.next();
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
    this.article$
      .pipe(
        switchMap(article => this.commentsService.delete(comment.id, article.slug)),
        take(1),
      )
      .subscribe(() => {
        this.commentsRefreshSubject.next();
      });
  }
}
