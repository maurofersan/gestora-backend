const VERSION_SEGMENT = /^v\d+$/;

/**
 * Cloudinary delivery URLs place transformation tokens (and optional version)
 * between `/upload/` and the folder/public_id path.
 */
function isCloudinaryTransformationOrVersionSegment(segment: string): boolean {
  if (VERSION_SEGMENT.test(segment)) return true;
  if (segment.includes(',')) return true;
  if (/^[a-z]{1,3}_[a-z0-9]/i.test(segment)) return true;
  if (/^(ar|bo|dpr|e|fl|g|l|o|r|t|x|y|z)_[^/]+$/i.test(segment)) return true;
  return false;
}

/**
 * Derives Cloudinary `public_id` (including folders) from a delivery URL.
 * Returns null for non-Cloudinary URLs or unparseable paths.
 */
export function extractCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('res.cloudinary.com')) {
      return null;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIdx = segments.indexOf('upload');
    if (uploadIdx < 0 || uploadIdx >= segments.length - 1) {
      return null;
    }

    let i = uploadIdx + 1;
    while (i < segments.length && isCloudinaryTransformationOrVersionSegment(segments[i])) {
      i += 1;
    }
    if (i >= segments.length) {
      return null;
    }

    const publicSegments = segments.slice(i);
    const lastIndex = publicSegments.length - 1;
    publicSegments[lastIndex] = publicSegments[lastIndex].replace(/\.[a-zA-Z0-9]+$/, '');
    const publicId = publicSegments.join('/');
    return publicId.length > 0 ? publicId : null;
  } catch {
    return null;
  }
}

/**
 * Collects unique public IDs from one or more delivery URLs.
 */
export function collectCloudinaryPublicIdsFromUrls(...urls: Array<string | null | undefined>): string[] {
  const ids = new Set<string>();
  for (const url of urls) {
    if (!url) continue;
    const publicId = extractCloudinaryPublicIdFromUrl(url);
    if (publicId) ids.add(publicId);
  }
  return [...ids];
}
