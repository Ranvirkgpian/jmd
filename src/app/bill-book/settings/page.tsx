'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBill } from '@/contexts/BillContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SettingsFormValues {
  company_name: string;
  company_logo: string;
  company_address: string;
  company_mobile: string;
  company_email: string;
  company_gst: string;
  payment_methods: string; // Comma separated for input
  footer_message: string;
}

export default function BillSettingsPage() {
  const { settings, loadingSettings, updateSettings } = useBill();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SettingsFormValues>();

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || '',
        company_logo: settings.company_logo || '',
        company_address: settings.company_address || '',
        company_mobile: settings.company_mobile || '',
        company_email: settings.company_email || '',
        company_gst: settings.company_gst || '',
        payment_methods: settings.payment_methods?.join(', ') || 'Cash, UPI',
        footer_message: settings.footer_message || '',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true);
    try {
      await updateSettings({
        company_name: data.company_name,
        company_logo: data.company_logo,
        company_address: data.company_address,
        company_mobile: data.company_mobile,
        company_email: data.company_email,
        company_gst: data.company_gst,
        payment_methods: data.payment_methods.split(',').map(s => s.trim()).filter(Boolean),
        footer_message: data.footer_message,
      });
      toast({
        title: "Settings Updated",
        description: "Your bill book settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div className="flex items-center gap-4">
        <Link href="/bill-book">
          <Button variant="ghost" size="icon" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your company details for invoices.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>These details will appear on the generated bills.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" {...form.register('company_name', { required: true })} placeholder="JMD ENTERPRISES" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_gst">GST No. (Optional)</Label>
                <Input id="company_gst" {...form.register('company_gst')} placeholder="GSTIN..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_mobile">Mobile Number</Label>
                <Input id="company_mobile" {...form.register('company_mobile')} placeholder="+91..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">Email (Optional)</Label>
                <Input id="company_email" {...form.register('company_email')} placeholder="info@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address">Address</Label>
              <Textarea id="company_address" {...form.register('company_address')} placeholder="Shop address..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_logo">Logo URL</Label>
              <Input id="company_logo" {...form.register('company_logo')} placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Enter a public URL for your logo image.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_methods">Payment Methods</Label>
              <Input id="payment_methods" {...form.register('payment_methods')} placeholder="Cash, UPI, Card" />
              <p className="text-xs text-muted-foreground">Comma separated values (e.g. Cash, UPI)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_message">Footer Message</Label>
              <Textarea id="footer_message" {...form.register('footer_message')} placeholder="Terms and conditions..." className="h-24" />
              <p className="text-xs text-muted-foreground">This message will appear at the bottom of the bill. Supports Hindi and English.</p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
