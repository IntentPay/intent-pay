declare module '@/components/ui/toast/use-toast' {
  import * as React from 'react';
  import { ToastAction } from '@/components/ui/toast/toast';
  
  interface ToastProps {
    variant?: 'default' | 'destructive';
    title?: string;
    description?: string;
    duration?: number;
  }

  type ToastActionElement = React.ReactElement<typeof ToastAction>;

  interface ToastOptions extends ToastProps {
    id?: string;
    action?: React.ReactNode;
  }

  type Toast = ToastOptions;

  interface UseToastReturn {
    toast: (props: Toast) => void;
    dismiss: (toastId?: string) => void;
    toasts: Toast[];
  }

  export function useToast(): UseToastReturn;
}

declare module '@/components/ui/label' {
  import * as React from 'react';

  interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    htmlFor?: string;
  }

  export const Label: React.FC<LabelProps>;
}
