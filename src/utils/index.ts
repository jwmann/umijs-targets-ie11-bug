export function getLang(): string {
  const htmlLang = window.document.documentElement.lang;
  const urlLangMatch = window.location.pathname.match(/\/([a-z]{2})\//);
  const urlLang = urlLangMatch ? urlLangMatch[1] : '';
  return htmlLang || urlLang || 'fr';
}

export function getBaseURL(): string {
  const lang = getLang().toLowerCase();
  return lang ? `/${lang}` : '';
}
