import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = { sm: "h-8 w-8", md: "h-12 w-12", lg: "h-20 w-20" };

export default function ProfileAvatar({ profile, size = "md", className }) {
  const initials = (profile?.display_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn(SIZES[size], className)}>
      {profile?.photos?.[0] && <AvatarImage src={profile.photos[0]} alt={profile.display_name} />}
      <AvatarFallback className="bg-gradient-to-br from-rose-400 to-purple-500 text-white font-bold text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}