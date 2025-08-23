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
                <Avatar className={`${sizeClasses[size]} border-2 border-primary group-hover:border-primary/60 transition-all duration-200 group-hover:scale-105`}>
                    <AvatarImage
                        src={
                            employee.photoUrl
                                ? (employee.photoUrl.startsWith('http') ||
                                    employee.photoUrl.startsWith('data:') ||
                                    employee.photoUrl.startsWith('blob:')
                                        ? employee.photoUrl
                                        : `/images/employees/${employee.photoUrl}`
                                )
                                : (employee.gender === 'Ж'
                                        ? '/imege/dsr.png'
                                        : employee.gender === 'М'
                                            ? '/imege/dsg.png'
                                            : '/imege/dsg.png' // или любой другой дефолтный
                                )
                        }
                        alt={employee.fullName}
                        className="object-cover w-18 h-18"
                    />
                    <AvatarFallback className="bg-primary/5 text-primary text-sm font-medium w-18 h-18">
                        {getInitials(employee.fullName)}
                    </AvatarFallback>
                </Avatar>
            </div>
      
      {size !== "lg" && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
            {employee.fullName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {employee.position}
          </p>
        </div>
      )}
    </div>
  );
}
