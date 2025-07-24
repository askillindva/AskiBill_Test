import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const expenseSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

const categories = [
  { id: "food", name: "Food", icon: "🍽️", color: "bg-primary/10 text-primary" },
  { id: "transport", name: "Transport", icon: "🚗", color: "bg-secondary/10 text-secondary" },
  { id: "shopping", name: "Shopping", icon: "🛒", color: "bg-accent/10 text-accent" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "bg-error/10 text-error" },
  { id: "health", name: "Health", icon: "❤️", color: "bg-success/10 text-success" },
  { id: "other", name: "Other", icon: "📝", color: "bg-text-secondary/10 text-text-secondary" },
];

export default function ExpenseModal({ isOpen, onClose, onExpenseAdded }: ExpenseModalProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

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
      toast({
        title: "Expense Added!",
        description: "Your expense has been saved successfully.",
      });
      reset();
      setSelectedCategory("");
      onExpenseAdded();
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
        title: "Failed to Add Expense",
        description: error.message || "Failed to save expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setValue("category", categoryId);
  };

  const onSubmit = (data: ExpenseForm) => {
    expenseMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setSelectedCategory("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-text-secondary">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8 text-lg font-medium"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={`p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center ${
                    selectedCategory === category.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-lg mb-2">{category.icon}</div>
                  <p className="text-xs font-medium text-text-primary">{category.name}</p>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-sm text-error">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              {...register("description")}
            />
          </div>

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

          <div className="flex space-x-4 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-primary-dark"
              disabled={expenseMutation.isPending}
            >
              {expenseMutation.isPending ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}