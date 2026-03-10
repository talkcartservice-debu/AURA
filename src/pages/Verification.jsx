import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { verificationService, uploadService, profileService } from "@/api/entities";
import PersonalityVerification from "@/components/verification/PersonalityVerification";
import DeepVerification from "@/components/verification/DeepVerification";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Verification() {
  const qc = useQueryClient();
  const { data: request } = useQuery({ queryKey: ["verification"], queryFn: verificationService.get });
  const { data: profile } = useQuery({ queryKey: ["myProfile"], queryFn: profileService.getMe });
  const [uploading, setUploading] = useState(false);

  async function handleSelfie(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadService.single(file);
      await verificationService.submit(url);
      qc.invalidateQueries(["verification"]);
      qc.invalidateQueries(["myProfile"]);
      toast.success("Verification submitted!");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  const identityStatus = request?.status || "not_started";
  const verificationLevel = request?.verification_level || (profile?.is_verified ? "basic" : "none");
  const personalityDone = !!profile?.is_personality_verified;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-black text-gray-900 mb-4">Verification</h1>

      {/* Overall verification summary */}
      <div className="mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Verification level</p>
          <p className="text-sm font-bold text-gray-900 capitalize">
            {verificationLevel === "none" ? "Not verified" : verificationLevel.replace("_", " ")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Identity:{" "}
            <span className="font-medium">
              {identityStatus === "approved"
                ? "Verified"
                : identityStatus === "pending" || identityStatus === "in_progress"
                ? "In review"
                : "Not verified"}
            </span>
            {" • "}
            Personality:{" "}
            <span className="font-medium">
              {personalityDone ? "Verified" : "Not verified"}
            </span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="identity">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="identity" className="flex-1 gap-1"><ShieldCheck className="w-4 h-4" /> Identity</TabsTrigger>
          <TabsTrigger value="personality" className="flex-1 gap-1"><Brain className="w-4 h-4" /> Personality</TabsTrigger>
          <TabsTrigger value="deep" className="flex-1 gap-1"><ShieldCheck className="w-4 h-4 text-blue-500" /> Deep</TabsTrigger>
        </TabsList>
        <TabsContent value="identity">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            {identityStatus === "approved" ? (
              <div className="text-center">
                <ShieldCheck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verified!</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Your selfie has been verified and your profile now shows a verification badge.
                </p>
                {request?.reviewed_at && (
                  <p className="text-xs text-gray-400">
                    Reviewed on{" "}
                    {new Date(request.reviewed_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
                  <p className="text-gray-500 text-sm">
                    Take a clear selfie in good lighting. We’ll compare it to your profile photos to
                    keep AURAsync safe and authentic.
                  </p>
                </div>

                {identityStatus === "rejected" && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <p className="font-semibold mb-1">Previous attempt rejected</p>
                    <p>
                      {request?.rejection_reason ||
                        "The last verification attempt did not meet our guidelines. Please try again with a clearer photo."}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Tips for fast approval</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Face fully visible (no sunglasses, heavy filters, or masks).</li>
                    <li>Good lighting and a neutral background.</li>
                    <li>Match the vibe of your main profile photo.</li>
                  </ul>
                </div>

                <div className="text-center">
                  <label>
                    <Button
                      disabled={uploading}
                      className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Camera className="w-4 h-4 mr-1" />
                        )}
                        {uploading ? "Uploading..." : identityStatus === "rejected" ? "Try Again" : "Take Selfie"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfie}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="personality">
          <PersonalityVerification onComplete={() => qc.invalidateQueries(["myProfile"])} />
        </TabsContent>
        <TabsContent value="deep">
          <DeepVerification />
        </TabsContent>
      </Tabs>
    </div>
  );
}
