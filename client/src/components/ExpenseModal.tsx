import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const expenseSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const category = watch("category");

  const expenseMutation = useMutation({
    mutationFn: async (data: ExpenseForm) => {
      return apiRequest("POST", "/api/expenses", {
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description || "",
        date: data.date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/range"] });
      
      toast({
        title: "Expense Added!",
        description: "Your expense has been recorded successfully.",
      });
      
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Expense",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseForm) => {
    expenseMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const categories = [
    { value: "food", label: "🍽️ Food & Dining", color: "bg-orange-100 text-orange-800" },
    { value: "transport", label: "🚗 Transportation", color: "bg-blue-100 text-blue-800" },
    { value: "shopping", label: "🛍️ Shopping", color: "bg-purple-100 text-purple-800" },
    { value: "entertainment", label: "🎬 Entertainment", color: "bg-pink-100 text-pink-800" },
    { value: "bills", label: "💡 Bills & Utilities", color: "bg-yellow-100 text-yellow-800" },
    { value: "healthcare", label: "🏥 Healthcare", color: "bg-red-100 text-red-800" },
    { value: "education", label: "📚 Education", color: "bg-green-100 text-green-800" },
    { value: "other", label: "📦 Other", color: "bg-gray-100 text-gray-800" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">Add New Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-text-secondary">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="100.00"
                className="pl-8"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-error">{errors.category.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register("date")}
            />
            {errors.date && (
              <p className="text-sm text-error">{errors.date.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the expense..."
              className="min-h-[80px]"
              {...register("description")}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={expenseMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {expenseMutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}