export function syncMobileStatusBarTheme() {
  if (typeof document === 'undefined') return;

  const isLight = document.documentElement.classList.contains('light-theme') ||
                  document.documentElement.getAttribute('data-theme') === 'light' ||
                  document.body.classList.contains('light-theme');

  const themeColor = isLight ? '#F6F3EC' : '#0F172A';
  const barStyle = isLight ? 'default' : 'black-translucent';

  // 1. Meta theme-color
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', themeColor);

  // 2. Meta apple-mobile-web-app-status-bar-style
  let metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!metaAppleStatus) {
    metaAppleStatus = document.createElement('meta');
    metaAppleStatus.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(metaAppleStatus);
  }
  metaAppleStatus.setAttribute('content', barStyle);
}
