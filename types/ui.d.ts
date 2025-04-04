declare module '@/components/ui/toast/use-toast' {
  interface ToastProps {
    variant?: 'default' | 'destructive';
    title?: string;
    description?: string;
  }

  interface ToastActionElement {
    altText: string;
    onClick: () => void;
    children: React.ReactNode;
  }

  interface ToastOptions extends ToastProps {
    id?: string;
  }

  type Toast = ToastOptions;

  interface UseToastReturn {
    toast: (props: Toast) => void;
    dismiss: (toastId?: string) => void;
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
