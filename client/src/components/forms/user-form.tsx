import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserFormProps = {
  user: any;
  isProfile?: boolean;
};

export default function UserForm({ user, isProfile = false }: UserFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    rank: user?.rank || "",
    unit: user?.unit || "",
    password: "",
    confirmPassword: "",
  });
  
  const [changePassword, setChangePassword] = useState(false);

  const updateUser = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest(`/api/users/${user.id}`, {
        method: 'PUT',
        data: userData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
      });
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      setChangePassword(false);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing required fields",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password if changing
    if (changePassword) {
      if (formData.password.length < 6) {
        toast({
          title: "Invalid password",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "The password and confirmation do not match.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Prepare data for submission
    const updateData = {
      name: formData.name,
      email: formData.email,
      rank: formData.rank,
      unit: formData.unit
    };
    
    // Add password only if changing
    if (changePassword && formData.password) {
      Object.assign(updateData, { password: formData.password });
    }
    
    updateUser.mutate(updateData);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p>User data not available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your personal details and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rank">Rank</Label>
                <Select 
                  value={formData.rank} 
                  onValueChange={(value) => handleSelectChange('rank', value)}
                >
                  <SelectTrigger id="rank">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Corporal">Corporal</SelectItem>
                    <SelectItem value="Sergeant">Sergeant</SelectItem>
                    <SelectItem value="Lieutenant">Lieutenant</SelectItem>
                    <SelectItem value="Captain">Captain</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Colonel">Colonel</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  placeholder="Enter your unit"
                  value={formData.unit}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {isProfile && (
              <div className="grid gap-2 pt-4">
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    id="changePassword"
                    checked={changePassword}
                    onChange={() => setChangePassword(!changePassword)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="changePassword" className="ml-2 font-normal">
                    Change Password
                  </Label>
                </div>
                
                {changePassword && (
                  <div className="pt-2 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password <span className="text-red-500">*</span></Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter new password"
                        value={formData.password}
                        onChange={handleChange}
                        required={changePassword}
                      />
                      <p className="text-xs text-gray-500">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={changePassword}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}