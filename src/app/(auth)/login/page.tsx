'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Eye, EyeOff, Mail, Lock, Languages, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Mock login - في الإنتاج سيتم استبداله بـ API حقيقي
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === 'admin@saudicable.com' && password === 'admin123') {
        router.push('/dashboard');
      } else {
        setError(t('auth.invalidCredentials'));
      }
    } catch {
      setError(t('common.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        {/* Header Actions */}
        <div className="absolute end-4 top-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleLanguage}>
            <Languages className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--primary)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="8" r="2" fill="currentColor" />
                <circle cx="8" cy="12" r="2" fill="currentColor" />
                <circle cx="16" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="16" r="2" fill="currentColor" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {t('common.companyName')}
              </h1>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {t('common.appName')}
              </p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {t('auth.welcomeBack')}
            </h2>
            <p className="mt-2 text-[var(--foreground-secondary)]">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Login Form */}
          <Card className="border-0 bg-transparent p-0 shadow-none">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-[var(--risk-critical-bg)] p-3 text-sm text-[var(--risk-critical)]">
                    {error}
                  </div>
                )}

                <Input
                  type="email"
                  label={t('auth.email')}
                  placeholder="example@saudicable.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-5 w-5" />}
                  required
                  autoComplete="email"
                />

                <Input
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.password')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="transition-colors hover:text-[var(--foreground)]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                  required
                  autoComplete="current-password"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--foreground-secondary)]">
                      {t('auth.rememberMe')}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  {t('auth.login')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <div className="mt-8 rounded-lg bg-[var(--background-secondary)] p-4">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">
              {language === 'ar' ? 'بيانات الدخول التجريبية:' : 'Demo Credentials:'}
            </p>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {language === 'ar' ? 'البريد: ' : 'Email: '}
              <code className="rounded bg-[var(--background-tertiary)] px-1.5 py-0.5">
                admin@saudicable.com
              </code>
            </p>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {language === 'ar' ? 'كلمة المرور: ' : 'Password: '}
              <code className="rounded bg-[var(--background-tertiary)] px-1.5 py-0.5">
                admin123
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden bg-[var(--secondary)] lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-16">
        <div className="max-w-lg text-center">
          {/* Large Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--primary)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-14 w-14 text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="8" r="2" fill="currentColor" />
                <circle cx="8" cy="12" r="2" fill="currentColor" />
                <circle cx="16" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="16" r="2" fill="currentColor" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-white">
            {t('common.companyName')}
          </h2>
          <p className="text-lg text-gray-300">
            {t('common.appName')}
          </p>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-6 text-start">
            {[
              { icon: '📊', label: language === 'ar' ? 'تتبع المخاطر' : 'Risk Tracking' },
              { icon: '📈', label: language === 'ar' ? 'التقييم والتحليل' : 'Assessment & Analysis' },
              { icon: '🛠️', label: language === 'ar' ? 'خطط المعالجة' : 'Treatment Plans' },
              { icon: '📋', label: language === 'ar' ? 'التقارير' : 'Reports' },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-white/10 p-4"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-sm font-medium text-white">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
