import { extend } from 'flarum/common/extend';
import CommentPost from 'flarum/forum/components/CommentPost';
import PostImageCarousel from '../components/PostImageCarousel';
import { processPostImages, ImageGroup } from '../utils/extractImages';
import m from 'mithril';
import app from 'flarum/forum/app';

/**
 * Extends CommentPost to inject image carousels
 */
export default function extendCommentPost() {
  // Override the oncreate method to process images after DOM creation
  extend(CommentPost.prototype, 'oncreate', function (_vnode: any) {
    // Wait for next tick to ensure DOM is fully rendered
    setTimeout(() => {
      this.processPostImages();
    }, 10);
  });

  // Also process on updates in case post content changes
  extend(CommentPost.prototype, 'onupdate', function (_vnode: any) {
    setTimeout(() => {
      this.processPostImages();
    }, 10);
  });

  // Add the processing method to CommentPost prototype
  CommentPost.prototype.processPostImages = function () {
    const postBodyElement = this.element?.querySelector('.Post-body') as HTMLElement;
    
    if (!postBodyElement) {
      return;
    }

    // Check if already processed to avoid double processing
    if (postBodyElement.hasAttribute('data-carousel-processed')) {
      return;
    }

    try {
      const { groups, placeholders } = processPostImages(postBodyElement);
      
      if (groups.length === 0) {
        return;
      }

      // Render carousels for each group
      groups.forEach((group: ImageGroup & { groupId?: string }) => {
        if (group.shouldUseCarousel && group.groupId && group.images.length >= 2) {
          const placeholder = placeholders.get(group.groupId);
          
          if (placeholder) {
            this.renderCarouselAtPlaceholder(placeholder, group);
          }
        }
      });

      // Mark as processed
      postBodyElement.setAttribute('data-carousel-processed', 'true');
      
    } catch (error) {
      console.error('Error processing post images for carousel:', error);
    }
  };

  // Add method to render carousel at specific placeholder
  CommentPost.prototype.renderCarouselAtPlaceholder = function (placeholder: HTMLElement, group: ImageGroup) {
    // Create a container for the Mithril component
    const container = document.createElement('div');
    container.className = 'PostImageCarousel-container';
    
    // Replace placeholder with container
    placeholder.parentNode?.replaceChild(container, placeholder);
    
    // Get autoplay setting from forum settings (default to false)
    const autoplay = app.forum.attribute('wusong8899-post-image-carousel.autoplay') || false;
    
    // Render the carousel component
    m.render(container, m(PostImageCarousel, {
      images: group.images,
      autoplay: autoplay,
      showArrows: true,
      showBullets: true,
    }));
  };

  // Clean up on component removal
  extend(CommentPost.prototype, 'onremove', function (_vnode: any) {
    // Cleanup any Mithril rendered carousels
    const carouselContainers = this.element?.querySelectorAll('.PostImageCarousel-container');
    if (carouselContainers) {
      carouselContainers.forEach((container: Element) => {
        m.render(container as HTMLElement, []);
      });
    }
  });
}