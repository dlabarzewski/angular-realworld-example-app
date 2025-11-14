import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TagsService } from '../services/tags.service';
import { tap } from 'rxjs/internal/operators/tap';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-tags-sidebar',
  template: `
    <div class="sidebar">
      <p>Popular Tags</p>

      @if (tags$ | async; as tags) {
        @if (tags.length > 0) {
          <div class="tag-list">
            @for (tag of tags; track tag) {
              <a class="tag-default tag-pill" (click)="tagSelected.emit(tag)">
                {{ tag }}
              </a>
            }
          </div>
        } @else if (!(tagsLoaded$ | async)) {
          <div>Loading tags...</div>
        } @else {
          <div>No tags are here... yet.</div>
        }
      }
    </div>
  `,
  styles: `
    .tag-pill {
      cursor: pointer;
    }
  `,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsSidebarComponent {
  private readonly tagService = inject(TagsService);
  private readonly tagsLoadedSubject = new BehaviorSubject<boolean>(false);
  protected readonly tagsLoaded$ = this.tagsLoadedSubject.asObservable();

  protected readonly tags$ = this.tagService.getAll().pipe(tap(() => this.tagsLoadedSubject.next(true)));

  @Output() tagSelected = new EventEmitter<string>();
}
