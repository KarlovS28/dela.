import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee } from "@shared/schema";

interface EmployeeAvatarProps {
  employee: Employee;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function EmployeeAvatar({ employee, size = "md", onClick }: EmployeeAvatarProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center cursor-pointer group" onClick={onClick}>
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} border-4 border-primary group-hover:border-primary/80 transition-all duration-200 group-hover:scale-105`}>
          <AvatarImage 
            src={employee.photoUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`} 
            alt={employee.fullName}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(employee.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {size !== "lg" && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
            {employee.fullName.split(" ").map(n => `${n[0]}.`).join("")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {employee.position}
          </p>
        </div>
      )}
    </div>
  );
}
