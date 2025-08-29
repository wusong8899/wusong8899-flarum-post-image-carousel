import type { ImageData } from '../components/PostImageCarousel';

export interface ImageGroup {
  startIndex: number;
  endIndex: number;
  images: ImageData[];
  shouldUseCarousel: boolean;
}

/**
 * Extracts image data from an img element
 */
export function extractImageData(imgElement: HTMLImageElement): ImageData {
  return {
    src: imgElement.src,
    title: imgElement.title || imgElement.getAttribute('title') || undefined,
    alt: imgElement.alt || imgElement.getAttribute('alt') || '',
    dataId: imgElement.getAttribute('data-id') || undefined,
  };
}

/**
 * Finds all FoF Upload images in post content
 */
export function findFoFUploadImages(postContent: HTMLElement): HTMLImageElement[] {
  const selector = 'img.FoFUpload--Upl-Image-Preview';
  return Array.from(postContent.querySelectorAll(selector));
}

/**
 * Groups consecutive images that should be displayed in a carousel
 * Returns groups with 2+ consecutive images
 */
export function groupConsecutiveImages(images: HTMLImageElement[], minGroupSize: number = 2): ImageGroup[] {
  if (images.length === 0) {
    return [];
  }

  const groups: ImageGroup[] = [];
  let currentGroup: HTMLImageElement[] = [];
  let currentStartIndex = 0;

  for (let i = 0; i < images.length; i++) {
    const currentImg = images[i];
    
    if (currentGroup.length === 0) {
      // Start new group
      currentGroup = [currentImg];
      currentStartIndex = i;
    } else {
      const previousImg = currentGroup[currentGroup.length - 1];
      
      // Check if images are consecutive (no other elements between them except <br> tags)
      if (areImagesConsecutive(previousImg, currentImg)) {
        currentGroup.push(currentImg);
      } else {
        // Finalize current group if it meets minimum size
        if (currentGroup.length >= minGroupSize) {
          groups.push({
            startIndex: currentStartIndex,
            endIndex: currentStartIndex + currentGroup.length - 1,
            images: currentGroup.map(extractImageData),
            shouldUseCarousel: true
          });
        } else {
          // Add as individual images
          currentGroup.forEach((img, idx) => {
            groups.push({
              startIndex: currentStartIndex + idx,
              endIndex: currentStartIndex + idx,
              images: [extractImageData(img)],
              shouldUseCarousel: false
            });
          });
        }
        
        // Start new group
        currentGroup = [currentImg];
        currentStartIndex = i;
      }
    }
  }

  // Handle final group
  if (currentGroup.length > 0) {
    if (currentGroup.length >= minGroupSize) {
      groups.push({
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + currentGroup.length - 1,
        images: currentGroup.map(extractImageData),
        shouldUseCarousel: true
      });
    } else {
      // Add as individual images
      currentGroup.forEach((img, idx) => {
        groups.push({
          startIndex: currentStartIndex + idx,
          endIndex: currentStartIndex + idx,
          images: [extractImageData(img)],
          shouldUseCarousel: false
        });
      });
    }
  }

  return groups;
}

/**
 * Checks if two images are consecutive in the DOM
 * Allows for <br> tags and whitespace between images
 */
function areImagesConsecutive(img1: HTMLImageElement, img2: HTMLImageElement): boolean {
  let current = img1.nextSibling;
  
  // Traverse until we find img2 or encounter a non-whitespace, non-br element
  while (current && current !== img2) {
    if (current.nodeType === Node.TEXT_NODE) {
      // Allow whitespace text nodes
      const text = current.textContent?.trim() || '';
      if (text !== '') {
        return false; // Non-whitespace text found
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as HTMLElement;
      // Allow <br> tags
      if (element.tagName.toLowerCase() !== 'br') {
        return false; // Other element found
      }
    }
    current = current.nextSibling;
  }
  
  return current === img2;
}

/**
 * Creates a placeholder div to replace original images
 */
export function createCarouselPlaceholder(groupId: string): HTMLDivElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'PostImageCarousel-placeholder';
  placeholder.setAttribute('data-carousel-group-id', groupId);
  placeholder.style.display = 'none'; // Hidden until Mithril renders
  return placeholder;
}

/**
 * Removes original images from DOM and inserts placeholder
 */
export function replaceImagesWithPlaceholder(images: HTMLImageElement[], placeholder: HTMLElement): void {
  if (images.length === 0) return;
  
  // Insert placeholder before the first image
  const firstImage = images[0];
  firstImage.parentNode?.insertBefore(placeholder, firstImage);
  
  // Remove all original images and any br tags between them
  let current = firstImage;
  let imagesToRemove: Node[] = [];
  
  // Collect all images in the group and br tags between them
  while (current) {
    if (images.includes(current as HTMLImageElement)) {
      imagesToRemove.push(current);
      
      // Check next sibling for br tags to remove
      let nextSibling = current.nextSibling;
      while (nextSibling && 
             (nextSibling.nodeType === Node.TEXT_NODE && (nextSibling.textContent?.trim() === '')) ||
             (nextSibling.nodeType === Node.ELEMENT_NODE && (nextSibling as HTMLElement).tagName.toLowerCase() === 'br')) {
        const nodeToRemove = nextSibling;
        nextSibling = nextSibling.nextSibling;
        if (nodeToRemove.nodeType === Node.ELEMENT_NODE) {
          imagesToRemove.push(nodeToRemove);
        }
      }
      current = nextSibling;
    } else {
      current = current.nextSibling;
    }
    
    // Safety break
    if (!current || !current.parentNode) break;
  }
  
  // Remove collected nodes
  imagesToRemove.forEach(node => {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  });
}

/**
 * Main function to process post content and prepare for carousel injection
 */
export function processPostImages(postContent: HTMLElement): {
  groups: ImageGroup[];
  placeholders: Map<string, HTMLElement>;
} {
  const images = findFoFUploadImages(postContent);
  const groups = groupConsecutiveImages(images);
  const placeholders = new Map<string, HTMLElement>();
  
  // Process groups in reverse order to avoid DOM index shifting
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    const groupId = `carousel-group-${i}-${Date.now()}`;
    
    if (group.shouldUseCarousel && group.images.length >= 2) {
      // Get the actual DOM elements for this group
      const groupImages = images.slice(group.startIndex, group.endIndex + 1);
      
      // Create placeholder and replace images
      const placeholder = createCarouselPlaceholder(groupId);
      replaceImagesWithPlaceholder(groupImages, placeholder);
      
      placeholders.set(groupId, placeholder);
      
      // Update group with the groupId for later reference
      (group as any).groupId = groupId;
    }
  }
  
  return { groups, placeholders };
}