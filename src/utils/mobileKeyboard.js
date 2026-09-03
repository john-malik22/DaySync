/**
 * Mobile Keyboard Focus & Visibility Helper
 * Automatically scrolls focused form inputs into view above the soft keyboard.
 */
export function handleMobileInputFocus(e) {
  if (typeof window !== 'undefined' && window.innerWidth <= 768 && e && e.target) {
    setTimeout(() => {
      try {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {}
    }, 150);
  }
}
