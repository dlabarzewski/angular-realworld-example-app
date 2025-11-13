import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ArticleListConfig } from '../../models/article-list-config.model';
import { NgClass } from '@angular/common';
import { ArticleListComponent } from '../../components/article-list.component';
import { take, tap } from 'rxjs/operators';
import { UserService } from '../../../../core/auth/services/user.service';
import { IfAuthenticatedDirective } from '../../../../core/auth/if-authenticated.directive';
import { TagsSidebarComponent } from 'src/app/features/services/components/tags-sidebar.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [NgClass, ArticleListComponent, IfAuthenticatedDirective, TagsSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  protected readonly currentUser$ = this.userService.currentUser;

  protected readonly isAuthenticated$ = this.userService.isAuthenticated.pipe(
    tap(isAuthenticated => {
      if (isAuthenticated) {
        this.setListTo('feed');
      } else {
        this.setListTo('all');
      }
    }),
  );

  listConfig: ArticleListConfig = {
    type: 'all',
    filters: {},
  };

  setListTo(type: string = '', filters: Object = {}): void {
    // If feed is requested but user is not authenticated, redirect to login
    this.userService.isAuthenticated.pipe(take(1)).subscribe(isAuthenticated => {
      if (type === 'feed' && !isAuthenticated) {
        void this.router.navigate(['/login']);
        return;
      }

      // Otherwise, set the list object
      this.listConfig = { type: type, filters: filters };
    });
  }
}
