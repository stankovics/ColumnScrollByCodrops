import { preloadImages } from './utils';

// Preload images then remove loader (loading class) from body
preloadImages('.column__item-img').then(() => {
  document.body.classList.remove('loading');
});
