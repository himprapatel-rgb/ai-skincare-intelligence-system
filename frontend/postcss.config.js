/* PostCSS config — PurgeCSS removes unused CSS from production builds */
const purgecss = require('@fullhuman/postcss-purgecss');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [
    ...(isProduction
      ? [
          purgecss({
            content: ['./src/**/*.{tsx,ts,jsx,js}', './index.html'],
            defaultExtractor: (content) =>
              content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: {
              /* Exact class names to always keep */
              standard: [
                'active', 'open', 'scrolled', 'is-visible', 'done', 'loading',
                'has-error', 'hidden', 'visible', 'fade-in', 'fade-out',
                'dark', 'light', 'disabled',
              ],
              /* Regex patterns — keep any class matching these */
              deep: [
                /^app-/,
                /^bottom-nav/,
                /^page-transition/,
                /^toast-/,
                /^skeleton-/,
                /^modal-/,
                /^status-/,
                /^trend-?/,
                /^auth-tab/,
                /^input-float/,
                /^faq-/,
                /^today-/,
                /^admin-/,
                /^scan-/,
                /^mobile-/,
                /^notification-/,
              ],
              /* Greedy: also keeps children of matched elements */
              greedy: [
                /active$/,
                /open$/,
                /scrolled$/,
                /visible$/,
                /done$/,
                /milestone$/,
              ],
            },
          }),
        ]
      : []),
  ],
};
