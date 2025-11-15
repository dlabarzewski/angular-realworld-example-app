import { isPlatformBrowser } from '@angular/common';
import { FactoryProvider, inject, InjectionToken, PLATFORM_ID } from '@angular/core';

export const LOCAL_STORAGE = new InjectionToken<Storage>('LocalStorageToken');

export function provideLocalStorage(): FactoryProvider {
  return {
    provide: LOCAL_STORAGE,
    useFactory: () => {
      const platformId = inject(PLATFORM_ID);
      return isPlatformBrowser(platformId)
        ? window.localStorage
        : ({
            getItem: (_: string) => null,
            setItem: (_: string, __: string) => {},
            removeItem: (_: string) => {},
            clear: () => {},
          } as Storage);
    },
  };
}
