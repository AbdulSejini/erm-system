import { NextRequest, NextResponse } from 'next/server';

// هذه الصفحة تستقبل الـ redirect من Microsoft OAuth
// وترسل الـ access token للنافذة الأصلية

export async function GET(request: NextRequest) {
  // في حالة implicit flow، الـ token يأتي في الـ URL fragment (#)
  // والـ fragment لا يصل للسيرفر، لذا نحتاج صفحة HTML تقرأه وترسله للنافذة الأم

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>OneDrive Authentication</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0078d4 0%, #00bcf2 100%);
      color: white;
    }
    .loader {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .message {
      font-size: 18px;
      text-align: center;
    }
    .error {
      background: #ff4444;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="loader" id="loader"></div>
  <div class="message" id="message">جاري التحقق من الهوية...</div>

  <script>
    (function() {
      try {
        // قراءة الـ hash fragment
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          document.getElementById('loader').style.display = 'none';
          document.getElementById('message').innerHTML = '<div class="error">' +
            'خطأ: ' + (errorDescription || error) + '</div>';

          if (window.opener) {
            window.opener.postMessage({
              type: 'onedrive-auth-error',
              error: errorDescription || error
            }, window.location.origin);
          }

          setTimeout(() => window.close(), 3000);
          return;
        }

        if (accessToken) {
          document.getElementById('message').textContent = 'تم التحقق بنجاح! جاري الإغلاق...';

          if (window.opener) {
            window.opener.postMessage({
              type: 'onedrive-auth-success',
              accessToken: accessToken
            }, window.location.origin);
          }

          setTimeout(() => window.close(), 1000);
        } else {
          document.getElementById('loader').style.display = 'none';
          document.getElementById('message').innerHTML = '<div class="error">' +
            'لم يتم استلام رمز الدخول</div>';
          setTimeout(() => window.close(), 3000);
        }
      } catch (e) {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('message').innerHTML = '<div class="error">' +
          'حدث خطأ غير متوقع</div>';
        console.error('Auth callback error:', e);
        setTimeout(() => window.close(), 3000);
      }
    })();
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
