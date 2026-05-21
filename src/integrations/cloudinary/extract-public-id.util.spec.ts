import {
  collectCloudinaryPublicIdsFromUrls,
  extractCloudinaryPublicIdFromUrl,
} from './extract-public-id.util';

describe('extractCloudinaryPublicIdFromUrl', () => {
  it('includes folder path after version', () => {
    expect(
      extractCloudinaryPublicIdFromUrl(
        'https://res.cloudinary.com/demo/image/upload/v1747654321/gestora/abc.jpg',
      ),
    ).toBe('gestora/abc');
  });

  it('includes nested folders without version', () => {
    expect(
      extractCloudinaryPublicIdFromUrl(
        'https://res.cloudinary.com/demo/image/upload/gestora/projects/a/b.jpg',
      ),
    ).toBe('gestora/projects/a/b');
  });

  it('skips transformation segments', () => {
    expect(
      extractCloudinaryPublicIdFromUrl(
        'https://res.cloudinary.com/demo/image/upload/c_fill,w_200/v1747654321/gestora/abc.jpg',
      ),
    ).toBe('gestora/abc');
  });

  it('returns null for non-cloudinary hosts', () => {
    expect(extractCloudinaryPublicIdFromUrl('https://cdn.example.com/a.jpg')).toBeNull();
  });
});

describe('collectCloudinaryPublicIdsFromUrls', () => {
  it('deduplicates ids from url and thumb', () => {
    const ids = collectCloudinaryPublicIdsFromUrls(
      'https://res.cloudinary.com/demo/image/upload/gestora/a.jpg',
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_100/gestora/a.jpg',
    );
    expect(ids).toEqual(['gestora/a']);
  });
});
