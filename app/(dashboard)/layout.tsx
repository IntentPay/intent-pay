'use client';

import { useState } from 'react';
import {
  Home,
  CreditCard,
  DollarSign,
  LineChart,
  Circle,
  PanelLeft,
  Settings,
  ShoppingCart,
  Users2,
  Wallet,
  Locate
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from './user';
import Providers from './providers';
import { NavItem } from './nav-item';
import { Toaster } from '@/components/ui/toaster';
import MiniKitProvider, { useMiniKit } from '@/lib/minikit-provider';
import { VerificationGate } from '@/components/worldid/VerificationGate';
import { cn } from '@/lib/utils';
import { QRScannerModal } from '@/components/qr/QRScanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // 關閉 QR 掃描器的處理函數
  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
  };
  
  return (
    <MiniKitProvider>
      <Providers>
        <VerificationGate>
          <main className="flex min-h-screen w-full flex-col bg-muted/40">
            <DesktopNav />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
              <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <MobileNav />
                <DashboardBrandHeader />
                <div className="ml-auto flex w-full items-center justify-end gap-2">
                  <User />
                </div>
              </header>
              <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-muted/40">{children}</main>
            </div>
            <MobileBottomNav onOpenQRScanner={() => setShowQRScanner(true)} />
            <Toaster />
            {showQRScanner && <QRScannerModal onClose={handleCloseQRScanner} />}
          </main>
        </VerificationGate>
      </Providers>
    </MiniKitProvider>
  );
}

function DesktopNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <img src="/assets/logo.png" alt="IntentPay Logo" className="h-10 w-auto rounded shadow-md" />
          <span className="sr-only">IntentPay Team</span>
        </Link>

        <NavItem href="/" label="Dashboard">
          <Home className="h-5 w-5" />
        </NavItem>

        <NavItem href="/pageA" label="PageA">
          <ShoppingCart className="h-5 w-5" />
        </NavItem>

        <NavItem href="/pageB" label="World Payment">
          <DollarSign className="h-5 w-5" />
        </NavItem>

        <NavItem href="/pageC" label="PageC">
          <Users2 className="h-5 w-5" />
        </NavItem>

        <NavItem href="#" label="Analytics">
          <LineChart className="h-5 w-5" />
        </NavItem>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
}

function MobileNav() {
  const [openMobileNav, setOpenMobileNav] = useState(false);

  const handleLinkClick = () => {
    setOpenMobileNav(false);
  };

  return (
    <Sheet open={openMobileNav} onOpenChange={setOpenMobileNav}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        {/* className="sr-only" will not display but still work with "aria-labelledby" */}
        <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <img src="/assets/logo.png" alt="IntentPay Logo" className="h-10 w-auto rounded shadow-md" />
            <span className="sr-only">IntentPay Team</span>
          </Link>
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/pageA"
            onClick={handleLinkClick}
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
            PageA
          </Link>
          <Link href="/pageB" onClick={handleLinkClick} className="flex items-center gap-4 px-2.5 text-foreground">
            <DollarSign className="h-5 w-5" />
            World Payment
          </Link>
          <Link
            href="/pageC"
            onClick={handleLinkClick}
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Users2 className="h-5 w-5" />
            PageC
          </Link>
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LineChart className="h-5 w-5" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function DashboardBreadcrumb() {
  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="#">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="#">tree1</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>tree2</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DashboardBrandHeader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Link href="/" className="flex items-center">
        <img src="/assets/IntentPay_header.jpg" alt="IntentPay Logo" className="h-10 md:h-12 w-auto rounded shadow-md object-contain" />
      </Link>

      <div className="hidden md:flex flex-col ml-3">
        <p className="text-sm text-muted-foreground text-center line-clamp-2">
          Driven by Purpose Powered by Simplicity
        </p>
      </div>
    </div>
  );
}

interface MobileBottomNavProps {
  onOpenQRScanner: () => void;
}

function MobileBottomNav({ onOpenQRScanner }: MobileBottomNavProps) {
  const pathname = usePathname();
  const miniKit = useMiniKit();
  
  // 處理掃描QR碼按鈕點擊
  const handleScanClick = async () => {
    try {
      // 重置先前的授權狀態，確保每次都顯示確認視窗
      localStorage.removeItem('wallet_auth_data');
      localStorage.removeItem('wallet_auth_signed_in');
      localStorage.removeItem('wallet_address');
      
      // 打開 QR 掃描器
      onOpenQRScanner();
    } catch (error) {
      console.error('Error handling scan click:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/intent-pay', label: 'Intent Pay', icon: CreditCard },
    { href: '/pageB', label: 'World Pay', icon: DollarSign },
    { href: '/setting', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-16 max-w-md items-center justify-around sm:hidden',
        'rounded-t-xl border-t',
        "bg-[url('/assets/brushed-alum.png')]",
        'bg-[#d1c4d5c4]',
        'bg-cover bg-no-repeat bg-center',
        'shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_2px_5px_rgba(0,0,0,0.08)]',
        'backdrop-blur-sm backdrop-saturate-150 border-zinc-300 px-4'
      )}
    >
      {navItems.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center px-2 py-1 transition-all',
              'rounded-md text-xs',
              active
                ? 'bg-gray-200 text-black shadow-inner font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:shadow'
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5', active ? 'text-indigo-600' : '')} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Middle Logo - 添加點擊處理 */}
      <button 
        onClick={handleScanClick}
        className="flex h-12 w-12 -mt-10 items-center justify-center rounded-full border bg-white shadow-md hover:bg-gray-50 active:shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        aria-label="掃描 QR 碼並重置錢包授權"
        title="掃描 QR 碼並重置錢包授權"
      >
        <Circle className="h-6 w-6 text-indigo-600" />
        <span className="sr-only">掃描 QR 碼</span>
      </button>

      {navItems.slice(2).map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center px-2 py-1 transition-all',
              'rounded-md text-xs',
              active
                ? 'bg-gray-200 text-black shadow-inner font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:shadow'
            )}
          >
            <Icon className={cn('w-5 h-5 mb-0.5', active ? 'text-indigo-600' : '')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
