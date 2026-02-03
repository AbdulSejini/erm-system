'use client';

import React, { useState, useCallback } from 'react';
import { Cloud, FileText, Loader2, X, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Microsoft OneDrive Configuration
const ONEDRIVE_CONFIG = {
  clientId: '27b70c34-94bc-4b2c-988f-4dff038e6b1f',
  tenantId: 'd354b90d-f50c-48b5-a837-ba63e262b291',
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/onedrive/callback` : '',
  scopes: ['Files.Read', 'Files.Read.All', 'User.Read'],
};

interface OneDriveFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  lastModifiedDateTime: string;
  file?: {
    mimeType: string;
  };
  '@microsoft.graph.downloadUrl'?: string;
}

interface OneDrivePickerProps {
  onFileSelect: (file: { url: string; name: string; id: string }) => void;
  isAr?: boolean;
  disabled?: boolean;
}

export default function OneDrivePicker({ onFileSelect, isAr = true, disabled = false }: OneDrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<OneDriveFile[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('/me/drive/root/children');
  const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; path: string }[]>([
    { name: isAr ? 'الرئيسية' : 'Root', path: '/me/drive/root/children' }
  ]);

  // فتح نافذة المصادقة مع Microsoft
  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // بناء URL المصادقة
      const authUrl = new URL(`https://login.microsoftonline.com/${ONEDRIVE_CONFIG.tenantId}/oauth2/v2.0/authorize`);
      authUrl.searchParams.set('client_id', ONEDRIVE_CONFIG.clientId);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('redirect_uri', ONEDRIVE_CONFIG.redirectUri);
      authUrl.searchParams.set('scope', ONEDRIVE_CONFIG.scopes.join(' '));
      authUrl.searchParams.set('response_mode', 'fragment');
      authUrl.searchParams.set('prompt', 'select_account');

      // فتح نافذة منبثقة للمصادقة
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        authUrl.toString(),
        'OneDrive Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // الاستماع لرسالة من نافذة المصادقة
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'onedrive-auth-success' && event.data.accessToken) {
          setAccessToken(event.data.accessToken);
          setIsAuthenticated(true);
          setShowPicker(true);
          fetchFiles('/me/drive/root/children', event.data.accessToken);
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'onedrive-auth-error') {
          setError(event.data.error || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'));
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // التحقق من إغلاق النافذة
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);

    } catch (err) {
      console.error('Auth error:', err);
      setError(isAr ? 'حدث خطأ أثناء تسجيل الدخول' : 'Error during login');
      setIsLoading(false);
    }
  }, [isAr]);

  // جلب الملفات من OneDrive
  const fetchFiles = useCallback(async (path: string, token?: string) => {
    const tokenToUse = token || accessToken;
    if (!tokenToUse) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.value || []);
      setCurrentPath(path);
    } catch (err) {
      console.error('Fetch files error:', err);
      setError(isAr ? 'فشل في جلب الملفات' : 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAr]);

  // التنقل إلى مجلد
  const navigateToFolder = (folderId: string, folderName: string) => {
    const newPath = `/me/drive/items/${folderId}/children`;
    setBreadcrumbs(prev => [...prev, { name: folderName, path: newPath }]);
    fetchFiles(newPath);
  };

  // الرجوع في المسار
  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    fetchFiles(newBreadcrumbs[index].path);
  };

  // اختيار ملف
  const selectFile = async (file: OneDriveFile) => {
    if (file.file) {
      // هذا ملف وليس مجلد
      try {
        // الحصول على رابط المشاركة
        const shareResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/createLink`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'view',
              scope: 'organization', // مشاركة مع المنظمة (شركة الكابلات السعودية)
            }),
          }
        );

        if (shareResponse.ok) {
          const shareData = await shareResponse.json();
          onFileSelect({
            url: shareData.link?.webUrl || file.webUrl,
            name: file.name,
            id: file.id,
          });
          setShowPicker(false);
        } else {
          // إذا فشل إنشاء رابط المشاركة، استخدم الرابط الأصلي
          onFileSelect({
            url: file.webUrl,
            name: file.name,
            id: file.id,
          });
          setShowPicker(false);
        }
      } catch (err) {
        console.error('Share link error:', err);
        // استخدم الرابط الأصلي
        onFileSelect({
          url: file.webUrl,
          name: file.name,
          id: file.id,
        });
        setShowPicker(false);
      }
    } else {
      // هذا مجلد، انتقل إليه
      navigateToFolder(file.id, file.name);
    }
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // الحصول على أيقونة الملف
  const getFileIcon = (file: OneDriveFile) => {
    if (!file.file) {
      return '📁'; // مجلد
    }
    const mimeType = file.file.mimeType || '';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('video')) return '🎬';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📄';
  };

  return (
    <div className="relative">
      {/* زر فتح OneDrive Picker */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={isAuthenticated ? () => setShowPicker(true) : handleLogin}
        disabled={disabled || isLoading}
        className="gap-2 border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Cloud className="h-4 w-4" />
        )}
        {isAr ? 'اختر من OneDrive' : 'Choose from OneDrive'}
      </Button>

      {/* رسالة الخطأ */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* نافذة اختيار الملفات */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* رأس النافذة */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {isAr ? 'اختر ملف من OneDrive' : 'Choose file from OneDrive'}
                </h3>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* شريط المسار (Breadcrumbs) */}
            <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-sm overflow-x-auto">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap ${
                      index === breadcrumbs.length - 1 ? 'font-medium text-blue-600' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {crumb.name}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-gray-400">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* قائمة الملفات */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{isAr ? 'لا توجد ملفات' : 'No files found'}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => selectFile(file)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-start"
                    >
                      <span className="text-2xl">{getFileIcon(file)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {file.file ? formatFileSize(file.size) : (isAr ? 'مجلد' : 'Folder')}
                          {' • '}
                          {new Date(file.lastModifiedDateTime).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                      {file.file && (
                        <CheckCircle className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* تذييل النافذة */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500">
                {isAr
                  ? 'سيتم مشاركة الملف تلقائياً مع أعضاء شركة الكابلات السعودية'
                  : 'File will be automatically shared with Saudi Cables Company members'}
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowPicker(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
