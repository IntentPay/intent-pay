'use client';

/**
 * Signs out the user by clearing the World ID verification status
 * and redirecting to the specified URL
 */
export function signOut(redirectTo = '/') {
  // Clear World ID verification status
  localStorage.removeItem('worldid_verified');
  
  // Redirect to the specified URL
  window.location.href = redirectTo;
}
