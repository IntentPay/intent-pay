'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEthereumAddress } from '@/lib/utils';

// Form validation schema
const sendFormSchema = z.object({
  recipient: z.string().refine(val => isValidEthereumAddress(val), {
    message: "Invalid Ethereum address",
  }),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
});

type SendFormValues = z.infer<typeof sendFormSchema>;

interface SendFormProps {
  onSend: (recipient: string, amount: string) => Promise<void>;
  maxAmount?: string;
  onCancel?: () => void;
}

export function SendForm({ onSend, maxAmount = '0', onCancel }: SendFormProps) {
  const [values, setValues] = useState<Partial<SendFormValues>>({
    recipient: '',
    amount: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof SendFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof SendFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      sendFormSchema.parse(values);
      
      // If validation passes, attempt to send
      setIsSubmitting(true);
      
      if (values.recipient && values.amount) {
        await onSend(values.recipient, values.amount);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod errors into a more usable format
        const newErrors: Partial<Record<keyof SendFormValues, string>> = {};
        
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const field = err.path[0] as keyof SendFormValues;
            newErrors[field] = err.message;
          }
        });
        
        setErrors(newErrors);
      } else {
        console.error('Error submitting form:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Send USDC</CardTitle>
        <CardDescription>Send USDC to any Ethereum address without paying gas fees</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={values.recipient || ''}
              onChange={(e) => handleChange('recipient', e.target.value)}
              className={errors.recipient ? "border-red-500" : ""}
            />
            {errors.recipient && (
              <p className="text-sm text-red-500">{errors.recipient}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount</Label>
              <span className="text-sm text-gray-500">
                Available: {maxAmount} USDC
              </span>
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              max={maxAmount.toString()}
              value={values.amount || ''}
              onChange={(e) => handleChange('amount', e.target.value)}
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send USDC'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
