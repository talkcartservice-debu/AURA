import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { verificationService, uploadService, profileService } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Smartphone, 
  FileText, 
  Share2, 
  Video, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Play,
  Square,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function DeepVerification() {
  const qc = useQueryClient();
  const [step, setStep] = useState("overview"); // overview, phone, id, socials, video
  const [loading, setLoading] = useState(false);
  
  // Video recording states
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [stream, setStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const chunksRef = useRef([]);

  const { data: profile } = useQuery({ 
    queryKey: ["myProfile"], 
    queryFn: profileService.getMe 
  });
  
  const verificationPhrase = "I verify my AURA profile identity today";

  // States for verification data
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const [idData, setIdData] = useState({
    document_type: "passport",
    document_number: "",
    full_name: "",
    expiry_date: "",
    issuing_country: ""
  });
  const [idFiles, setIdFiles] = useState({ front: null, back: null });
  
  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: ""
  });

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ["verificationStatus"],
    queryFn: verificationService.get,
    refetchInterval: 5000 // Poll status
  });

  const initMutation = useMutation({
    mutationFn: (type) => verificationService.initDeep(type),
    onSuccess: () => qc.invalidateQueries(["verificationStatus"])
  });

  const phoneMutation = useMutation({
    mutationFn: () => verificationService.sendPhoneCode(phone, "+1"),
    onSuccess: () => {
      setOtpSent(true);
      toast.success("Verification code sent!");
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to send code")
  });

  const otpMutation = useMutation({
    mutationFn: () => verificationService.verifyPhoneCode(otp),
    onSuccess: () => {
      setStep("overview");
      toast.success("Phone verified!");
    },
    onError: (err) => toast.error(err.response?.data?.error || "Invalid code")
  });

  const idMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        const front_url = await uploadService.single(idFiles.front);
        let back_url = null;
        if (idFiles.back) back_url = await uploadService.single(idFiles.back);
        
        await verificationService.submitID({
          ...idData,
          front_url,
          back_url
        });
        toast.success("ID submitted for verification");
        setStep("overview");
      } finally {
        setLoading(false);
      }
    }
  });

  const socialsMutation = useMutation({
    mutationFn: () => verificationService.submitSocials(socials),
    onSuccess: () => {
      setStep("overview");
      toast.success("Social accounts linked");
    }
  });

  const videoMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      try {
        const file = new File([videoBlob], "verification.webm", { type: "video/webm" });
        const video_url = await uploadService.single(file);
        
        await verificationService.submitVideo({
          video_url,
          duration: 15, // Fixed duration for demo
          phrase: verificationPhrase
        });
        toast.success("Video submitted for review");
        setStep("overview");
      } finally {
        setLoading(false);
      }
    }
  });

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = s;
      }
    } catch (err) {
      toast.error("Could not access camera/microphone");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      stopCamera();
    }
  };

  const resetVideo = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    startCamera();
  };

  useEffect(() => {
    if (step === "video") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  const handleInit = async () => {
    try {
      await initMutation.mutateAsync("comprehensive");
    } catch (err) {
      toast.error("Failed to start deep verification");
    }
  };

  const badgeStatus = (type) => {
    return status?.verification_badges?.find(b => b.badge_type === type);
  };

  if (loadingStatus) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  // Overview Step
  if (step === "overview") {
    return (
      <div className="space-y-4">
        <Card className="border-none shadow-none bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              Deep Verification
            </CardTitle>
            <CardDescription>
              Complete multi-layer verification to earn the Trusted User badge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!status && (
              <Button onClick={handleInit} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700">
                Start Deep Verification
              </Button>
            )}
            
            {status && (
              <div className="space-y-3">
                <VerificationItem 
                  icon={Smartphone} 
                  label="Phone Verification" 
                  status={badgeStatus("phone_verified") ? "verified" : status.phone_verification?.phone_number ? "in_review" : "pending"}
                  onClick={() => setStep("phone")}
                />
                <VerificationItem 
                  icon={FileText} 
                  label="ID Document" 
                  status={badgeStatus("id_verified") ? "verified" : status.id_document?.front_url ? "in_review" : "pending"}
                  onClick={() => setStep("id")}
                />
                <VerificationItem 
                  icon={Share2} 
                  label="Social Accounts" 
                  status={badgeStatus("social_verified") ? "verified" : status.social_accounts?.instagram?.url ? "in_review" : "pending"}
                  onClick={() => setStep("socials")}
                />
                <VerificationItem 
                  icon={Video} 
                  label="Video Liveness" 
                  status={badgeStatus("video_verified") ? "verified" : status.video_verification?.video_url ? "in_review" : "pending"}
                  onClick={() => setStep("video")}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phone Verification UI
  if (step === "phone") {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("overview")} className="flex items-center gap-2 text-sm text-gray-500 font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Card className="rounded-[2rem] border-gray-100">
          <CardHeader>
            <CardTitle>Phone Verification</CardTitle>
            <CardDescription>Verify your mobile number via SMS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <>
                <Input 
                  placeholder="Enter phone number (e.g. +1234567890)" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="rounded-xl h-12"
                />
                <Button 
                  onClick={() => phoneMutation.mutate()} 
                  disabled={phoneMutation.isPending}
                  className="w-full rounded-xl h-12 bg-blue-600"
                >
                  {phoneMutation.isPending ? <Loader2 className="animate-spin" /> : "Send OTP"}
                </Button>
              </>
            ) : (
              <>
                <Input 
                  placeholder="Enter 6-digit code" 
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="rounded-xl h-12 text-center text-xl tracking-widest"
                  maxLength={6}
                />
                <Button 
                  onClick={() => otpMutation.mutate()} 
                  disabled={otpMutation.isPending}
                  className="w-full rounded-xl h-12 bg-green-600"
                >
                  {otpMutation.isPending ? <Loader2 className="animate-spin" /> : "Verify Code"}
                </Button>
                <button 
                  onClick={() => setOtpSent(false)} 
                  className="w-full text-xs text-blue-600 font-bold"
                >
                  Resend code
                </button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ID Verification UI
  if (step === "id") {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("overview")} className="flex items-center gap-2 text-sm text-gray-500 font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Card className="rounded-[2rem] border-gray-100">
          <CardHeader>
            <CardTitle>ID Verification</CardTitle>
            <CardDescription>Upload a valid government ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select 
              className="w-full h-12 rounded-xl border border-gray-100 px-3 text-sm"
              value={idData.document_type}
              onChange={e => setIdData({...idData, document_type: e.target.value})}
            >
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="national_id">National ID</option>
            </select>
            <Input 
              placeholder="Full Name as on ID" 
              value={idData.full_name}
              onChange={e => setIdData({...idData, full_name: e.target.value})}
              className="rounded-xl"
            />
            <Input 
              placeholder="ID Document Number" 
              value={idData.document_number}
              onChange={e => setIdData({...idData, document_number: e.target.value})}
              className="rounded-xl"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Front Photo</p>
                <input type="file" onChange={e => setIdFiles({...idFiles, front: e.target.files[0]})} className="text-xs" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Back Photo (Opt)</p>
                <input type="file" onChange={e => setIdFiles({...idFiles, back: e.target.files[0]})} className="text-xs" />
              </div>
            </div>
            <Button 
              onClick={() => idMutation.mutate()} 
              disabled={loading || !idFiles.front || !idData.full_name}
              className="w-full rounded-xl h-12 bg-blue-600"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Submit for Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Socials UI
  if (step === "socials") {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("overview")} className="flex items-center gap-2 text-sm text-gray-500 font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Card className="rounded-[2rem] border-gray-100">
          <CardHeader>
            <CardTitle>Social Accounts</CardTitle>
            <CardDescription>Link your profiles for authenticity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400">Instagram Profile URL</p>
              <Input 
                placeholder="https://instagram.com/username" 
                value={socials.instagram}
                onChange={e => setSocials({...socials, instagram: e.target.value})}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400">LinkedIn Profile URL</p>
              <Input 
                placeholder="https://linkedin.com/in/username" 
                value={socials.linkedin}
                onChange={e => setSocials({...socials, linkedin: e.target.value})}
                className="rounded-xl"
              />
            </div>
            <Button 
              onClick={() => socialsMutation.mutate()} 
              disabled={socialsMutation.isPending}
              className="w-full rounded-xl h-12 bg-blue-600"
            >
              {socialsMutation.isPending ? <Loader2 className="animate-spin" /> : "Link Accounts"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Video Liveness Check UI
  if (step === "video") {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("overview")} className="flex items-center gap-2 text-sm text-gray-500 font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        <Card className="rounded-[2rem] border-gray-100 overflow-hidden">
          <CardHeader>
            <CardTitle>Video Verification</CardTitle>
            <CardDescription>Read the phrase below clearly while recording</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-inner">
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <video 
                  ref={videoPreviewRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover ${recording ? "opacity-100" : "opacity-70"}`} 
                />
              )}
              
              {recording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-500 text-white text-xs font-black rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  REC
                </div>
              )}
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl text-center">
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Read this phrase</p>
              <p className="text-xl font-bold text-blue-900 italic">
                "{verificationPhrase}"
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {!videoUrl ? (
                recording ? (
                  <Button 
                    onClick={stopRecording} 
                    className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold gap-2"
                  >
                    <Square className="w-5 h-5 fill-current" /> Stop Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={startRecording} 
                    className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" /> Start Recording
                  </Button>
                )
              ) : (
                <div className="flex gap-3">
                  <Button 
                    onClick={resetVideo} 
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl font-bold gap-2"
                  >
                    <RefreshCw className="w-5 h-5" /> Retake
                  </Button>
                  <Button 
                    onClick={() => videoMutation.mutate()} 
                    disabled={loading}
                    className="flex-[2] h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {loading ? "Uploading..." : "Submit Verification"}
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-gray-400 text-center px-4 font-medium">
              By submitting, you agree that this video will be used for identity verification purposes only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}


function VerificationItem({ icon: Icon, label, status, onClick }) {
  const getStatusColor = () => {
    switch (status) {
      case "verified": return "text-green-500 bg-green-50";
      case "in_review": return "text-amber-500 bg-amber-50";
      case "rejected": return "text-red-500 bg-red-50";
      default: return "text-gray-400 bg-gray-50";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "verified": return "Verified";
      case "in_review": return "In Review";
      case "rejected": return "Rejected";
      default: return "Not Started";
    }
  };

  return (
    <button 
      onClick={onClick}
      disabled={status === "verified" || status === "in_review"}
      className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all group active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor()}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{getStatusText()}</p>
        </div>
      </div>
      {status === "pending" && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />}
      {status === "verified" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      {status === "in_review" && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
    </button>
  );
}
