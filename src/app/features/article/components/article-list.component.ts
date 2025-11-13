import { Component, DestroyRef, inject, Input } from '@angular/core';
import { ArticlesService } from '../services/articles.service';
import { ArticleListConfig } from '../models/article-list-config.model';
import { Article } from '../models/article.model';
import { ArticlePreviewComponent } from './article-preview.component';
import { AsyncPipe, NgClass } from '@angular/common';
import { LoadingState } from '../../../core/models/loading-state.model';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-article-list',
  template: `
    @if (results$ | async; as results) {
      @if (loading === LoadingState.LOADING) {
        <div class="article-preview">Loading articles...</div>
      }
      @if (loading === LoadingState.LOADED) {
        @for (article of results; track article.slug) {
          <app-article-preview [article]="article" />
        } @empty {
          <div class="article-preview">No articles are here... yet.</div>
        }

        <nav>
          <ul class="pagination">
            @for (pageNumber of totalPages; track pageNumber) {
              <li class="page-item" [ngClass]="{ active: pageNumber === (currentPage$ | async) }">
                <button class="page-link" (click)="setPageTo(pageNumber)">
                  {{ pageNumber }}
                </button>
              </li>
            }
          </ul>
        </nav>
      }
    }
  `,
  imports: [ArticlePreviewComponent, NgClass, AsyncPipe],
  styles: `
    .page-link {
      cursor: pointer;
    }
  `,
})
export class ArticleListComponent {
  private readonly articlesService = inject(ArticlesService);

  private readonly querySubject = new BehaviorSubject<ArticleListConfig>({
    type: 'all',
    filters: {},
    currentPage: 1,
  });
  private readonly query$ = this.querySubject.asObservable();
  protected readonly currentPage$ = this.query$.pipe(map(query => query.currentPage ?? 1));

  protected readonly results$: Observable<Article[]> = this.query$.pipe(
    tap(() => (this.loading = LoadingState.LOADING)),
    switchMap(query => {
      if (this.limit) {
        query.filters.limit = this.limit;
        query.filters.offset = this.limit * ((query.currentPage ?? 1) - 1);
      }
      return this.articlesService.query(query);
    }),
    tap(data => {
      this.loading = LoadingState.LOADED;

      // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
      this.totalPages = Array.from(new Array(Math.ceil(data.articlesCount / this.limit)), (val, index) => index + 1);
    }),
    map(data => data.articles),
  );

  totalPages: Array<number> = [];
  loading = LoadingState.NOT_LOADED;
  LoadingState = LoadingState;
  destroyRef = inject(DestroyRef);

  @Input() limit!: number;
  @Input()
  set config(config: ArticleListConfig) {
    if (config) {
      this.querySubject.next({
        ...config,
        currentPage: 1,
      });
    }
  }

  setPageTo(pageNumber: number) {
    this.querySubject.next({
      ...this.querySubject.value,
      currentPage: pageNumber,
    });
  }
}
