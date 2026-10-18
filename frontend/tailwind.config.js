/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        wash: 'var(--wash)',
        wash2: 'var(--wash2)',
        ink: 'var(--ink)',
        ink2: 'var(--ink2)',
        ink3: 'var(--ink3)',
        line: 'var(--line)',
        line2: 'var(--line2)',
        acc: 'var(--acc)',
        accbg: 'var(--accbg)',
        accbg2: 'var(--accbg2)',
        ok: 'var(--ok)',
        okbg: 'var(--okbg)',
        okbg2: 'var(--okbg2)',
        warn: 'var(--warn)',
        warnbg: 'var(--warnbg)',
        warnbg2: 'var(--warnbg2)',
        bad: 'var(--bad)',
        badbg: 'var(--badbg)',
        badbg2: 'var(--badbg2)',
        unk: 'var(--unk)',
        rep: 'var(--rep)',
        repbg: 'var(--repbg)',
        dot: 'var(--dot)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'panel': '16px',
        'card': '12px',
        'pill': '100px',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'card': 'var(--shadow-card)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      fontSize: {
        '2xs': ['10.5px', '14px'],
        'xs': ['12px', '16px'],
        'sm': ['13.5px', '20px'],
      },
      letterSpacing: {
        'tight': '-0.025em',
        'tighter': '-0.04em',
      }
    },
  },
  plugins: [],
}
