import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const setupSchema = z.object({
  monthlyNetSalary: z.string().min(1, "Monthly net salary is required"),
  annualGrossSalary: z.string().min(1, "Annual gross salary is required"),
  occupation: z.string().min(1, "Occupation is required"),
});

type SetupForm = z.infer<typeof setupSchema>;

export default function Setup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  });

  const occupation = watch("occupation");

  const setupMutation = useMutation({
    mutationFn: async (data: SetupForm) => {
      return apiRequest("POST", "/api/profile", {
        monthlyNetSalary: parseFloat(data.monthlyNetSalary),
        annualGrossSalary: parseFloat(data.annualGrossSalary),
        occupation: data.occupation,
        isSetupComplete: "true",
      });
    },
    onSuccess: () => {
      toast({
        title: "Setup Complete!",
        description: "Your financial profile has been saved successfully.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupForm) => {
    setupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-neutral p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12a1 1 0 102 0V8a1 1 0 10-2 0v4zm1-6a1 1 0 11-2 0 1 1 0 012 0z"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Complete Your Profile</h2>
          <p className="text-text-secondary mt-2">Set up your financial profile to get personalized insights</p>
        </div>

        {/* Setup Form */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {errors.monthlyNetSalary && (
                    <p className="text-sm text-error">{errors.monthlyNetSalary.message}</p>
                  )}
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
                  {errors.annualGrossSalary && (
                    <p className="text-sm text-error">{errors.annualGrossSalary.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
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
                {errors.occupation && (
                  <p className="text-sm text-error">{errors.occupation.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-primary mt-1 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-text-primary mb-1">Privacy Notice</p>
                    <p className="text-text-secondary">Your financial information is encrypted and stored securely. This data helps us provide personalized expense insights and budgeting recommendations.</p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
                disabled={setupMutation.isPending}
                size="lg"
              >
                {setupMutation.isPending ? "Saving..." : "Complete Setup & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
