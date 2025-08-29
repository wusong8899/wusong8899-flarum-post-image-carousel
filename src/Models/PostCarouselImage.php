<?php

/*
 * This file is part of wusong8899/flarum-post-image-carousel.
 *
 * Copyright (c) 2025 wusong8899.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Wusong8899\Postimagecarousel\Models;

use Flarum\Database\AbstractModel;
use Flarum\Post\Post;
use FoF\Upload\File;

/**
 * @property int $id
 * @property int $post_id
 * @property string $file_uuid
 * @property int $order
 * @property string|null $caption
 * @property bool $is_active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property-read Post $post
 * @property-read File $file
 */
class PostCarouselImage extends AbstractModel
{
    protected $table = 'wusong8899_post_carousel_images';

    protected $fillable = [
        'post_id',
        'file_uuid',
        'order',
        'caption',
        'is_active',
    ];

    protected $casts = [
        'post_id' => 'integer',
        'order' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
    ];

    /**
     * Define relationship to Post
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Define relationship to FoF Upload File
     */
    public function file()
    {
        return $this->belongsTo(File::class, 'file_uuid', 'uuid');
    }

    /**
     * Scope to get active carousel images
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get images ordered by their display order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('created_at');
    }

    /**
     * Scope to get images for a specific post
     */
    public function scopeForPost($query, int $postId)
    {
        return $query->where('post_id', $postId);
    }
}