import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, EMPTY, switchMap, take } from 'rxjs';
import { Errors } from '../../../../core/models/errors.model';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';

interface ArticleForm {
  title: FormControl<string>;
  description: FormControl<string>;
  body: FormControl<string>;
}

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor.component.html',
  imports: [ListErrorsComponent, ReactiveFormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly articleService = inject(ArticlesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly tagListSubject = new BehaviorSubject<string[]>([]);
  protected readonly tagList$ = this.tagListSubject.asObservable();

  protected readonly articleForm = new FormGroup<ArticleForm>({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    body: new FormControl('', { nonNullable: true }),
  });
  protected readonly tagField = new FormControl<string>('', { nonNullable: true });

  private readonly errorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly errors$ = this.errorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap(params => {
          if (params['slug']) {
            return combineLatest([this.articleService.get(params['slug']), this.userService.getCurrentUser()]);
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([article, { user }]) => {
        if (user.username === article.author.username) {
          this.tagListSubject.next(article.tagList);
          this.articleForm.patchValue(article);
        } else {
          void this.router.navigate(['/']);
        }
      });
  }

  addTag() {
    // retrieve tag control
    const tag = this.tagField.value;

    const tagList = this.tagListSubject.value;
    // only add tag if it does not exist yet
    if (tag != null && tag.trim() !== '' && tagList.indexOf(tag) < 0) {
      this.tagListSubject.next([...tagList, tag]);
    }
    // clear the input
    this.tagField.reset('');
  }

  removeTag(tagName: string): void {
    const tagList = this.tagListSubject.value;
    this.tagListSubject.next(tagList.filter(tag => tag !== tagName));
  }

  submitForm(): void {
    this.isSubmittingSubject.next(true);
    // update any single tag
    this.addTag();

    const slug = this.route.snapshot.params['slug'];
    const articleData = {
      ...this.articleForm.value,
      tagList: this.tagListSubject.value,
    };

    const observable = slug
      ? this.articleService.update({ ...articleData, slug })
      : this.articleService.create(articleData);

    observable.pipe(take(1)).subscribe({
      next: article => this.router.navigate(['/article/', article.slug]),
      error: err => {
        this.errorsSubject.next(err);
        this.isSubmittingSubject.next(false);
      },
    });
  }
}
