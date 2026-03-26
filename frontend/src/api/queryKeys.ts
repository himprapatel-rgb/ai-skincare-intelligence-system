export const queryKeys = {
  scans: {
    all: ['scans'] as const,
    history: (userId: number) => ['scans', 'history', userId] as const,
    detail: (scanId: string) => ['scans', 'detail', scanId] as const,
  },
  shelf: {
    all: ['shelf'] as const,
    list: (userId: number, filters?: Record<string, unknown>) => ['shelf', 'list', userId, filters] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (userId: number) => ['notifications', 'list', userId] as const,
    unread: (userId: number) => ['notifications', 'unread', userId] as const,
  },
  profile: {
    current: ['profile'] as const,
  },
  products: {
    all: ['products'] as const,
    search: (query: string) => ['products', 'search', query] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  goals: {
    all: ['goals'] as const,
    detail: (id: string) => ['goals', 'detail', id] as const,
  },
  favorites: {
    all: ['favorites'] as const,
  },
  ai: {
    chat: {
      sessions: ['ai', 'chat', 'sessions'] as const,
      session: (id: string) => ['ai', 'chat', 'session', id] as const,
      messages: (sessionId: string) => ['ai', 'chat', 'messages', sessionId] as const,
    },
    recommendations: (userId: number) => ['ai', 'recommendations', userId] as const,
  },
  digitalTwin: {
    timeline: (userId: number) => ['digital-twin', 'timeline', userId] as const,
    snapshot: (id: string) => ['digital-twin', 'snapshot', id] as const,
  },
  content: {
    blogs: ['content', 'blogs'] as const,
    videos: ['content', 'videos'] as const,
    news: ['content', 'news'] as const,
  },
};
