const CLOUDINARY_UPLOAD_SEGMENT = /\/upload\/(?:[^/]+\/)*(?:v\d+\/)?([^/]+(?:\/[^/]+)*)\.[a-zA-Z0-9]+$/;

/**
 * Derives Cloudinary `public_id` from a delivery URL (image/video/raw).
 * Returns null for non-Cloudinary URLs or unparseable paths.
 */
export function extractCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('res.cloudinary.com')) {
      return null;
    }
    const match = parsed.pathname.match(CLOUDINARY_UPLOAD_SEGMENT);
    return match?.[1] ?? null;
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
