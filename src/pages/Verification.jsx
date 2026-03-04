import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { verificationService, uploadService } from "@/api/entities";
import PersonalityVerification from "@/components/verification/PersonalityVerification";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Verification() {
  const qc = useQueryClient();
  const { data: request } = useQuery({ queryKey: ["verification"], queryFn: verificationService.get });
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

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Verification</h1>
      <Tabs defaultValue="identity">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="identity" className="flex-1 gap-1"><ShieldCheck className="w-4 h-4" /> Identity</TabsTrigger>
          <TabsTrigger value="personality" className="flex-1 gap-1"><Brain className="w-4 h-4" /> Personality</TabsTrigger>
        </TabsList>
        <TabsContent value="identity">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
            {request?.status === "approved" ? (
              <div><ShieldCheck className="w-16 h-16 text-blue-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-gray-900 mb-2">Verified!</h2><p className="text-gray-500 text-sm">Your identity is verified.</p></div>
            ) : (
              <div>
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
                <p className="text-gray-500 text-sm mb-6">Take a selfie to get the verified badge on your profile.</p>
                <label>
                  <Button disabled={uploading} className="rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white" asChild>
                    <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Camera className="w-4 h-4 mr-1" />}{uploading ? "Uploading..." : "Take Selfie"}</span>
                  </Button>
                  <input type="file" accept="image/*" capture="user" onChange={handleSelfie} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="personality">
          <PersonalityVerification onComplete={() => qc.invalidateQueries(["myProfile"])} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
