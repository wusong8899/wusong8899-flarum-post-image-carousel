import Component, { ComponentAttrs } from 'flarum/common/Component';
import Glide, { Options } from '@glidejs/glide';

export interface ImageData {
  src: string;
  title?: string;
  alt?: string;
  dataId?: string;
}

export interface PostImageCarouselAttrs extends ComponentAttrs {
  images: ImageData[];
  autoplay?: boolean;
  showArrows?: boolean;
  showBullets?: boolean;
}

export default class PostImageCarousel extends Component<PostImageCarouselAttrs> {
  private glideInstance: Glide | null = null;
  private carouselId: string;
  
  oninit(vnode: any) {
    super.oninit(vnode);
    this.carouselId = `post-carousel-${Math.random().toString(36).substr(2, 9)}`;
  }

  view() {
    const { images, showArrows = true, showBullets = true } = this.attrs;

    if (!images || images.length === 0) {
      return null;
    }

    // If only one image, display it normally without carousel
    if (images.length === 1) {
      const image = images[0];
      return (
        <div className="PostImageCarousel PostImageCarousel--single">
          <div className="PostImageCarousel-image">
            <img 
              src={image.src} 
              alt={image.alt || ''} 
              title={image.title || ''} 
              loading="lazy"
              className="PostImageCarousel-img"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="PostImageCarousel PostImageCarousel--multiple">
        <div className="glide" id={this.carouselId}>
          <div className="glide__track" data-glide-el="track">
            <ul className="glide__slides">
              {images.map((image, index) => (
                <li className="glide__slide" key={`slide-${index}`}>
                  <div className="PostImageCarousel-imageContainer">
                    <img
                      src={image.src}
                      alt={image.alt || ''}
                      title={image.title || ''}
                      loading="lazy"
                      className="PostImageCarousel-img"
                      data-id={image.dataId}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {showArrows && images.length > 1 && (
            <div className="glide__arrows" data-glide-el="controls">
              <button 
                className="glide__arrow glide__arrow--left PostImageCarousel-arrow PostImageCarousel-arrow--prev" 
                data-glide-dir="<"
                aria-label="Previous image"
              >
                <i className="fas fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button 
                className="glide__arrow glide__arrow--right PostImageCarousel-arrow PostImageCarousel-arrow--next" 
                data-glide-dir=">"
                aria-label="Next image"
              >
                <i className="fas fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          )}

          {showBullets && images.length > 1 && (
            <div className="glide__bullets PostImageCarousel-bullets" data-glide-el="controls[nav]">
              {images.map((_, index) => (
                <button 
                  className="glide__bullet PostImageCarousel-bullet" 
                  data-glide-dir={`=${index}`}
                  key={`bullet-${index}`}
                  aria-label={`Go to image ${index + 1}`}
                ></button>
              ))}
            </div>
          )}
        </div>
        
        <div className="PostImageCarousel-counter">
          <span className="PostImageCarousel-current">1</span>
          <span className="PostImageCarousel-separator"> / </span>
          <span className="PostImageCarousel-total">{images.length}</span>
        </div>
      </div>
    );
  }

  oncreate(vnode: any) {
    super.oncreate(vnode);
    
    if (this.attrs.images && this.attrs.images.length > 1) {
      this.initializeGlide();
    }
  }

  onupdate(vnode: any) {
    super.onupdate(vnode);
    
    // Reinitialize if images changed
    if (this.glideInstance && this.attrs.images && this.attrs.images.length > 1) {
      this.destroyGlide();
      this.initializeGlide();
    }
  }

  onremove(vnode: any) {
    this.destroyGlide();
    super.onremove(vnode);
  }

  private initializeGlide() {
    const element = document.getElementById(this.carouselId);
    if (!element || !this.attrs.images || this.attrs.images.length <= 1) {
      return;
    }

    const config: Options = {
      type: 'carousel',
      startAt: 0,
      perView: 1,
      gap: 0,
      keyboard: true,
      swipeThreshold: 80,
      dragThreshold: 120,
      animationDuration: 400,
      animationTimingFunc: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
      breakpoints: {
        768: {
          swipeThreshold: 60,
          dragThreshold: 100,
        }
      }
    };

    // Add autoplay if enabled
    if (this.attrs.autoplay) {
      config.autoplay = 4000;
      config.hoverpause = true;
    }

    try {
      this.glideInstance = new Glide(`#${this.carouselId}`, config);
      
      // Add event listeners for counter update
      this.glideInstance.on(['mount.after', 'run'], () => {
        this.updateCounter();
      });

      this.glideInstance.mount();
      this.updateCounter();
    } catch (error) {
      console.error('Failed to initialize Glide carousel:', error);
    }
  }

  private destroyGlide() {
    if (this.glideInstance) {
      try {
        this.glideInstance.destroy();
      } catch (error) {
        console.warn('Error destroying Glide instance:', error);
      } finally {
        this.glideInstance = null;
      }
    }
  }

  private updateCounter() {
    if (!this.glideInstance) return;
    
    const currentElement = document.querySelector(`#${this.carouselId} .PostImageCarousel-current`);
    if (currentElement) {
      currentElement.textContent = String(this.glideInstance.index + 1);
    }
  }
}