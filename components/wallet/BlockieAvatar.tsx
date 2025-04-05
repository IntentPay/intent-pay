'use client';

import React, { useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import styles from './blockie-avatar.module.css';
import { cn } from '@/lib/utils';

// 從地址生成顏色的函數
function generateColors(address: string): { backgroundColor: string, patternColor: string, borderColor: string } {
  // 確保地址有值，如果沒有，使用預設字串
  const addr = address || '0x0000000000000000000000000000000000000000';
  
  // 提取地址的各個部分來生成顏色
  const hash = addr.toLowerCase().replace(/^0x/i, '');
  
  // 生成背景顏色（使用地址的前6個字符）
  const bgColor = `#${hash.substring(0, 6)}`;
  
  // 生成圖案顏色（使用地址的中間6個字符）
  const patternColor = `#${hash.substring(14, 20)}`;
  
  // 生成邊框顏色（使用地址的最後6個字符）
  const borderColor = `#${hash.substring(hash.length - 6)}`;
  
  return {
    backgroundColor: bgColor,
    patternColor: patternColor,
    borderColor: borderColor
  };
}

// 生成圖案的函數
function generatePattern(address: string): React.ReactNode {
  // 將地址轉換為數字數組，用於決定圖案
  const addr = address || '0x0000000000000000000000000000000000000000';
  const hash = addr.toLowerCase().replace(/^0x/i, '');
  
  // 將地址分割成5x5的網格
  const grid = [];
  for (let i = 0; i < 5; i++) {
    const row = [];
    for (let j = 0; j < 5; j++) {
      // 使用地址的不同部分來決定是否顯示方塊
      const index = i * 5 + j;
      const hexPair = hash.substring(index * 2, index * 2 + 2) || '00';
      const value = parseInt(hexPair, 16);
      // 只有值大於128的才顯示圖案（50%機率）
      row.push(value > 128);
    }
    grid.push(row);
  }
  
  // 生成對稱的圖案（左右對稱）
  const symmetricGrid = grid.map(row => {
    const half = Math.ceil(row.length / 2);
    const leftHalf = row.slice(0, half);
    const rightHalf = [...leftHalf].reverse().slice(half > 2 ? 1 : 0);
    return [...leftHalf, ...rightHalf];
  });
  
  return (
    <div className={styles.pattern}>
      {symmetricGrid.flat().map((show, index) => (
        <div 
          key={index} 
          className={cn(
            styles.patternCell,
            show ? styles.patternCellVisible : styles.patternCellHidden
          )}
        />
      ))}
    </div>
  );
}

interface BlockieAvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BlockieAvatar({ address, size = 'md', className = '' }: BlockieAvatarProps) {
  // 根據地址生成顏色
  const colors = useMemo(() => generateColors(address), [address]);
  
  // 創建包含顏色的自定義屬性
  const blockieClassNames = useMemo(() => {
    const blockieElement = document.createElement('div');
    blockieElement.style.setProperty('--bg-color', colors.backgroundColor);
    blockieElement.style.setProperty('--border-color', colors.borderColor);
    blockieElement.style.setProperty('--pattern-color', colors.patternColor);
    
    // 生成綜合 CSS 類名
    return cn(
      styles[size],
      styles.blockie,
      className
    );
  }, [colors, size, className]);
  
  // 將動態顏色應用為自定義 CSS 屬性
  useEffect(() => {
    // 查找最近的 blockie 元素，並設置 CSS 自定義屬性
    const blockieElements = document.querySelectorAll(`.${styles.blockie}`);
    blockieElements.forEach(el => {
      (el as HTMLElement).style.setProperty('--bg-color', colors.backgroundColor);
      (el as HTMLElement).style.setProperty('--border-color', colors.borderColor);
      (el as HTMLElement).style.setProperty('--pattern-color', colors.patternColor);
    });
  }, [colors]);
  
  return (
    <div className={blockieClassNames} data-address={address.substring(0, 8)}>
      <Avatar className="h-full w-full">
        <div className={styles.blockieInner}>
          {generatePattern(address)}
        </div>
        <AvatarFallback className="bg-transparent">
          <User className="h-4 w-4 text-white" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
