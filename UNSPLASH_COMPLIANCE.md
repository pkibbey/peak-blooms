# Unsplash Terms of Service Compliance Update

## Changes Made

The image workflow has been updated to fully comply with Unsplash's Terms of Service requirements for photo sourcing and usage.

### 1. Hotlinking Implementation ✅

**Requirement**: Photos must be hotlinked to the original image URL on Unsplash (not downloaded and re-hosted)

**Implementation**:
- All Unsplash image URLs are returned directly from the API (`photo.urls.regular`)
- Images are displayed directly from Unsplash's CDN
- No local caching or storage of Unsplash images
- Images are hotlinked in the modal preview and remain hotlinked when selected

**Code Changes**:
- [src/app/actions/search-images.ts](src/app/actions/search-images.ts): Added comment clarifying hotlink behavior
- [src/lib/image-cache.ts](src/lib/image-cache.ts): Extended ImageSearchResult interface with Unsplash-specific fields

### 2. Download Tracking ✅

**Requirement**: When a photo is used/downloaded, must trigger an event to the Unsplash download endpoint

**Implementation**:
- New server action: `triggerUnsplashDownload(downloadUrl)`
- Automatically called when user selects an Unsplash image
- Sends request to Unsplash's `/download_location` endpoint
- Credits the photographer and updates their download statistics
- Gracefully handles failures (doesn't block image selection)

**Code Changes**:
- [src/app/actions/search-images.ts](src/app/actions/search-images.ts): Added `triggerUnsplashDownload()` action
- [src/components/admin/ProductImageSelector.tsx](src/components/admin/ProductImageSelector.tsx): Calls action on image selection

### 3. Attribution Display ✅

**Requirement**: Photographer's full name and Unsplash must be properly attributed and linked

**Implementation**:
- Below each Unsplash image in search results, displays: "Photo by [Name] on Unsplash"
- Photographer name links to their Unsplash profile (`user.portfolio_url` or `user.links.html`)
- Full attribution text is visible and clickable
- Photographer gets proper credit and traffic

**Code Changes**:
- [src/components/admin/ProductImageSelector.tsx](src/components/admin/ProductImageSelector.tsx): Added attribution display with links
- [src/app/actions/search-images.ts](src/app/actions/search-images.ts): Extended UnsplashResponse type with photographer and profile URLs

### 4. Application Distinction ✅

**Requirement**: App must be visually distinct and not use Unsplash logo/branding

**Status**:
- ✅ Peak Blooms has its own branding and styling
- ✅ Not using any Unsplash logos
- ✅ Clear purpose (flower product management, not photo service)
- ✅ Fair use of Unsplash API as a sourcing tool, not competing service

## Technical Details

### New/Updated Types

```typescript
interface ImageSearchResult {
  url: string
  source: "pixabay" | "unsplash" | "pexels"
  title: string
  attribution: string
  width?: number
  height?: number
  // Unsplash-specific fields
  photographerUrl?: string      // Links to photographer's profile
  unsplashPhotoUrl?: string     // Links to photo on Unsplash
  downloadUrl?: string          // Download endpoint for tracking
}
```

### Data Flow for Unsplash Images

```
1. searchProductImages()
   ↓
2. searchUnsplash() API call
   ↓
3. Extract hotlinks and metadata (photographer, portfolio, download endpoint)
   ↓
4. Display in modal with attribution links
   ↓
5. User clicks image
   ↓
6. triggerUnsplashDownload() called
   ↓
7. Download endpoint triggered → photographer credited
   ↓
8. Image URL passed to ImageUpload component
   ↓
9. User confirms → image hotlink stored in database
```

### API Response Fields Used

From Unsplash API response:
- `photo.urls.regular` - Hotlinked image URL
- `photo.user.name` - Photographer name
- `photo.user.portfolio_url` - Photographer portfolio link
- `photo.user.links.html` - Photographer Unsplash profile
- `photo.links.html` - Photo on Unsplash link
- `photo.links.download_location` - Download endpoint for tracking

## Compliance Checklist

- [x] Images are hotlinked from Unsplash CDN
- [x] No local caching or re-hosting of Unsplash images
- [x] Download endpoint triggered on selection
- [x] Photographer name and Unsplash attributed
- [x] Attribution links to photographer and photo
- [x] Application is visually distinct
- [x] Unsplash logo not used
- [x] Fair use as content sourcing tool

## Documentation Updates

The main [docs/IMAGE_WORKFLOW.md](docs/IMAGE_WORKFLOW.md) now includes:

1. **Legal & Attribution Requirements** section
2. **Unsplash Terms of Service Compliance** details
3. Explanation of how hotlinking works
4. Download tracking mechanism documentation
5. Notes about other APIs (Pixabay, Pexels)

## Future Considerations

If production deployment is planned:

1. **Register with Unsplash**: Consider registering Peak Blooms as an Unsplash API application for official partnership
2. **Additional Attribution**: Optionally add visible Unsplash branding or links on product pages where Unsplash images are displayed
3. **Terms & Conditions**: Update app's Terms of Service to reflect image sourcing from Unsplash
4. **Privacy Policy**: Note data collection practices with Unsplash API

## Testing the Implementation

To verify compliance:

1. Go to `/admin/products/[id]/edit`
2. Click "Browse & Generate Images"
3. Search with "Search APIs" tab
4. View Unsplash results - should show photographer attribution
5. Click any Unsplash image - should see attribution with links
6. Selection triggers download endpoint automatically
7. Check Unsplash photographer profile to confirm download was logged

## Files Modified

- `src/lib/image-cache.ts` - Extended ImageSearchResult interface
- `src/app/actions/search-images.ts` - Added download tracking action, updated Unsplash search, extended types
- `src/components/admin/ProductImageSelector.tsx` - Added attribution display and download tracking
- `docs/IMAGE_WORKFLOW.md` - Added compliance documentation
