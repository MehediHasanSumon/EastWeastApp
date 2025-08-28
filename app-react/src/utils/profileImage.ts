/**
 * Utility functions for handling profile images
 */

// Default fallback avatar URL
export const DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=30";

// Get the server base URL from environment or use current origin
const getServerBaseUrl = (): string => {
  // In development, use the current origin (localhost:3000)
  // In production, you might want to use an environment variable
  if (process.env.NODE_ENV === 'development') {
    return window.location.origin;
  }
  
  // For production, you can set this in your environment variables
  return process.env.REACT_APP_API_BASE_URL || window.location.origin;
};

/**
 * Get profile image URL with fallback
 * @param profilePicture - The user's profile picture URL
 * @param userName - The user's name for fallback avatar generation
 * @returns The profile picture URL or a fallback
 */
export const getProfileImageUrl = (profilePicture?: string | null, userName?: string): string => {
  if (profilePicture) {
    // If it's already a full URL, return as is
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }
    
    // If it's a relative path (e.g., /uploads/avatars/filename.jpg), construct full URL
    if (profilePicture.startsWith('/')) {
      return `${getServerBaseUrl()}${profilePicture}`;
    }
    
    // If it's just a filename, construct the full path
    return `${getServerBaseUrl()}/uploads/avatars/${profilePicture}`;
  }
  
  if (userName) {
    // Generate a fallback avatar based on the user's name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff&size=150`;
  }
  
  return DEFAULT_AVATAR;
};

/**
 * Handle profile image load error with fallback
 * @param event - The error event from the img element
 * @param fallbackUrl - The fallback URL to use
 */
export const handleProfileImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl: string = DEFAULT_AVATAR) => {
  const img = event.target as HTMLImageElement;
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl;
  }
};

/**
 * Check if a profile image URL is valid
 * @param url - The URL to check
 * @returns True if the URL is valid
 */
export const isValidProfileImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If it's a relative path, consider it valid
    return url.startsWith('/');
  }
};
