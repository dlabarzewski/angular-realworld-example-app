import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, EMPTY, switchMap, take } from 'rxjs';
import { AsyncPipe, NgClass } from '@angular/common';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

@Component({
  selector: 'app-favorite-button',
  template: `
    <button
      class="btn btn-sm"
      [ngClass]="{
        disabled: isSubmitting$ | async,
        'btn-outline-primary': !article.favorited,
        'btn-primary': article.favorited,
      }"
      (click)="toggleFavorite()"
    >
      <i class="ion-heart"></i> <ng-content></ng-content>
    </button>
  `,
  imports: [NgClass, AsyncPipe],
})
export class FavoriteButtonComponent {
  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  @Input() article!: Article;
  @Output() toggle = new EventEmitter<boolean>();

  private readonly articleService = inject(ArticlesService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  toggleFavorite(): void {
    this.isSubmittingSubject.next(true);

    this.userService.isAuthenticated
      .pipe(
        switchMap(authenticated => {
          if (!authenticated) {
            void this.router.navigate(['/register']);
            return EMPTY;
          }

          if (!this.article.favorited) {
            return this.articleService.favorite(this.article.slug);
          } else {
            return this.articleService.unfavorite(this.article.slug);
          }
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.isSubmittingSubject.next(false);
          this.toggle.emit(!this.article.favorited);
        },
        error: () => this.isSubmittingSubject.next(false),
      });
  }
}
