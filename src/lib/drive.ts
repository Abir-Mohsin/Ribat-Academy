
export function getDriveId(url: string): string | null {
  if (!url) return null;
  // Handles /d/ID/view or just URLs ending in ID
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getDownloadUrl(url: string): string {
  const id = getDriveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

export function getThumbnailUrl(url: string): string {
  const id = getDriveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w320` : url;
}
