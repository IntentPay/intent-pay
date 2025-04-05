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

/**
 * 清除錢包授權狀態
 * 這將使錢包在下次登入時需要重新確認
 */
export function clearWalletAuth(showToast?: () => void) {
  // 移除所有與錢包授權相關的數據
  localStorage.removeItem('wallet_auth_data');
  localStorage.removeItem('wallet_auth_signed_in');
  localStorage.removeItem('wallet_address'); // 重要：這是儲存地址的鍵
  localStorage.removeItem('wallet_auth_username');
  localStorage.removeItem('wallet_auth_profile_picture');
  
  // 如果提供了 toast 通知函數，顯示成功消息
  if (showToast) {
    showToast();
  }
  
  // 重新載入頁面以確保狀態完全重置
  window.location.reload();
}
