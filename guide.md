# Building a Flarum 1.8.10 image carousel plugin with FoF Upload and glide.js

Creating a Flarum plugin that extracts images from posts using FoF Upload and displays them in a glide.js carousel requires understanding Flarum's extension architecture, integrating with existing extensions, and implementing modern frontend components. This comprehensive guide provides the technical foundation and practical implementation details needed to build this plugin from scratch, covering backend integration, frontend development, and deployment considerations.

## Flarum plugin architecture and development structure

Flarum 1.8.10 follows a modular extension architecture built on **Laravel's foundation** with a **Mithril.js frontend**. The standard plugin structure organizes code into distinct directories for PHP backend logic, JavaScript/TypeScript frontend components, database migrations, and styling assets.

The essential directory structure for your image carousel plugin includes a `composer.json` manifest defining the extension metadata and dependencies, an `extend.php` file serving as the main configuration entry point, and separate folders for PHP source code, JavaScript components, database migrations, and styling. The JavaScript directory uses a dual structure with `src` for development files and `dist` for compiled production bundles, supporting both admin and forum interfaces.

For namespace conventions, follow **PSR-4 autoloading standards** with a vendor-prefixed namespace like `Vendor\ImageCarousel\`. The `extend.php` file serves as the extension's bootstrap, registering frontend assets, API routes, event listeners, and model relationships. This file uses Flarum's fluent **Extender API** to hook into the core system without modifying core files directly.

Best practices include using the **Flarum CLI** for scaffolding initial structure, enabling debug mode during development, implementing TypeScript for type safety in frontend code, and following semantic versioning for releases. The extension should use dependency injection for services and implement proper error handling throughout.

## Interacting with FoF Upload to extract images

FoF Upload stores file metadata in a dedicated `fof_upload_files` table containing crucial fields like **UUID identifiers**, original filenames, storage paths, MIME types, and associations with posts and discussions. Understanding this schema is fundamental for extracting images from posts.

The extension uses **multiple storage adapters** including local filesystem, Imgur, AWS S3, and other cloud providers. Files are referenced in posts through custom BBCode tags or direct URL patterns, typically using formats like `[file]{uuid}[/file]` or `/assets/files/{uuid}`. To extract images, you'll implement pattern matching against post content using **regular expressions** that capture UUID patterns and file references.

Database queries leverage Eloquent relationships to efficiently retrieve image data. A typical query joins the posts table with FoF Upload's files table, filtering by MIME type to select only images. The extraction process involves parsing post content for UUID references, validating file existence in the database, and filtering results to include only image types based on MIME type patterns like `image/*`.

For optimal performance, implement **caching strategies** using Laravel's cache repository to store processed image lists. The cache should invalidate when posts are edited or new images are uploaded. Consider chunking large result sets and using eager loading for relationships to minimize database queries.

## Frontend implementation with glide.js carousel

Integrating glide.js into a Flarum extension requires careful configuration of the build pipeline and component architecture. The implementation starts with adding glide.js as an NPM dependency alongside Flarum's webpack configuration. The TypeScript setup extends Flarum's base configuration with proper type definitions and compilation settings.

The core carousel component extends Flarum's base Component class, implementing **Mithril.js lifecycle methods** for initialization, rendering, and cleanup. The component manages glide.js instance creation in the `oncreate` lifecycle hook, ensuring proper DOM availability. Configuration options include carousel type, slide transitions, autoplay settings, responsive breakpoints, and keyboard navigation support.

The glide.js instance requires careful lifecycle management to prevent memory leaks. Initialize the carousel after component mounting, destroy it properly in the `onremove` hook, and handle dynamic content updates by reinitializing when image arrays change. Event listeners track slide changes, enabling features like **lazy loading** for performance optimization and auto-height adjustments for variable content.

Performance optimizations include implementing lazy loading for off-screen images, preloading adjacent slides for smooth transitions, using CSS transforms for hardware acceleration, and applying the `will-change` property judiciously. The component should handle edge cases like single images gracefully, displaying static views when carousels aren't needed.

## JavaScript and TypeScript integration patterns

Flarum's JavaScript architecture uses **Mithril.js components** wrapped in a custom Component class providing convenient abstractions. TypeScript integration enhances development with type safety, IntelliSense support, and compile-time error checking. Configure TypeScript through a `tsconfig.json` extending Flarum's base configuration with appropriate path mappings for core modules.

The webpack configuration uses Flarum's preset with minimal customization needed. Entry points separate admin and forum bundles, each importing and initializing relevant components. Use the **extend and override utilities** from Flarum's common modules to modify existing components without replacing them entirely.

Component communication follows Flarum's patterns using attributes for parent-to-child data flow and callbacks for child-to-parent events. State management leverages Mithril's reactive redraw system, with `m.redraw()` triggering updates after state changes. For complex state, consider implementing a **store pattern** or using Flarum's built-in app state management.

Extension initialization happens through the `app.initializers.add()` method, ensuring proper load order and dependency resolution. Priority values control initialization sequence when multiple extensions interact with the same components.

## Post rendering hooks and content manipulation

Flarum provides multiple extension points for modifying post content at different stages of the rendering pipeline. The **Formatter extender** offers hooks for parsing, configuring, and rendering content, allowing manipulation of raw text before parsing, XML structure after parsing, and HTML output before display.

Backend post manipulation uses event listeners for `Posted`, `Revised`, and `Saving` events. These listeners can extract image references, update carousel metadata, and validate content structure. The Formatter's parse hook processes raw post content to identify image patterns, while the render hook modifies the final HTML output to inject carousel containers.

Frontend post rendering extends through **JavaScript component hooks**. The `CommentPost` component's content method is the primary extension point for adding carousel displays. Use the ItemList pattern to add carousel components with appropriate priority values, ensuring proper positioning relative to other post elements.

Implement content extraction using **regular expressions** matching FoF Upload's BBCode patterns and URL structures. Parse the post's content attribute to identify image UUIDs, then query the database for corresponding file records. Cache extraction results to avoid repeated parsing, invalidating cache when posts are edited.

## CSS styling and responsive design

The carousel styling must integrate seamlessly with Flarum's theming system while providing responsive, performant displays. Import glide.js core styles as a foundation, then layer custom styles using **LESS variables** from Flarum's theme for consistency.

Implement a **mobile-first responsive design** with breakpoints at 768px and 1024px. Mobile views should prioritize touch interactions with larger touch targets, simplified controls, and adjusted spacing. Desktop views can include advanced features like thumbnail navigation and hover effects.

Critical styling considerations include using **CSS containment** for performance isolation, implementing smooth transitions with GPU-accelerated transforms, providing loading states with skeleton screens or shimmer effects, and ensuring **accessibility** with proper focus states and ARIA labels. Theme compatibility requires using Flarum's CSS variables for colors, spacing, and typography.

The carousel container should use flexbox or grid layouts for reliable positioning. Apply `object-fit: cover` to images for consistent aspect ratios while preserving quality. Implement **aspect ratio boxes** to prevent layout shift during image loading.

## Database architecture and query optimization

The plugin requires a custom database table storing carousel metadata and image associations. The schema includes fields for post relationships, file references from FoF Upload, display order for sequencing, and optional captions or metadata. Implement **composite indexes** on frequently queried column combinations like `post_id` and `order` for optimal performance.

Eloquent models extend Flarum's `AbstractModel` with defined relationships to posts and FoF Upload files. Implement model events for cache invalidation, ensuring consistency between database and cached data. Use **eager loading** with the `with()` method to prevent N+1 query problems when fetching related data.

Query optimization strategies include chunking large result sets to manage memory usage, using database-level sorting and filtering instead of PHP collection methods, implementing query result caching with appropriate TTL values, and creating **database views** for complex recurring queries.

For high-traffic forums, consider implementing **read replicas** for carousel data queries and using queue jobs for intensive image processing tasks. Monitor query performance using Laravel's query logging and optimize based on actual usage patterns.

## Managing extension dependencies and compatibility

The extension depends on both Flarum core and FoF Upload, requiring careful version management. The `composer.json` file must specify minimum compatible versions using semantic versioning constraints. Implement **runtime checks** in the service provider to verify FoF Upload is installed and meets version requirements.

JavaScript dependencies include glide.js and Flarum's build tools. The `package.json` should use exact versions for build tools to ensure consistent compilation across environments. Implement **polyfills** for browser compatibility if targeting older browsers.

Version compatibility checks should happen during extension boot, throwing descriptive exceptions if requirements aren't met. Use Flarum's extension manager to check installed extension versions programmatically. Consider implementing **graceful degradation** when optional dependencies are missing.

Document all dependencies clearly in README files and installation guides. Provide **migration guides** for users upgrading from previous versions. Test compatibility with popular Flarum extensions to identify and resolve conflicts.

## Step-by-step implementation walkthrough

Begin by initializing the extension structure using Flarum CLI with `flarum-cli init vendor/image-carousel`. This creates the basic directory structure and configuration files. Next, configure `composer.json` with proper namespace autoloading and FoF Upload dependency. Set up the JavaScript build pipeline by installing NPM dependencies and configuring webpack.

Create the database migration defining the carousel_images table with appropriate columns and indexes. Implement the **Eloquent model** with relationships to posts and files. Build the service provider for dependency injection and boot-time configuration.

Develop the **image extraction service** that parses post content for FoF Upload references. Implement pattern matching for various BBCode formats and URL patterns. Create a caching layer to store extracted image lists with automatic invalidation on post updates.

Build the **carousel component** in TypeScript extending Flarum's Component class. Initialize glide.js in the oncreate lifecycle method with proper configuration. Implement navigation controls, thumbnail display, and responsive behavior. Add event handlers for slide changes and autoplay functionality.

Extend the **CommentPost component** to inject carousels into post display. Use the ItemList pattern to add carousel components with appropriate priority. Implement conditional rendering based on image availability.

Create **API endpoints** for carousel data retrieval and management. Implement controllers following Flarum's patterns with proper authorization. Build serializers to format carousel data for frontend consumption.

Style the carousel with LESS using Flarum's theme variables. Implement responsive breakpoints and touch interactions. Add loading states and error handling displays.

Test the extension thoroughly including unit tests for services and models, integration tests for API endpoints, and browser testing for frontend functionality. Use Flarum's testing utilities for database transactions and authentication mocking.

## Plugin configuration and customization options

Implement **admin panel settings** using Flarum's extension data API. Configuration options should include autoplay enablement and speed controls, thumbnail display toggles, transition effect selections, maximum images per carousel limits, and image sizing preferences.

Store settings using Flarum's settings repository with proper serialization. Implement **validation** for numeric ranges and boolean flags. Provide sensible defaults that work for most forums. Create **setting groups** for logical organization in the admin interface.

User preferences allow individual customization stored in the users table as JSON. Implement a **preferences modal** in the user settings area. Options might include autoplay override preferences, preferred transition speeds, and thumbnail visibility choices. Synchronize preferences with the frontend through user serializer attributes.

Advanced configuration could include **per-discussion settings** through discussion attributes, conditional display rules based on user groups, and custom CSS injection points for styling overrides. Implement **configuration presets** for common use cases like gallery mode, slideshow mode, or minimal display.

Consider implementing **webhook notifications** for carousel events and **analytics integration** for tracking carousel engagement. Provide **JSON schema** for configuration validation and IDE support.

## Performance optimization and best practices

Implement **progressive enhancement** starting with basic image display and adding carousel features when JavaScript loads. Use intersection observer API for lazy loading images entering the viewport. Implement **virtual scrolling** for carousels with many images.

Cache processed image lists at multiple levels including database query results, parsed post content, and rendered HTML fragments. Use **edge caching** for static carousel assets through CDN integration. Implement **cache warming** for popular discussions during off-peak hours.

Optimize images through FoF Upload's processing pipeline, generating **responsive image sets** with multiple resolutions. Use WebP format when browser support is available. Implement **placeholder images** with blurred low-resolution versions during loading.

Monitor performance metrics including time to first carousel render, image loading completion times, and memory usage patterns. Use **performance budgets** to prevent feature creep impacting load times. Implement **error boundaries** to prevent carousel failures from breaking post display.

Database optimization includes **query result pagination** for large image sets, index usage analysis and optimization, and implementing **soft deletes** for carousel data to maintain history. Consider **read-through caching** patterns for frequently accessed carousels.

## Deployment and maintenance considerations

Package the extension for distribution using **GitHub releases** with semantic versioning tags. Include compiled assets in releases to avoid build requirements for users. Create comprehensive documentation including installation guides, configuration references, and troubleshooting sections.

Implement **automated testing** through GitHub Actions including PHP unit tests, JavaScript component tests, and **end-to-end browser tests**. Set up continuous integration to validate pull requests. Use **code quality tools** like ESLint and PHP CodeSniffer for consistency.

Provide **migration scripts** for database schema updates between versions. Implement backward compatibility for at least one major version. Create **rollback procedures** for failed updates. Document breaking changes clearly in changelogs.

Monitor extension usage through **error tracking** services like Sentry. Implement **telemetry** for understanding feature usage patterns. Provide debug modes for troubleshooting user issues. Create **diagnostic commands** for checking extension health.

Maintain **compatibility matrices** documenting tested Flarum and FoF Upload versions. Set up automated compatibility testing for new Flarum releases. Participate in Flarum's extension ecosystem through community forums and documentation contributions.

This comprehensive implementation guide provides the technical foundation for building a robust image carousel plugin that seamlessly integrates with Flarum's architecture and FoF Upload's file management system. The combination of proper backend integration, modern frontend components, and attention to performance and user experience creates a valuable addition to any Flarum forum requiring rich media display capabilities.
