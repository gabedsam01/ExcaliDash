import React from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../i18n";

interface LanguageSwitcherProps {
  /** Extra classes for the wrapper. */
  className?: string;
  /** Hide the leading globe icon (e.g. tight corners). */
  hideIcon?: boolean;
  /** Accessible label for the control. */
  ariaLabel?: string;
}

/**
 * App-shell language switcher (EN / pt-BR). Distinct from the Excalidraw canvas
 * LanguageSelector — this changes ExcaliDash's own UI. The selected language is
 * persisted to localStorage by the i18next language detector.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  hideIcon = false,
  ariaLabel,
}) => {
  const { i18n, t } = useTranslation();
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language)?.code ??
    (i18n.language?.startsWith("pt") ? "pt-BR" : "en");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value);
  };

  const label = ariaLabel ?? t("language.label", "Language");

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      title={label}
    >
      {!hideIcon && (
        <Languages
          className="w-4 h-4 text-slate-500 dark:text-neutral-400 flex-shrink-0"
          aria-hidden="true"
        />
      )}
      <select
        value={current}
        onChange={handleChange}
        aria-label={label}
        className="text-sm rounded-md border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
