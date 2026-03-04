import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OnlineStatusBadge({ email, size = "md", showLabel = false }) {
  const { isOnline } = useOnlineStatus(email);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (!email) return null;

  return (
    <div className="relative inline-block">
      {/* Status indicator */}
      <div
        className={`absolute -bottom-0.5 -right-0.5 ${sizeClasses[size]} rounded-full border-2 border-white ${
          isOnline ? "bg-green-500" : "bg-gray-400"
        }`}
        title={isOnline ? "Online" : "Offline"}
      />
      
      {/* Optional label */}
      {showLabel && (
        <span className={`text-xs ml-1 ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}
