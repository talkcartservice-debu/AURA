import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-6xl font-black text-gray-200 mb-2">404</h1>
      <p className="text-gray-500 mb-6">This page doesn't exist.</p>
      <Link to="/discover">
        <Button className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white">
          Back to Discover
        </Button>
      </Link>
    </div>
  );
}