'use client';

import { useState } from 'react';
import {
  Circle,
  CreditCard,
  Home,
  LineChart,
  Locate,
  Package,
  Package2,
  PanelLeft,
  Settings,
  ShoppingCart,
  Users2,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

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
import { VercelLogo } from '@/components/icons';
import Providers from './providers';
import { NavItem } from './nav-item';
import { SearchInput } from './search';
import { Toaster } from '@/components/ui/toaster';
import MiniKitProvider from '@/lib/minikit-provider';
import { VerificationGate } from '@/components/worldid/VerificationGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider>
      <Providers>
        <VerificationGate>
          <main className="flex min-h-screen w-full flex-col bg-muted/40">
            <DesktopNav />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <MobileNav />
                <DashboardBrandHeader />
                <SearchInput />
                <User />
              </header>
              <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-muted/40">{children}</main>
            </div>
            <Toaster />
            <MobileBottomNav />
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
          href="https://docs.world.org/world-chain"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <VercelLogo className="h-3 w-3 transition-all group-hover:scale-110" />
          <span className="sr-only">IntentPay Team</span>
        </Link>

        <NavItem href="/analytics" label="Dashboard">
          <Home className="h-5 w-5" />
        </NavItem>

        <NavItem href="/pageA" label="PageA">
          <ShoppingCart className="h-5 w-5" />
        </NavItem>

        <NavItem href="/pageB" label="World Payment">
          <Package className="h-5 w-5" />
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
            href="https://docs.world.org/world-chain"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">IntentPay Team</span>
          </Link>
          <Link
            href="/analytics"
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
            <Package className="h-5 w-5" />
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
    <div className="flex items-center gap-4">
      <img src="/assets/IntentPay_header.jpg" alt="IntentPay Logo" className="h-10 w-auto rounded shadow-md" />

      <div className="hidden md:flex flex-col">
        <p className="text-sm text-muted-foreground -mt-1 text-center line-clamp-2">
          Driven by Purpose Powered by Simplicity
        </p>
      </div>
    </div>
  );
}

/**
 * Bottom Navigation Bar
 */
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-16 max-w-md items-center justify-around rounded-t-xl border-t bg-white shadow-lg sm:hidden">
      <button className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
        <Home className="w-5 h-5" />
        <span className="text-xs">Home</span>
      </button>

      <button className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
        <Wallet className="w-5 h-5" />
        <span className="text-xs">Wallet</span>
      </button>

      {/* 中間 Logo */}
      <div className="flex h-12 w-12 -mt-10 items-center justify-center rounded-full border bg-white shadow-md">
        <Circle className="h-6 w-6 text-indigo-600" />
      </div>

      <button className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
        <Locate className="w-5 h-5" />
        <span className="text-xs">Track</span>
      </button>

      <button className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
        <CreditCard className="w-5 h-5" />
        <span className="text-xs">Card</span>
      </button>
    </nav>
  );
}
