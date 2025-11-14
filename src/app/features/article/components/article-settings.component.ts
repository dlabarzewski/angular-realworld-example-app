import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Article } from '../models/article.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-article-settings',
  template: `
    <span>
      <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/editor', article.slug]">
        <i class="ion-edit"></i> Edit Article
      </a>

      <button class="btn btn-sm btn-outline-danger" [class.disabled]="deleteDisabled" (click)="deleteArticle()">
        <i class="ion-trash-a"></i> Delete Article
      </button>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class ArticleSettingsComponent {
  @Input() article!: Article;
  @Input() deleteDisabled: boolean = false;
  @Output() delete = new EventEmitter<void>();

  deleteArticle(): void {
    this.delete.emit();
  }
}
