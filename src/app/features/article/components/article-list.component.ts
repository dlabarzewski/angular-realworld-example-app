import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { ArticlesService } from '../services/articles.service';
import { ArticleListConfig } from '../models/article-list-config.model';
import { Article } from '../models/article.model';
import { ArticlePreviewComponent } from './article-preview.component';
import { AsyncPipe, NgClass } from '@angular/common';
import { LoadingState } from '../../../core/models/loading-state.model';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';
import { ListConfigType } from '../statics/list-config-type.enum';

@Component({
  selector: 'app-article-list',
  template: `
    @if (results$ | async; as results) {
      @if ((loading$ | async) === LoadingState.LOADING) {
        <div class="article-preview">Loading articles...</div>
      }
      @if ((loading$ | async) === LoadingState.LOADED) {
        @for (article of results; track article.slug) {
          <app-article-preview [article]="article" />
        } @empty {
          <div class="article-preview">No articles are here... yet.</div>
        }

        <nav>
          <ul class="pagination">
            @for (pageNumber of totalPages$ | async; track pageNumber) {
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleListComponent {
  private readonly articlesService = inject(ArticlesService);

  private readonly totalPagesSubject = new BehaviorSubject<number[]>([]);
  protected readonly totalPages$ = this.totalPagesSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<LoadingState>(LoadingState.NOT_LOADED);
  protected readonly loading$ = this.loadingSubject.asObservable();

  private readonly querySubject = new BehaviorSubject<ArticleListConfig>({
    type: ListConfigType.ALL,
    filters: {},
    currentPage: 1,
  });
  private readonly query$ = this.querySubject.asObservable();
  protected readonly currentPage$ = this.query$.pipe(map(query => query.currentPage ?? 1));

  protected readonly results$: Observable<Article[]> = this.query$.pipe(
    tap(() => this.loadingSubject.next(LoadingState.LOADING)),
    switchMap(query => {
      if (this.limit) {
        query.filters.limit = this.limit;
        query.filters.offset = this.limit * ((query.currentPage ?? 1) - 1);
      }
      return this.articlesService.query(query);
    }),
    tap(data => {
      this.loadingSubject.next(LoadingState.LOADED);

      // Used from http://www.jstips.co/en/create-range-0...n-easily-using-one-line/
      this.totalPagesSubject.next(
        Array.from(new Array(Math.ceil(data.articlesCount / this.limit)), (val, index) => index + 1),
      );
    }),
    map(data => data.articles),
  );

  protected readonly LoadingState = LoadingState;

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
