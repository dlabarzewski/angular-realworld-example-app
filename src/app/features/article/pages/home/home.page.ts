import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleListConfig } from '../../models/article-list-config.model';
import { AsyncPipe } from '@angular/common';
import { ArticleListComponent } from '../../components/article-list.component';
import { take, tap } from 'rxjs/operators';
import { UserService } from '../../../../core/auth/services/user.service';
import { BehaviorSubject } from 'rxjs';
import { ListConfigType } from '../../statics/list-config-type.enum';
import { TagsSidebarComponent } from 'src/app/features/tags/components/tags-sidebar.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styles: `
    .nav-link {
      cursor: pointer;
    }
  `,
  imports: [ArticleListComponent, TagsSidebarComponent, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  protected readonly ListConfigType = ListConfigType;

  protected readonly currentUser$ = this.userService.currentUser;

  protected readonly isAuthenticated$ = this.userService.isAuthenticated.pipe(
    tap(isAuthenticated => {
      if (isAuthenticated) {
        this.setListTo(ListConfigType.FEED);
      } else {
        this.setListTo(ListConfigType.ALL);
      }
    }),
  );

  private readonly listConfigSubject = new BehaviorSubject<ArticleListConfig>({
    type: ListConfigType.ALL,
    filters: {},
  });
  protected readonly listConfig$ = this.listConfigSubject.asObservable();

  setListTo(type: string = '', filters: Object = {}): void {
    // If feed is requested but user is not authenticated, redirect to login
    this.userService.isAuthenticated.pipe(take(1)).subscribe(isAuthenticated => {
      if (type === ListConfigType.FEED && !isAuthenticated) {
        void this.router.navigate(['/login']);
        return;
      }

      // Otherwise, set the list object
      this.listConfigSubject.next({ type: type, filters: filters });
    });
  }
}
