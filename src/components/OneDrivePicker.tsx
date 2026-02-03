'use client';

import React, { useState } from 'react';
import { Cloud, Link2, CheckCircle, ExternalLink, AlertCircle, FolderOpen } from 'lucide-react';
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
      'saudicableco.sharepoint.com',
      'saudicableco-my.sharepoint.com',
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
    const pathParts = urlObj.pathname.split('/');

    // البحث عن اسم ملف بامتداد
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = decodeURIComponent(pathParts[i]);
      if (part && /\.[a-zA-Z0-9]+$/.test(part)) {
        return part;
      }
    }

    // محاولة استخراج من query parameters
    const params = urlObj.searchParams;
    const fileParam = params.get('file') || params.get('name');
    if (fileParam) {
      return decodeURIComponent(fileParam);
    }

    return 'مرفق OneDrive';
  } catch {
    return 'مرفق OneDrive';
  }
};

export default function OneDrivePicker({ onFileSelect, isAr = true, disabled = false }: OneDrivePickerProps) {
  const [url, setUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleUrlChange = (value: string) => {
    setUrl(value);

    if (!value.trim()) {
      setIsValid(null);
      return;
    }

    // التحقق من صحة الرابط
    const valid = isValidOneDriveUrl(value);
    setIsValid(valid);

    // إذا كان صالحاً، أضفه تلقائياً
    if (valid) {
      const fileName = extractFileName(value);
      onFileSelect({
        url: value.trim(),
        name: fileName,
        id: `onedrive-${Date.now()}`,
      });
      // مسح الحقل بعد الإضافة
      setTimeout(() => {
        setUrl('');
        setIsValid(null);
      }, 500);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text);
      }
    } catch {
      // المستخدم رفض صلاحية الـ clipboard
    }
  };

  return (
    <div className="space-y-2">
      {/* حقل لصق الرابط مباشرة */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onPaste={(e) => {
              // السماح بالـ paste الافتراضي
              setTimeout(() => {
                const value = e.currentTarget.value;
                if (value) handleUrlChange(value);
              }, 0);
            }}
            placeholder={isAr ? 'الصق رابط OneDrive أو SharePoint هنا...' : 'Paste OneDrive or SharePoint link here...'}
            disabled={disabled}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800
              text-gray-900 dark:text-white placeholder-gray-400
              focus:ring-2 focus:border-transparent transition-colors
              ${isValid === true ? 'border-green-500 focus:ring-green-500' : ''}
              ${isValid === false ? 'border-red-500 focus:ring-red-500' : ''}
              ${isValid === null ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500' : ''}
            `}
            dir="ltr"
          />
          {/* أيقونة الحالة */}
          {isValid === true && (
            <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
          {isValid === false && (
            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>

        {/* زر لصق من الحافظة */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePaste}
          disabled={disabled}
          className="gap-1.5 px-3 whitespace-nowrap"
          title={isAr ? 'لصق من الحافظة' : 'Paste from clipboard'}
        >
          <Link2 className="h-4 w-4" />
          {isAr ? 'لصق' : 'Paste'}
        </Button>
      </div>

      {/* رسالة الخطأ */}
      {isValid === false && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {isAr ? 'رابط غير صالح - يجب أن يكون من OneDrive أو SharePoint' : 'Invalid link - must be from OneDrive or SharePoint'}
        </p>
      )}

      {/* رسالة النجاح */}
      {isValid === true && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {isAr ? 'تم إضافة المرفق بنجاح!' : 'Attachment added successfully!'}
        </p>
      )}

      {/* أزرار فتح OneDrive/SharePoint */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.open('https://onedrive.live.com/', '_blank')}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
            text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20
            hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
        >
          <Cloud className="h-3.5 w-3.5" />
          OneDrive
          <ExternalLink className="h-3 w-3 opacity-50" />
        </button>

        <button
          type="button"
          onClick={() => window.open('https://saudicableco.sharepoint.com/sites/Debtors', '_blank')}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
            text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20
            hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-md transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          SharePoint
          <ExternalLink className="h-3 w-3 opacity-50" />
        </button>
      </div>

      {/* تلميح */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isAr
          ? '💡 شارك الملف من OneDrive/SharePoint ثم الصق الرابط هنا'
          : '💡 Share file from OneDrive/SharePoint then paste link here'}
      </p>
    </div>
  );
}
