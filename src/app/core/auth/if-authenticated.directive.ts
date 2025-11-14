import { DestroyRef, Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { UserService } from './services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
  selector: '[ifAuthenticated]',
  standalone: true,
})
export class IfAuthenticatedDirective<T> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly templateRef = inject<TemplateRef<T>>(TemplateRef);
  private readonly userService = inject(UserService);
  private readonly viewContainer = inject(ViewContainerRef);

  private condition: boolean = false;
  private hasView = false;

  ngOnInit() {
    this.userService.isAuthenticated.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isAuthenticated: boolean) => {
      const authRequired = isAuthenticated && this.condition;
      const unauthRequired = !isAuthenticated && !this.condition;

      if ((authRequired || unauthRequired) && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  @Input() set ifAuthenticated(condition: boolean) {
    this.condition = condition;
  }
}
