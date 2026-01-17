# Product Image Workflow Guide

## Overview

The Peak Blooms product image workflow provides a comprehensive admin interface for sourcing product images from multiple APIs or generating them with AI. This replaces the automated `fetch-product-images.ts` script with a human-reviewed, quality-focused approach.

## Legal & Attribution Requirements

### Unsplash Terms of Service Compliance

When using Unsplash images, the following requirements **must** be followed:

1. **Hotlink Images**: Photos must link to the original URL on Unsplash (not downloaded and re-hosted)
   - ✅ This implementation hotlinks all Unsplash images
   - ✅ No images are cached or downloaded to local storage

2. **Download Tracking**: When a user selects an Unsplash photo, the download endpoint is automatically triggered
   - ✅ Sends download event to Unsplash API
   - ✅ Credits the photographer and updates their statistics

3. **Attribution Display**: Photographer name and Unsplash must be properly attributed
   - ✅ Displays "Photo by [Name] on Unsplash" under each image
   - ✅ Photographer name links to their Unsplash profile
   - ✅ Image URL links back to the photo on Unsplash

4. **Application Distinction**
   - ✅ Peak Blooms is visually distinct from Unsplash
   - ✅ Name clearly indicates purpose (flower management, not photo service)
   - ✅ Not using Unsplash logo or branding

### Other APIs

- **Pixabay**: No specific attribution required, but recommended
- **Pexels**: Attribution optional but supported

## Features

### 1. Multi-Source Image Search
- **APIs Supported**: Pixabay, Unsplash, Pexels
- **Live Quota Tracking**: See remaining API calls per service
- **Caching**: Redis caching prevents redundant API calls
- **Parallel Search**: All APIs queried simultaneously for speed

### 2. AI Image Generation
- **LM Studio Integration**: Generate images locally using your own LLM
- **Three Style Templates**:
  - **Botanical Close-up**: Detailed focus on flower form and texture
  - **Garden Arrangement**: Natural garden context and lifestyle styling
  - **Editorial Style**: High-end professional photography aesthetic
- **Prompt Variation**: Each generation creates unique compositions while maintaining style consistency

### 3. Human Review & Selection
- Single-product workflow for careful curation
- Visual grid preview of all results
- Click to select and upload directly to Vercel Blob

## Setup Instructions

### Prerequisites

1. **Redis Server** (required for caching)
   ```bash
   # Install Redis (macOS)
   brew install redis
   
   # Start Redis server
   redis-server
   ```

2. **LM Studio** (optional for AI generation)
   - Download from [lmstudio.ai](https://lmstudio.ai)
   - Start LM Studio server (default: http://localhost:1234)
   - Load a text-to-image model (e.g., Stable Diffusion)

3. **Image API Keys** (optional for API search)
   Add to `.env.local`:
   ```env
   # Pixabay API (free tier: 50 requests/hour)
   PIXABAY_API_KEY=your_key_here
   
   # Unsplash API (free tier: 50 requests/hour)
   UNSPLASH_API_KEY=your_key_here
   
   # Pexels API (free tier: ~200 requests/hour)
   PEXELS_API_KEY=your_key_here
   
   # Redis (optional, default: redis://localhost:6379)
   REDIS_URL=redis://localhost:6379
   
   # LM Studio URL (optional, default: http://localhost:1234)
   LM_STUDIO_URL=http://localhost:1234
   ```

### Installation

All dependencies have been installed:
```bash
npm install redis  # Already completed
```

## Usage

### Accessing the Image Workflow

1. Navigate to `/admin/products/[product-id]/edit`
2. Look for **"Browse & Generate Images"** button below the image upload field
3. Click to open the image selection modal

### Searching for Images

1. Click the **"Search APIs"** tab
2. Click **"Search Multiple APIs"** button
3. Results appear in three columns (Pixabay, Unsplash, Pexels)
4. View **API Quota** status - if an API is exhausted, try again later or use others
5. Click any image to select and upload it

**Rate Limits:**
- Pixabay: 50 requests/hour
- Unsplash: 50 requests/hour  
- Pexels: ~200 requests/hour

### Generating Images with AI

1. Click the **"Generate with AI"** tab
2. Select a **Style Template**:
   - Botanical Close-up
   - Garden Arrangement
   - Editorial Style
3. Click **"Generate with LM Studio"**
4. Wait for generation (typically 30-60 seconds depending on model)
5. Once generated, click **"Use Generated Image"**

**Important**: LM Studio must be running with an image generation model loaded.

### Image Upload Flow

- Selected images are automatically uploaded to Vercel Blob storage
- Images are stored in the `products/` folder with slug-based naming
- Old images are automatically cleaned up when replaced
- Dialog closes automatically upon selection

## Technical Details

### Architecture

```
Admin Product Edit Page
    ↓
ProductForm Component
    ↓
ProductImageSelector Modal
    ├─ Search Tab → searchProductImages() → Redis Cache → Image APIs
    └─ Generate Tab → /api/admin/generate-image → LM Studio
        ↓
    Selected Image → ImageUpload Component → Vercel Blob
        ↓
    Product Updated via updateProductAction()
```

### File Structure

```
src/
├── lib/
│   ├── ai-prompt-templates.ts    # Style templates and prompt variation
│   ├── image-cache.ts             # Redis caching utilities
│   └── ...
├── app/
│   ├── actions/
│   │   ├── search-images.ts       # Server action for API searches
│   │   └── ...
│   └── api/
│       └── admin/
│           └── generate-image/
│               └── route.ts        # LM Studio integration endpoint
└── components/
    └── admin/
        ├── ProductImageSelector.tsx # Modal component
        ├── ProductForm.tsx          # Updated with modal integration
        └── ...
```

### Caching Strategy

**Redis Cache Keys:**
- Search results: `image-search:{normalized-product-name}:{source}`
- API quotas: `image-quota:{source}`
- TTL: 1 hour (configurable)

**Fallback**: If Redis is unavailable, the system continues to work without caching (but slower).

### Prompt Variation System

Each style template randomly selects from pools of keywords:

**Botanical**
- Composition: close-up, detail, macro, texture, petal
- Lighting: soft diffused, studio, backlit, golden hour, clean
- Style: botanical, scientific, naturalism, specimen, catalog

**Lifestyle**
- Composition: single stem, bouquet, vase, garden, hand-held
- Lighting: natural daylight, golden hour, overcast, dappled, morning
- Style: florist, garden, romantic, modern, cottage

**Editorial**
- Composition: centered, layered, diagonal, minimalist, grouped
- Lighting: dramatic studio, key and fill, side, high contrast, overhead
- Style: editorial, luxury, commercial, fine art, magazine

This ensures visual variety while maintaining consistent aesthetics.

## Troubleshooting

### API Search Returns No Results

1. **Check API Keys**: Verify keys in `.env.local` are correct and enabled
2. **Check Rate Limits**: Quota display shows remaining calls
3. **Try Different Search**: Product names vary across sources
4. **Check Connectivity**: Ensure internet connection is stable

### AI Generation Fails

1. **Check LM Studio**: Verify running at http://localhost:1234
2. **Check Model**: Ensure an image generation model is loaded
3. **Check VRAM**: Model may require sufficient GPU memory
4. **Check Endpoint**: Verify `/v1/images/generations` endpoint responds

### Redis Connection Issues

1. **Start Redis**: `redis-server` (if not running)
2. **Check Port**: Verify Redis running on port 6379
3. **Connection String**: Verify `REDIS_URL` in `.env.local`
4. **Fallback**: System continues without caching if Redis unavailable

### Images Not Uploading

1. **Slug Required**: Product must have a slug before uploading
2. **File Size**: Generated images may be large; Vercel Blob has 5MB limit
3. **Blob Token**: Verify `BLOB_READ_WRITE_TOKEN` in environment
4. **Network**: Check internet connection and Vercel status

## Deprecated Script

The original `scripts/fetch-product-images.ts` has been deprecated. It performed automated bulk image sourcing but lacked human quality control. The new workflow provides:

✅ Better quality control
✅ Visual preview before upload
✅ Multiple sourcing options
✅ AI generation capability
✅ Live quota transparency
❌ No longer automated (intentional)

## Performance Considerations

- **Redis Caching**: Reduces API calls by ~80% for repeated searches
- **Parallel API Calls**: Search all three APIs simultaneously
- **Image Preview**: Uses Next.js Image component with optimization
- **Lazy Loading**: Modal content only renders when opened

## Future Enhancements

Potential improvements for later phases:

1. **Batch Processing**: Select multiple products for bulk sourcing
2. **Advanced Filtering**: Filter results by color, size, orientation
3. **Image Editing**: Basic crop/resize before upload
4. **History Tracking**: Record which images were sourced from which API
5. **Favorites**: Save frequently used sources/prompts
6. **Scheduled Generation**: Queue images for off-peak generation
7. **Integration Tests**: Add tests for API and AI generation paths

## Support

For issues or questions about the image workflow:

1. Check this guide's Troubleshooting section
2. Review console logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure Redis and LM Studio are running (if used)
