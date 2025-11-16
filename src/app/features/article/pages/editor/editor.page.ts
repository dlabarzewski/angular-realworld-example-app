import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, EMPTY, map, Observable, switchMap, take, tap } from 'rxjs';
import { Errors } from '../../../../core/models/errors.model';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { AsyncPipe } from '@angular/common';
import { Article } from '../../models/article.model';
import { EditorFormComponent } from '../../components/editor-form.component';

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor.page.html',
  imports: [ListErrorsComponent, ReactiveFormsModule, AsyncPipe, EditorFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorPage {
  private readonly articleService = inject(ArticlesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly errorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly errors$ = this.errorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  protected readonly article$: Observable<Article | null> = this.route.params.pipe(
    switchMap(params => {
      if (params['slug']) {
        return combineLatest([this.articleService.get(params['slug']), this.userService.getCurrentUser()]);
      }
      return EMPTY;
    }),
    tap(([article, user]) => {
      if (user?.user.username !== article.author.username) {
        void this.router.navigate(['/']);
      }
    }),
    map(([article, _]) => article),
  );

  submitForm(articleData: Partial<Article>): void {
    this.isSubmittingSubject.next(true);

    this.route.params
      .pipe(
        switchMap(params => {
          if (params['slug']) {
            return this.articleService.update({ ...articleData, slug: params['slug'] });
          }
          return this.articleService.create(articleData);
        }),
        tap(article => this.router.navigate(['/article/', article.slug])),
        catchError(err => {
          this.errorsSubject.next(err);
          this.isSubmittingSubject.next(false);
          return EMPTY;
        }),
        take(1),
      )
      .subscribe();
  }
}
