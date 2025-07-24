import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";

const profileSchema = z.object({
  monthlyNetSalary: z.string().optional(),
  annualGrossSalary: z.string().optional(),
  occupation: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  mobile: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { toast } = useToast();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const occupation = watch("occupation");
  const gender = watch("gender");

  // Reset form with profile data when modal opens
  useEffect(() => {
    if (profile && isOpen) {
      reset({
        monthlyNetSalary: profile.monthlyNetSalary || "",
        annualGrossSalary: profile.annualGrossSalary || "", 
        occupation: profile.occupation || "",
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender || "",
        mobile: profile.mobile || "",
      });
    }
  }, [profile, isOpen, reset]);

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const updateData: any = {};
      
      if (data.monthlyNetSalary) updateData.monthlyNetSalary = parseFloat(data.monthlyNetSalary);
      if (data.annualGrossSalary) updateData.annualGrossSalary = parseFloat(data.annualGrossSalary);
      if (data.occupation) updateData.occupation = data.occupation;
      if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;
      if (data.gender) updateData.gender = data.gender;
      if (data.mobile) updateData.mobile = data.mobile;

      return apiRequest("POST", "/api/profile", updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      toast({
        title: "Profile Updated!",
        description: "Your profile has been updated successfully.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    profileMutation.mutate(data);
  };

  const occupations = [
    { value: "software-engineer", label: "Software Engineer" },
    { value: "data-scientist", label: "Data Scientist" },
    { value: "product-manager", label: "Product Manager" },
    { value: "consultant", label: "Consultant" },
    { value: "teacher", label: "Teacher" },
    { value: "doctor", label: "Doctor" },
    { value: "student", label: "Student" },
    { value: "other", label: "Other" },
  ];

  const genders = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer-not-to-say", label: "Prefer not to say" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Select value={occupation} onValueChange={(value) => setValue("occupation", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupations.map((occ) => (
                      <SelectItem key={occ.value} value={occ.value}>
                        {occ.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {genders.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
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
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={profileMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {profileMutation.isPending ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}