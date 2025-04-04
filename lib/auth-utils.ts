'use client';

/**
 * Signs out the user by clearing the World ID verification status
 * and redirecting to the specified URL
 */
export function signOut(redirectTo = '/') {
  // clean all localStorage
  localStorage.clear();

  // Redirect to the specified URL
  window.location.href = redirectTo;
}
