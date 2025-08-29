import app from 'flarum/admin/app';

export { default as extend } from './extend';

app.initializers.add('wusong8899-post-image-carousel', () => {
  console.log('[wusong8899/flarum-post-image-carousel] Hello, admin!');
});
