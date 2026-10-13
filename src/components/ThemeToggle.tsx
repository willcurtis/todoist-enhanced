import { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { useT } from '@/hooks/useT';
import { Icon } from './Icon';

/** A shortcut to the same preference used by Settings, including system mode. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useStore((s) => s.prefs.theme);
  const setPrefs = useStore((s) => s.setPrefs);
  const { t } = useT();
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  const label = t(dark ? 'theme.switchLight' : 'theme.switchDark');
  return (
    <button
      type="button"
      className={compact ? 'iconbtn theme-toggle' : 'btn theme-toggle'}
      aria-label={label}
      title={label}
      onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
      {!compact && <span>{label}</span>}
    </button>
  );
}
