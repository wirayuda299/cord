import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DropdownWrapperProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  style?: string;
};

export default function DropdownWrapper({
  style,
  children,
  icon,
}: DropdownWrapperProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn("min-w-80 border-none bg-sidebar-primary rounded", style)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
