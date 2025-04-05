'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { signOut, clearWalletAuth } from '@/lib/auth-utils';
import { LogOut, Settings, HelpCircle, RefreshCw } from 'lucide-react';
import { useMiniKit } from '@/lib/minikit-provider';
import { Web3Avatar } from '@/components/wallet/Web3Avatar';
import { useToast } from '@/components/ui/use-toast';

// 定義用戶類型
interface WorldIDUser {
  worldId: string;
  username: string;
  address: string;
}

export function User() {
  const [user, setUser] = useState<WorldIDUser | null>(null);
  const miniKit = useMiniKit();
  const { toast } = useToast();
  
  // 從 localStorage 和 MiniKit 獲取用戶數據
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // 嘗試從 localStorage 獲取 World ID 用戶
        const userData = localStorage.getItem('worldid_user');
        if (userData) {
          setUser(JSON.parse(userData));
        } else if (miniKit.walletAddress) {
          // 如果沒有 World ID 但有錢包地址，使用錢包信息
          setUser({
            worldId: miniKit.worldId || '',
            username: miniKit.username || 'Wallet User',
            address: miniKit.walletAddress
          });
        } else {
          // 嘗試從本地儲存獲取錢包地址
          const walletAddress = localStorage.getItem('wallet_address');
          if (walletAddress) {
            setUser({
              worldId: '',
              username: 'Wallet User',
              address: walletAddress
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }, [miniKit]);

  // 截斷地址顯示
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
          {user?.address ? (
            <Web3Avatar address={user.address} size="md" />
          ) : (
            <Image
              src={'/placeholder-user.jpg'}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {user?.username || 'My Account'}
          {user?.worldId && (
            <div className="text-xs text-green-600 mt-1">
              World ID 已驗證
            </div>
          )}
          {user?.address && (
            <div className="text-xs text-muted-foreground mt-1">
              {truncateAddress(user.address)}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/setting" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            href="https://docs.world.org/world-chain"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Support
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut('/')}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out (Clear Verification)</span>
        </DropdownMenuItem>
        {user?.address && (
          <DropdownMenuItem 
            onClick={() => clearWalletAuth(() => 
              toast({
                title: "錢包授權已重置",
                description: "下次登入時將需要重新授權錢包。",
              })
            )}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>重置錢包授權</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
