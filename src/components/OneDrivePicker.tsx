'use client';

import React, { useState } from 'react';
import { Cloud, Link2, Loader2, X, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OneDrivePickerProps {
  onFileSelect: (file: { url: string; name: string; id: string }) => void;
  isAr?: boolean;
  disabled?: boolean;
}

// تحقق من صحة رابط OneDrive/SharePoint
const isValidOneDriveUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const validDomains = [
      'onedrive.live.com',
      'sharepoint.com',
      '1drv.ms',
      'saudicable.sharepoint.com',
      'saudicable-my.sharepoint.com',
      'sceco.sharepoint.com',
      'sceco-my.sharepoint.com',
    ];
    return validDomains.some(domain => urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
};

// استخراج اسم الملف من الرابط
const extractFileName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // محاولة استخراج الاسم من المسار
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    if (fileName && fileName.includes('.')) {
      return decodeURIComponent(fileName);
    }
    // إذا لم نجد اسم ملف، نستخدم اسم افتراضي
    return 'OneDrive File';
  } catch {
    return 'OneDrive File';
  }
};

export default function OneDrivePicker({ onFileSelect, isAr = true, disabled = false }: OneDrivePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError(null);

    if (value && isValidOneDriveUrl(value)) {
      // استخراج اسم الملف تلقائياً
      const extracted = extractFileName(value);
      if (!fileName) {
        setFileName(extracted);
      }
    }
  };

  const handleSubmit = () => {
    setError(null);
    setIsValidating(true);

    // التحقق من الرابط
    if (!url.trim()) {
      setError(isAr ? 'الرجاء إدخال رابط الملف' : 'Please enter the file URL');
      setIsValidating(false);
      return;
    }

    if (!isValidOneDriveUrl(url)) {
      setError(isAr
        ? 'الرابط غير صالح. يرجى إدخال رابط من OneDrive أو SharePoint'
        : 'Invalid URL. Please enter a OneDrive or SharePoint link');
      setIsValidating(false);
      return;
    }

    // التحقق من أن الرابط مشترك مع المؤسسة
    const urlLower = url.toLowerCase();
    const isSaudiCableLink = urlLower.includes('saudicable') || urlLower.includes('sceco');

    if (!isSaudiCableLink && !urlLower.includes('sharepoint.com')) {
      setError(isAr
        ? 'تأكد من مشاركة الملف مع أعضاء شركة الكابلات السعودية'
        : 'Make sure the file is shared with Saudi Cable Company members');
      setIsValidating(false);
      return;
    }

    const finalFileName = fileName.trim() || extractFileName(url);

    onFileSelect({
      url: url.trim(),
      name: finalFileName,
      id: `onedrive-${Date.now()}`,
    });

    // إعادة تعيين الحالة وإغلاق النافذة
    setUrl('');
    setFileName('');
    setShowModal(false);
    setIsValidating(false);
  };

  const handleOpenOneDrive = () => {
    window.open('https://saudicable-my.sharepoint.com/', '_blank');
  };

  return (
    <div className="relative">
      {/* زر فتح OneDrive Picker */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="gap-2 border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <Cloud className="h-4 w-4" />
        {isAr ? 'اختر من OneDrive' : 'Choose from OneDrive'}
      </Button>

      {/* نافذة إدخال الرابط */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
            {/* رأس النافذة */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {isAr ? 'إضافة ملف من OneDrive' : 'Add file from OneDrive'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setUrl('');
                  setFileName('');
                  setError(null);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="p-4 space-y-4">
              {/* تعليمات */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                <p className="text-blue-800 dark:text-blue-200 mb-2">
                  {isAr ? '📋 الخطوات:' : '📋 Steps:'}
                </p>
                <ol className={`text-blue-700 dark:text-blue-300 space-y-1 ${isAr ? 'list-decimal list-inside' : 'list-decimal list-inside'}`}>
                  <li>{isAr ? 'افتح OneDrive وانتقل للملف المطلوب' : 'Open OneDrive and navigate to the file'}</li>
                  <li>{isAr ? 'اضغط على "مشاركة" واختر "أي شخص في المؤسسة"' : 'Click "Share" and select "Anyone in the organization"'}</li>
                  <li>{isAr ? 'انسخ الرابط والصقه هنا' : 'Copy the link and paste it here'}</li>
                </ol>
              </div>

              {/* زر فتح OneDrive */}
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenOneDrive}
                className="w-full gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {isAr ? 'فتح OneDrive في نافذة جديدة' : 'Open OneDrive in new tab'}
              </Button>

              {/* حقل الرابط */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Link2 className="h-4 w-4 inline-block ml-1" />
                  {isAr ? 'رابط الملف *' : 'File URL *'}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={isAr ? 'https://saudicable-my.sharepoint.com/...' : 'https://saudicable-my.sharepoint.com/...'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  dir="ltr"
                />
              </div>

              {/* حقل اسم الملف (اختياري) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isAr ? 'اسم الملف (اختياري)' : 'File name (optional)'}
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={isAr ? 'سيتم استخراجه تلقائياً من الرابط' : 'Will be extracted from URL'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* تنبيه المشاركة */}
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {isAr
                    ? 'تأكد من مشاركة الملف مع "أي شخص في شركة الكابلات السعودية" حتى يتمكن الآخرون من الوصول إليه'
                    : 'Make sure to share the file with "Anyone in Saudi Cable Company" so others can access it'}
                </span>
              </div>
            </div>

            {/* أزرار النافذة */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                  setUrl('');
                  setFileName('');
                  setError(null);
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={!url.trim() || isValidating}
                className="gap-2"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isAr ? 'إضافة الملف' : 'Add File'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
