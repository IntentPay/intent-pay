import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ApplePayButton from '@/components/applePay/ApplePay';

export default function PageC() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PageC</CardTitle>
        <CardDescription>View PageC</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 使用 ApplePayButton 元件 */}
        <ApplePayButton amount="27.50" label="Demo (Card is not charged)" />
      </CardContent>
    </Card>
  );
}
