import Link from "next/link";

export default function BackLink({ href, children, highContrast = false }) {
  const colors = highContrast
    ? "border-yellow-300 bg-black text-yellow-300 hover:bg-slate-900 focus-visible:ring-yellow-300"
    : "border-blue-200 bg-white text-blue-800 hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-blue-600";

  return (
    <Link
      href={href}
      className={`group inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${colors}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
      >
        <path
          d="M12.5 4.5 7 10l5.5 5.5M7.5 10h8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </Link>
  );
}
