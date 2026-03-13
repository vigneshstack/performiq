'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BarChart2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(data: SignupForm) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({ title: 'Sign up failed', description: error.message, type: 'error' });
        return;
      }

      setSuccess(true);
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
            <div>
              <h1 className="text-xl font-bold text-zinc-900">PerformIQ</h1>
              <p className="text-xs text-zinc-500">Employee Assessment Platform</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h2>
              <p className="text-sm text-zinc-500 mb-6">
                We sent a confirmation link to your email address. Click the link to activate your account.
              </p>
              <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900">Create an account</h2>
                <p className="text-sm text-zinc-500 mt-1">Get started with PerformIQ</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  {...register('fullName')}
                  label="Full name"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  error={errors.fullName?.message}
                />
                <Input
                  {...register('email')}
                  type="email"
                  label="Email address"
                  placeholder="you@company.com"
                  autoComplete="email"
                  error={errors.email?.message}
                />
                <Input
                  {...register('password')}
                  type="password"
                  label="Password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  error={errors.password?.message}
                />
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  label="Confirm password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                />

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Create account
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-zinc-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
