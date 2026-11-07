import { cn } from "@/components/lib/utils.js";

export function SAgentAboutLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      fill="none"
      viewBox="0 0 72 72"
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="36"
        y="57"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
        fontSize="66"
        fontWeight="700"
        textAnchor="middle"
      >
        S
      </text>
    </svg>
  );
}

export function SAgentWordmarkLogo({ className }: { className?: string }) {
  return (
    <svg
      width="240"
      height="54"
      viewBox="0 0 240 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="2"
        y="43"
        fill="currentColor"
        fontFamily="Arial, sans-serif"
        fontSize="42"
        fontWeight="700"
      >
        S-Agent
      </text>
    </svg>
  );
}
