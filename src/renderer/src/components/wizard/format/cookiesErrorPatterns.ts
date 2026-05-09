// Heuristics for "this error means yt-dlp needs cookies" — used by both the
// wizard's CookiesErrorAlert and the StepError gate. Lives in its own module
// so react-refresh treats CookiesErrorAlert.tsx as a pure component file.

export function isCookiesNeededError(text: string | undefined | null): boolean {
  if (!text) return false;
  return (
    /use --cookies\b|--cookies-from-browser/i.test(text) ||
    /sign in to confirm/i.test(text) ||
    /sign in to view/i.test(text) ||
    /login required|require(?:s|d)? login/i.test(text) ||
    /registered users? only/i.test(text) ||
    /private video/i.test(text) ||
    /members?-only|members? only/i.test(text) ||
    /age[- ]restricted/i.test(text) ||
    /authentication (?:is )?required/i.test(text) ||
    /HTTP Error 401\b/i.test(text)
  );
}
