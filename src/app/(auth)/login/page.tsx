'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Mail, Lock, Languages, Sun, Moon, Shield, BarChart3, ClipboardCheck, FileText } from 'lucide-react';
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
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.invalidCredentials'));
      } else {
        router.push('/dashboard');
        router.refresh();
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

  const features = [
    {
      icon: Shield,
      labelAr: 'تتبع المخاطر',
      labelEn: 'Risk Tracking',
      descAr: 'مراقبة شاملة للمخاطر',
      descEn: 'Comprehensive risk monitoring'
    },
    {
      icon: BarChart3,
      labelAr: 'التقييم والتحليل',
      labelEn: 'Assessment',
      descAr: 'تقييم دقيق للمخاطر',
      descEn: 'Accurate risk assessment'
    },
    {
      icon: ClipboardCheck,
      labelAr: 'خطط المعالجة',
      labelEn: 'Treatment',
      descAr: 'متابعة خطط المعالجة',
      descEn: 'Treatment plan tracking'
    },
    {
      icon: FileText,
      labelAr: 'التقارير',
      labelEn: 'Reports',
      descAr: 'تقارير تفصيلية',
      descEn: 'Detailed reports'
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[var(--background)] via-[var(--background)] to-[var(--background-secondary)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative Gradient Circles */}
      <div className="absolute -top-40 -end-40 h-80 w-80 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
      <div className="absolute -bottom-40 -start-40 h-80 w-80 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />

      {/* Header Actions */}
      <div className="absolute end-6 top-6 z-50 flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--foreground-secondary)] shadow-sm transition-all hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
          title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
        >
          <Languages className="h-5 w-5" />
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--foreground-secondary)] shadow-sm transition-all hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">

            {/* Left Side - Branding & Features */}
            <div className="flex flex-col justify-center">
              {/* Logo & Company */}
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[#1e40af] shadow-lg">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-9 w-9 text-white"
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
              <div className="mb-10">
                <h2 className="text-3xl font-bold leading-tight text-[var(--foreground)] lg:text-4xl">
                  {language === 'ar' ? (
                    <>
                      إدارة المخاطر
                      <br />
                      <span className="text-[var(--primary)]">بكل سهولة</span>
                    </>
                  ) : (
                    <>
                      Risk Management
                      <br />
                      <span className="text-[var(--primary)]">Made Simple</span>
                    </>
                  )}
                </h2>
                <p className="mt-4 text-lg text-[var(--foreground-secondary)]">
                  {language === 'ar'
                    ? 'نظام متكامل لإدارة المخاطر المؤسسية وتتبعها ومعالجتها'
                    : 'A comprehensive system for enterprise risk management, tracking, and treatment'}
                </p>
              </div>

              {/* Features Grid */}
              <div className="hidden grid-cols-2 gap-4 lg:grid">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:border-[var(--primary)] hover:shadow-md"
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {language === 'ar' ? feature.labelAr : feature.labelEn}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                        {language === 'ar' ? feature.descAr : feature.descEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl">
                  {/* Form Header */}
                  <div className="mb-8 text-center">
                    <h3 className="text-2xl font-bold text-[var(--foreground)]">
                      {t('auth.welcomeBack')}
                    </h3>
                    <p className="mt-2 text-[var(--foreground-secondary)]">
                      {t('auth.loginSubtitle')}
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </div>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                        {t('auth.email')}
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                          <Mail className="h-5 w-5 text-[var(--foreground-muted)]" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@company.com"
                          required
                          autoComplete="email"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pe-4 ps-12 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                        {t('auth.password')}
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                          <Lock className="h-5 w-5 text-[var(--foreground-muted)]" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          autoComplete="current-password"
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pe-12 ps-12 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 flex items-center pe-4 text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span className="text-sm text-[var(--foreground-secondary)]">
                          {t('auth.rememberMe')}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/80"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full py-3 text-base font-semibold"
                      size="lg"
                      isLoading={isLoading}
                    >
                      {t('auth.login')}
                    </Button>
                  </form>

                  {/* Help Text */}
                  <div className="mt-8 rounded-lg bg-[var(--background-secondary)] p-4 text-center">
                    <p className="text-sm text-[var(--foreground-secondary)]">
                      {language === 'ar'
                        ? 'تواصل مع مسؤول النظام للحصول على بيانات الدخول'
                        : 'Contact system administrator for login credentials'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 start-0 end-0 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          {language === 'ar' ? '© 2024 شركة الكابلات السعودية. جميع الحقوق محفوظة.' : '© 2024 Saudi Cable Company. All rights reserved.'}
        </p>
      </div>
    </div>
  );
}
