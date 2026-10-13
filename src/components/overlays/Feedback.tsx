import { Overlay } from './Overlay';
import { Icon } from '../Icon';
import { useT } from '@/hooks/useT';
import { FEEDBACK_URL } from '@/app-info';
export function Feedback({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  return <Overlay open={open} onClose={onClose} label={t('nav.feedback')} size="sm">
    <div className="sheet-head"><h2>{t('nav.feedback')}</h2>
      <button className="iconbtn" aria-label={t('common.close')} onClick={onClose}><Icon name="close" /></button>
    </div>
    <a className="btn primary" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">{t('nav.feedback')} · GitHub</a>
  </Overlay>;
}
