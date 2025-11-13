import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Article } from '../models/article.model';
import { ArticleMetaComponent } from './article-meta.component';
import { RouterLink } from '@angular/router';

import { FavoriteButtonComponent } from './favorite-button.component';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-article-preview',
  template: `
    @if (article$ | async; as article) {
      <div class="article-preview">
        <app-article-meta [article]="article">
          <app-favorite-button [article]="article" (toggle)="toggleFavorite($event)" class="pull-xs-right">
            {{ article.favoritesCount }}
          </app-favorite-button>
        </app-article-meta>

        <a [routerLink]="['/article', article.slug]" class="preview-link">
          <h1>{{ article.title }}</h1>
          <p>{{ article.description }}</p>
          <span>Read more...</span>
          <ul class="tag-list">
            @for (tag of article.tagList; track tag) {
              <li class="tag-default tag-pill tag-outline">
                {{ tag }}
              </li>
            }
          </ul>
        </a>
      </div>
    }
  `,
  imports: [ArticleMetaComponent, FavoriteButtonComponent, RouterLink, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlePreviewComponent {
  private readonly articleSubject = new BehaviorSubject<Article | undefined>(undefined);
  protected readonly article$ = this.articleSubject.asObservable();

  @Input() set article(value: Article) {
    this.articleSubject.next(value);
  }

  toggleFavorite(favorited: boolean): void {
    const article = this.articleSubject.value;

    if (!article) return;

    this.articleSubject.next({
      ...article,
      favorited: favorited,
      favoritesCount: favorited ? article.favoritesCount + 1 : article.favoritesCount - 1,
    });
  }
}
