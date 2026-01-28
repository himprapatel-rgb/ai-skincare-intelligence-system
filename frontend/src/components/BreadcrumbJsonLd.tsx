/**
 * Renders JSON-LD BreadcrumbList for inner pages (Task 208).
 * Pass an array of { name, path } (path relative to origin).
 */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

const getBaseUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : '';

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  const base = getBaseUrl();
  const list = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: base ? `${base}${item.path.startsWith('/') ? item.path : `/${item.path}`}` : undefined,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(list) }}
    />
  );
}
