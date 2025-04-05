'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Web3AvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
}

// 從地址生成漸變顏色
export function getGradientColors(address: string): string[] {
  const seedArr = address.match(/.{1,7}/g)?.splice(0, 5) || [];
  const colors: string[] = [];

  seedArr.forEach((seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }

    const rgb = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 255;
      rgb[i] = value;
    }
    colors.push(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  });

  // 確保有 5 種顏色（如果地址太短）
  while (colors.length < 5) {
    colors.push(`rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`);
  }

  return colors;
}

// 設置頭像樣式
function applyAvatarStyle(element: HTMLElement, address: string): void {
  const colors = getGradientColors(address);
  
  // 設置基本樣式
  element.style.borderRadius = '50%';
  element.style.boxShadow = 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)';
  element.style.backgroundColor = colors[0];
  
  // 設置漸變背景
  element.style.backgroundImage = `
    radial-gradient(at 66% 77%, ${colors[1]} 0px, transparent 50%),
    radial-gradient(at 29% 97%, ${colors[2]} 0px, transparent 50%),
    radial-gradient(at 99% 86%, ${colors[3]} 0px, transparent 50%),
    radial-gradient(at 29% 88%, ${colors[4]} 0px, transparent 50%)
  `;
}

export function Web3Avatar({ address, size = 'md', className }: Web3AvatarProps) {
  const avatarRef = useRef<HTMLDivElement>(null);
  
  // 根據尺寸設置類名
  const getSizeClass = () => {
    if (typeof size === 'number') {
      return `h-[${size}px] w-[${size}px]`;
    }
    
    return {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12'
    }[size];
  };
  
  // 當地址變更時應用樣式
  useEffect(() => {
    if (avatarRef.current && address) {
      applyAvatarStyle(avatarRef.current, address);
    }
  }, [address]);
  
  return (
    <div 
      ref={avatarRef}
      className={cn(getSizeClass(), 'inline-block', className)}
      data-address={address.slice(0, 8)}
    />
  );
}

// 提供一個直接操作DOM的函數，與用戶提供的代碼對應
export function createAvatar(element: HTMLElement | string, address: string) {
  const avatar = typeof element === 'string' ? document.querySelector(element) as HTMLElement : element;
  if (!avatar) {
    throw new Error('Avatar element not found');
  }
  applyAvatarStyle(avatar, address);
}

export default Web3Avatar;
