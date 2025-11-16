import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { User } from '../../../core/auth/user.model';
import { RouterLink } from '@angular/router';
import { EMPTY, merge, shareReplay, switchMap, take, tap } from 'rxjs';
import { Comment } from '../models/comment.model';
import { AsyncPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { Errors } from 'src/app/core/models/errors.model';
import { ListErrorsComponent } from 'src/app/shared/components/list-errors.component';
import { CommentsService } from '../services/comments.service';
import { ArticleCommentComponent } from './article-comment.component';

@Component({
  selector: 'app-article-comments',
  template: `
    @if (currentUser) {
      <div>
        <app-list-errors [errors]="commentFormErrors$ | async" />
        <form class="card comment-form" (ngSubmit)="addComment()">
          <fieldset [disabled]="isSubmitting$ | async">
            <div class="card-block">
              <textarea
                class="form-control"
                placeholder="Write a comment..."
                rows="3"
                [formControl]="commentControl"
              ></textarea>
            </div>
            <div class="card-footer">
              <img [src]="currentUser.image || ''" class="comment-author-img" />

              <button class="btn btn-sm btn-primary" type="submit">Post Comment</button>
            </div>
          </fieldset>
        </form>
      </div>
    } @else {
      <div>
        <a [routerLink]="['/login']">Sign in</a> or <a [routerLink]="['/register']">sign up</a> to add comments on this
        article.
      </div>
    }
    @for (comment of comments$ | async; track comment) {
      <app-article-comment [comment]="comment" (delete)="deleteComment(comment)" />
    }
  `,
  imports: [RouterLink, ListErrorsComponent, ArticleCommentComponent, AsyncPipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCommentsComponent {
  private readonly commentsService = inject(CommentsService);

  @Input() currentUser!: User | null;
  @Input() set articleSlug(value: string) {
    this.articleSlugSubject.next(value);
  }

  private readonly articleSlugSubject = new BehaviorSubject<string>('');

  private readonly commentsSubject = new Subject<Comment[]>();
  private readonly commentsData$: Observable<Comment[]> = this.articleSlugSubject.asObservable().pipe(
    switchMap(slug => (slug ? this.commentsService.getAll(slug) : EMPTY)),
    shareReplay(1),
  );
  protected readonly comments$ = merge(this.commentsData$, this.commentsSubject.asObservable());

  protected readonly commentControl = new FormControl<string>('', { nonNullable: true });

  private readonly commentFormErrorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly commentFormErrors$ = this.commentFormErrorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  addComment() {
    this.isSubmittingSubject.next(true);
    this.commentFormErrorsSubject.next(null);

    this.comments$
      .pipe(
        switchMap(comments =>
          this.commentsService.add(this.articleSlugSubject.getValue(), this.commentControl.value).pipe(
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
    this.comments$
      .pipe(
        switchMap(comments =>
          this.commentsService.delete(this.articleSlugSubject.getValue(), comment.id).pipe(
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
