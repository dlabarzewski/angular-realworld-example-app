import { inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE } from '../../providers/storage.provider';

@Injectable({ providedIn: 'root' })
export class JwtService {
  private readonly storage = inject(LOCAL_STORAGE);

  getToken(): string | null {
    return this.storage.getItem('jwtToken');
  }

  saveToken(token: string): void {
    this.storage.setItem('jwtToken', token);
  }

  destroyToken(): void {
    this.storage.removeItem('jwtToken');
  }
}
