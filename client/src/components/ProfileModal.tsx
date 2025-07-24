import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile, User } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  mobile: z.string().optional(),
  monthlyNetSalary: z.string().optional(),
  annualGrossSalary: z.string().optional(),
  occupation: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user && isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const gender = watch("gender");
  const occupation = watch("occupation");

  // Update form when profile data is loaded
  useEffect(() => {
    const userData = user as User;
    if (userData && profile) {
      reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        mobile: profile.mobile || "",
        monthlyNetSalary: profile.monthlyNetSalary || "",
        annualGrossSalary: profile.annualGrossSalary || "",
        occupation: profile.occupation || "",
      });
    } else if (userData) {
      reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        dateOfBirth: "",
        gender: "",
        mobile: "",
        monthlyNetSalary: "",
        annualGrossSalary: "",
        occupation: "",
      });
    }
  }, [user, profile, reset]);

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const profileData: any = {};
      
      // Only include non-empty financial fields
      if (data.monthlyNetSalary && data.monthlyNetSalary.trim()) {
        profileData.monthlyNetSalary = parseFloat(data.monthlyNetSalary);
      }
      if (data.annualGrossSalary && data.annualGrossSalary.trim()) {
        profileData.annualGrossSalary = parseFloat(data.annualGrossSalary);
      }
      if (data.occupation && data.occupation.trim()) {
        profileData.occupation = data.occupation;
      }
      if (data.dateOfBirth && data.dateOfBirth.trim()) {
        profileData.dateOfBirth = data.dateOfBirth;
      }
      if (data.gender && data.gender.trim()) {
        profileData.gender = data.gender;
      }
      if (data.mobile && data.mobile.trim()) {
        profileData.mobile = data.mobile;
      }

      return apiRequest("POST", "/api/profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated!",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to Update Profile",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const onSubmit = (data: ProfileForm) => {
    profileMutation.mutate(data);
  };

  const userData = user as User;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personal Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Photo Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <img 
                src={userData?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                alt="Profile photo" 
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-200"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.293-.293A1 1 0 0014 4h-4a1 1 0 00-.707.293L8.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-text-secondary mt-2">Click the camera icon to upload a new photo</p>
          </div>

          {/* Personal Information Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-error">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData?.email || ""}
                disabled
                className="bg-gray-50 text-text-secondary"
              />
              <p className="text-xs text-text-secondary">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={(value) => setValue("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select gender</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+91 9876543210"
                {...register("mobile")}
              />
            </div>

            {/* Financial Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-text-primary mb-4">Financial Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyNetSalary">Monthly Net Salary</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-text-secondary">₹</span>
                    <Input
                      id="monthlyNetSalary"
                      type="number"
                      placeholder="50,000"
                      className="pl-8"
                      {...register("monthlyNetSalary")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualGrossSalary">Annual Gross Salary</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-text-secondary">₹</span>
                    <Input
                      id="annualGrossSalary"
                      type="number"
                      placeholder="8,00,000"
                      className="pl-8"
                      {...register("annualGrossSalary")}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Select value={occupation} onValueChange={(value) => setValue("occupation", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software-engineer">Software Engineer</SelectItem>
                    <SelectItem value="data-scientist">Data Scientist</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-text-primary mb-1">Privacy & Security</p>
                  <p className="text-text-secondary">All personal information is encrypted and stored securely. Your data is only decrypted on your device for viewing and editing.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary-dark"
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>

          {/* Logout Button */}
          <div className="border-t border-gray-200 pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}