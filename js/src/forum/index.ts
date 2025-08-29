import app from 'flarum/forum/app';
import extendCommentPost from './extenders/extendCommentPost';

export { default as extend } from './extend';

// Export components for external use
export { default as PostImageCarousel } from './components/PostImageCarousel';

app.initializers.add('wusong8899-post-image-carousel', () => {
  console.log('[wusong8899/flarum-post-image-carousel] Initializing image carousel...');
  
  // Initialize the CommentPost extension
  extendCommentPost();
  
  console.log('[wusong8899/flarum-post-image-carousel] Image carousel initialized successfully');
});
