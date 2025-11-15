import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Article } from '../models/article.model';
import { BehaviorSubject } from 'rxjs';

interface ArticleForm {
  readonly title: FormControl<string>;
  readonly description: FormControl<string>;
  readonly body: FormControl<string>;
}

@Component({
  selector: 'app-editor-form',
  template: `
    <form [formGroup]="articleForm" (ngSubmit)="submitForm()">
      <fieldset [disabled]="disabled">
        <fieldset class="form-group">
          <input class="form-control form-control-lg" formControlName="title" type="text" placeholder="Article Title" />
        </fieldset>

        <fieldset class="form-group">
          <input
            class="form-control"
            formControlName="description"
            type="text"
            placeholder="What's this article about?"
          />
        </fieldset>

        <fieldset class="form-group">
          <textarea class="form-control" formControlName="body" rows="8" placeholder="Write your article (in markdown)">
          </textarea>
        </fieldset>

        <fieldset class="form-group">
          <input
            class="form-control"
            type="text"
            placeholder="Enter tags"
            [formControl]="tagField"
            (keydown.enter)="addTag($event)"
          />
          <div class="tag-list">
            @for (tag of tagList$ | async; track tag) {
              <span class="tag-default tag-pill">
                <i class="ion-close-round" (click)="removeTag(tag)"></i>
                {{ tag }}
              </span>
            }
          </div>
        </fieldset>

        <button class="btn btn-lg pull-xs-right btn-primary" type="submit">Publish Article</button>
      </fieldset>
    </form>
  `,
  imports: [ReactiveFormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorFormComponent {
  @Input() set article(value: Article | null) {
    if (!value) return;

    this.tagListSubject.next(value.tagList);
    this.articleForm.patchValue(value);
  }
  @Output() submit = new EventEmitter<Partial<Article>>();
  @Input() disabled: boolean = false;

  private readonly tagListSubject = new BehaviorSubject<string[]>([]);
  protected readonly tagList$ = this.tagListSubject.asObservable();

  protected readonly articleForm = new FormGroup<ArticleForm>({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    body: new FormControl('', { nonNullable: true }),
  });
  protected readonly tagField = new FormControl<string>('', { nonNullable: true });

  submitForm() {
    this.addTag();
    this.submit.emit({ ...this.articleForm.value, tagList: this.tagListSubject.value });
  }

  addTag(event?: Event) {
    event?.preventDefault();
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
}
