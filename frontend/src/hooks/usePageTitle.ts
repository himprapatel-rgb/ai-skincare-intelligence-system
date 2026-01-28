/**
 * Sets document.title, meta description, og:title, og:description, and Twitter card for the current page (Tasks 30, 32, 53, 202, 203, 204).
 */
import { useEffect } from 'react';

const BASE_TITLE = 'SkinCareAI';
const DEFAULT_DESCRIPTION = 'AI-powered skin analysis, personalized recommendations, and skincare routine builder. Get started with a free scan.';

function getOrCreateMeta(nameOrProp: string, isProperty: boolean): HTMLMetaElement {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, nameOrProp);
    document.head.appendChild(el);
  }
  return el;
}

function setMetaContent(el: HTMLMetaElement, content: string): string {
  const prev = el.getAttribute('content') ?? '';
  el.setAttribute('content', content);
  return prev;
}

export function usePageTitle(title: string | null, description?: string | null) {
  useEffect(() => {
    const prevTitle = document.title;
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    const desc = description !== undefined && description !== null ? description : DEFAULT_DESCRIPTION;

    document.title = fullTitle;
    const prevDesc = setMetaContent(getOrCreateMeta('description', false), desc);
    const prevOgTitle = setMetaContent(getOrCreateMeta('og:title', true), fullTitle);
    const prevOgDesc = setMetaContent(getOrCreateMeta('og:description', true), desc);
    const prevTwTitle = setMetaContent(getOrCreateMeta('twitter:title', false), fullTitle);
    const prevTwDesc = setMetaContent(getOrCreateMeta('twitter:description', false), desc);

    return () => {
      document.title = prevTitle;
      setMetaContent(getOrCreateMeta('description', false), prevDesc);
      setMetaContent(getOrCreateMeta('og:title', true), prevOgTitle);
      setMetaContent(getOrCreateMeta('og:description', true), prevOgDesc);
      setMetaContent(getOrCreateMeta('twitter:title', false), prevTwTitle);
      setMetaContent(getOrCreateMeta('twitter:description', false), prevTwDesc);
    };
  }, [title, description]);
}
