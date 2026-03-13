'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, type: 'error' });
        return;
      }

      setSent(true);
    } catch {
      toast({ title: 'An unexpected error occurred', type: 'error' });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-xl">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">PerformIQ</span>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4">
                <Mail className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h2>
              <p className="text-sm text-zinc-500 mb-6">
                If an account with that email exists, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900">Reset your password</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email address"
                  placeholder="you@company.com"
                  autoComplete="email"
                  error={errors.email?.message}
                />
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Send reset link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-700">
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
