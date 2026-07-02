"use client"

export function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark")
    try { localStorage.setItem("matriz-theme", isDark ? "dark" : "light") } catch (e) {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="w-9 h-9 border-2 border-ink dark:border-paper/30 rounded-md flex items-center justify-center text-ink dark:text-paper hover:bg-ink hover:text-lime dark:hover:bg-lime dark:hover:text-ink transition-colors"
    >
      {/* Moon — visible in light mode */}
      <svg className="w-4 h-4 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      {/* Sun — visible in dark mode */}
      <svg className="w-4 h-4 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </button>
  )
}
