import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { ProductArt } from '@/components/ProductArt';

const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Enter your password') });
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register: signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === 'login';

  const form = useForm<{ name?: string; email: string; password: string }>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const { errors } = form.formState;

  if (user) return <Navigate to={from} replace />;

  const onSubmit = form.handleSubmit(async (v) => {
    setSubmitting(true);
    try {
      const u = isLogin ? await login(v.email, v.password) : await signup(v.name!, v.email, v.password);
      toast.success(isLogin ? `Welcome back, ${u.name.split(' ')[0]}` : 'Your account is ready');
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  });

  const fillDemo = (email: string, password: string) => {
    form.setValue('email', email);
    form.setValue('password', password);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-4xl font-extrabold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-muted">{isLogin ? 'Sign in to check out faster and track your orders.' : 'Save products, check out faster and track every order.'}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {!isLogin && (
              <Field label="Full name" error={errors.name?.message} htmlFor="name">
                <Input id="name" autoComplete="name" invalid={!!errors.name} {...form.register('name')} />
              </Field>
            )}
            <Field label="Email" error={errors.email?.message} htmlFor="email">
              <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...form.register('email')} />
            </Field>
            <Field label="Password" error={errors.password?.message} htmlFor="password" hint={isLogin ? undefined : 'At least 8 characters'}>
              <Input id="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} invalid={!!errors.password} {...form.register('password')} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={submitting}>{isLogin ? 'Sign in' : 'Create account'}</Button>
          </form>

          {isLogin && (
            <div className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm">
              <p className="font-semibold">Try the demo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="chip" onClick={() => fillDemo('demo@shopcart.dev', 'Demo@1234')}>Shopper account</button>
                <button type="button" className="chip" onClick={() => fillDemo('admin@shopcart.dev', 'Admin@123')}>Admin account</button>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted">
            {isLogin ? "New to ShopCart? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} state={location.state} className="font-semibold text-brand-600 hover:underline">
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_30%,rgba(255,90,31,.5),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-end gap-8 p-14 text-white">
          <div className="grid grid-cols-3 gap-4">
            {[['headphones', '#FF5A1F'], ['watch', '#10B981'], ['camera', '#F97316'], ['keyboard', '#EF4444'], ['gamepad', '#8B5CF6'], ['laptop', '#2563EB']].map(([icon, tone], i) => (
              <ProductArt key={icon} name={icon} icon={icon} tone={tone} className="aspect-square rounded-3xl ring-1 ring-white/10 [&]:bg-white/5" size={i % 2 ? 'md' : 'lg'} />
            ))}
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold leading-tight">“Ordered on Monday, it was on my desk by Wednesday.”</p>
            <p className="mt-3 text-white/60">Rahul V., Bengaluru</p>
          </div>
        </div>
      </div>
    </div>
  );
}
