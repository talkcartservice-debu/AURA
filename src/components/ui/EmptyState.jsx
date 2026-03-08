import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = "" 
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6 text-rose-500">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="rounded-2xl px-8 h-12 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold shadow-lg shadow-rose-200"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
