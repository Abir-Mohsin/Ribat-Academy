
export function getDriveId(url: string): string | null {
  if (!url) return null;
  // Handles /d/ID/view (standard sharing link)
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch) return dMatch[1];
  
  // Handles open?id=ID or uc?id=ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

export function getDownloadUrl(url: string): string {
  if (!url) return '';
  const id = getDriveId(url);
  // Using lh3.googleusercontent.com/d/ID is a highly reliable way to embed Drive images
  // It handles permissions better in some contexts and bypasses common cookie/header issues.
  return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
}

export function getThumbnailUrl(url: string): string {
  const id = getDriveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w320` : url;
}
