'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });

      if (error) {
        toast({ title: 'Error', description: error.message, type: 'error' });
        return;
      }

      toast({ title: 'Password updated', description: 'You can now sign in with your new password.', type: 'success' });
      router.push('/login');
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

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Set new password</h2>
            <p className="text-sm text-zinc-500 mt-1">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('password')}
              type="password"
              label="New password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
            />
            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirm new password"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
