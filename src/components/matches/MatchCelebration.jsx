import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function MatchCelebration({ match, profile, onClose, onChat }) {
  if (!match || !profile) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl text-center p-8"
        >
          {/* Background Sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: [0, 90, 180],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
              >
                <Sparkles className="w-4 h-4 text-rose-200" />
              </motion.div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-2xl"
          >
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500 animate-pulse" />
          </motion.div>

          <h2 className="text-3xl font-black text-gray-900 mb-2">It's a Match!</h2>
          <p className="text-gray-500 mb-8">
            You and <span className="font-bold text-gray-900">{profile.display_name}</span> have liked each other.
          </p>

          <div className="flex items-center justify-center gap-4 mb-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden ring-4 ring-rose-50">
                <ProfileAvatar profile={profile} size="xl" />
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4 }}
              className="z-10 -mx-4 bg-white rounded-full p-2 shadow-md"
            >
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden ring-4 ring-purple-50 bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                You
              </div>
            </motion.div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onChat}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Send a Message
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full h-12 rounded-2xl text-gray-500 font-semibold hover:text-gray-700"
            >
              Keep Discovering
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
