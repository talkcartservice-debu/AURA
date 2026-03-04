import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Set Up</h2>
      <p className="text-gray-500 mb-6">You need to complete your profile before using AURA.</p>
      <Link to="/setup">
        <Button className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white">
          Set Up Profile
        </Button>
      </Link>
    </div>
  );
}