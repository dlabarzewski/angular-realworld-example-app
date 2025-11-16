import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Article } from '../models/article.model';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, take, tap } from 'rxjs';
import { ArticlesService } from '../services/articles.service';

@Component({
  selector: 'app-article-settings',
  template: `
    <span>
      <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/editor', article.slug]">
        <i class="ion-edit"></i> Edit Article
      </a>

      <button class="btn btn-sm btn-outline-danger" [class.disabled]="isDeleting$ | async" (click)="deleteArticle()">
        <i class="ion-trash-a"></i> Delete Article
      </button>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AsyncPipe],
})
export class ArticleSettingsComponent {
  private readonly router = inject(Router);
  private readonly articleService = inject(ArticlesService);

  @Input() article!: Article;

  private readonly isDeletingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isDeleting$ = this.isDeletingSubject.asObservable();

  deleteArticle(): void {
    if (this.isDeletingSubject.value) return;

    this.isDeletingSubject.next(true);

    this.articleService
      .delete(this.article.slug)
      .pipe(
        tap(() => {
          void this.router.navigate(['/']);
        }),
        take(1),
      )
      .subscribe();
  }
}
