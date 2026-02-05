'use client';

import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useCallback } from 'react';

/**
 * Hook that provides a fetch function that automatically includes
 * impersonation headers when an admin is viewing as another user.
 *
 * Usage:
 * const { fetchWithImpersonation } = useImpersonatedFetch();
 * const response = await fetchWithImpersonation('/api/risks');
 */
export function useImpersonatedFetch() {
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const fetchWithImpersonation = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers);

      // Add impersonation header if we're impersonating
      if (isImpersonating && impersonatedUser) {
        headers.set('X-Impersonate-User-Id', impersonatedUser.id);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [isImpersonating, impersonatedUser]
  );

  return { fetchWithImpersonation };
}

/**
 * Utility function to get impersonation headers.
 * Use this when you need to manually construct headers.
 */
export function getImpersonationHeaders(impersonatedUserId?: string): Record<string, string> {
  if (impersonatedUserId) {
    return {
      'X-Impersonate-User-Id': impersonatedUserId,
    };
  }
  return {};
}
