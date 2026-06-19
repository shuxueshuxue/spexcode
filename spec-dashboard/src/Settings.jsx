import Modal from './Modal.jsx'
import { useI18n, LANGUAGES } from './i18n/index.jsx'

// @@@ Settings - the centered settings popup, opened by the `,` hotkey (see App). It renders inside the
// shared Modal (the `settings` class tunes its width), so it looks and behaves identically to the help
// popup — backdrop click closes, inner panel stops propagation, Esc/× close (Esc handled in App). Today
// it owns one setting, LANGUAGE; it's the deliberate home for future ones (just add another .legend-sec).
// The language list comes from i18n (LANGUAGES); picking one calls setLang, which persists to
// localStorage and re-renders every t() live — no reload.
export default function Settings({ onClose }) {
  const { t, lang, setLang } = useI18n()
  return (
    <Modal title={t('settings.title')} closeLabel={t('settings.close')} className="settings" onClose={onClose}>
      <section className="legend-sec">
        <div className="legend-h">{t('settings.secLanguage')}</div>
        <div className="set-langs">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={l.code === lang ? 'set-lang on' : 'set-lang'}
              onClick={() => setLang(l.code)}
              aria-pressed={l.code === lang}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="legend-desc set-hint">{t('settings.languageHint')}</div>
      </section>
    </Modal>
  )
}
