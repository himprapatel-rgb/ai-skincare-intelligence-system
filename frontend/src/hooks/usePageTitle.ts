/**
 * Sets document.title for the current page (Tasks 30, 32, 53).
 */
import { useEffect } from 'react';

const BASE_TITLE = 'SkinCareAI';

export function usePageTitle(title: string | null) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
