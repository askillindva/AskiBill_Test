import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const mobileSchema = z.object({
  mobile: z.string().regex(/^[+]?[91]?[6-9]\d{9}$/, "Please enter a valid mobile number"),
});

const otpSchema = z.object({
  mobile: z.string(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type MobileForm = z.infer<typeof mobileSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type EmailForm = z.infer<typeof emailSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authStep, setAuthStep] = useState<"mobile" | "otp">("mobile");
  const [verifyingMobile, setVerifyingMobile] = useState("");

  // Mobile form
  const {
    register: registerMobile,
    handleSubmit: handleSubmitMobile,
    formState: { errors: mobileErrors },
  } = useForm<MobileForm>({
    resolver: zodResolver(mobileSchema),
  });

  // OTP form
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (data: MobileForm) => {
      return apiRequest("POST", "/api/auth/send-otp", {
        mobile: data.mobile,
      });
    },
    onSuccess: (_, variables) => {
      setVerifyingMobile(variables.mobile);
      setAuthStep("otp");
      toast({
        title: "OTP Sent!",
        description: `We've sent a 6-digit code to ${variables.mobile}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      return apiRequest("POST", "/api/auth/verify-otp", {
        mobile: data.mobile,
        otp: data.otp,
      });
    },
    onSuccess: (data) => {
      // Store mobile auth user in localStorage
      localStorage.setItem("mobileAuthUser", JSON.stringify(data.user));
      
      toast({
        title: "Login Successful!",
        description: "Welcome to AskiBill",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Invalid OTP",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  // Email login mutation (existing Replit Auth)
  const emailLoginMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      // Store email for Replit Auth and redirect
      localStorage.setItem("loginEmail", data.email);
      window.location.href = "/api/login";
      return Promise.resolve();
    },
  });

  const onSubmitMobile = (data: MobileForm) => {
    sendOtpMutation.mutate(data);
  };

  const onSubmitOtp = (data: OtpForm) => {
    verifyOtpMutation.mutate({
      ...data,
      mobile: verifyingMobile,
    });
  };

  const onSubmitEmail = (data: EmailForm) => {
    emailLoginMutation.mutate(data);
  };

  const handleBackToMobile = () => {
    setAuthStep("mobile");
    setVerifyingMobile("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM8 13a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">AskiBill</h1>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {authStep === "mobile" ? (
              <Tabs defaultValue="mobile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mobile">Mobile OTP</TabsTrigger>
                  <TabsTrigger value="email">Email/Social</TabsTrigger>
                </TabsList>
                
                <TabsContent value="mobile" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Login with Mobile</h3>
                    <p className="text-sm text-text-secondary">We'll send you a verification code</p>
                  </div>
                  
                  <form onSubmit={handleSubmitMobile(onSubmitMobile)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+91 9876543210"
                        {...registerMobile("mobile")}
                      />
                      {mobileErrors.mobile && (
                        <p className="text-sm text-error">{mobileErrors.mobile.message}</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={sendOtpMutation.isPending}
                    >
                      {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="email" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">Continue with Email</h3>
                    <p className="text-sm text-text-secondary">Use your existing account or create new</p>
                  </div>
                  
                  <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        {...registerEmail("email")}
                      />
                      {emailErrors.email && (
                        <p className="text-sm text-error">{emailErrors.email.message}</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      variant="outline"
                      className="w-full"
                    >
                      Continue with Email
                    </Button>
                  </form>
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => window.location.href = "/api/login"}
                      className="w-full bg-primary hover:bg-primary-dark"
                    >
                      Sign in with Replit
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // OTP Verification Step
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-text-primary">Enter Verification Code</h3>
                  <p className="text-sm text-text-secondary">
                    We sent a 6-digit code to {verifyingMobile}
                  </p>
                </div>
                
                <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">6-Digit Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      {...registerOtp("otp")}
                    />
                    {otpErrors.otp && (
                      <p className="text-sm text-error">{otpErrors.otp.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={verifyOtpMutation.isPending}
                  >
                    {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Login"}
                  </Button>
                </form>
                
                <div className="flex justify-between text-sm">
                  <button
                    onClick={handleBackToMobile}
                    className="text-primary hover:text-primary-dark"
                  >
                    ← Change Number
                  </button>
                  <button
                    onClick={() => sendOtpMutation.mutate({ mobile: verifyingMobile })}
                    className="text-text-secondary hover:text-text-primary"
                    disabled={sendOtpMutation.isPending}
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}