import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "secondary" | "primary";
}

const variants = {
  default:   "bg-zinc-800 text-zinc-300 border-zinc-700",
  success:   "bg-success/10 text-success border-success/20",
  warning:   "bg-warning/10 text-warning border-warning/20",
  danger:    "bg-danger/10 text-danger border-danger/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  primary:   "bg-primary/10 text-primary border-primary/20",
};

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}