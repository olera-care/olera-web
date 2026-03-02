"use client";

/**
 * Button that scrolls to the ConnectionCard sidebar and briefly highlights it.
 * Used by "Get a custom quote", "Book a consultation", and "Connect with us".
 */
export default function ScrollToConnectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  function handleClick() {
    const el = document.getElementById("connection-card");
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Add highlight pulse
    el.classList.add("ring-2", "ring-primary-400", "ring-offset-2", "rounded-2xl");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary-400", "ring-offset-2", "rounded-2xl");
    }, 2000);
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
