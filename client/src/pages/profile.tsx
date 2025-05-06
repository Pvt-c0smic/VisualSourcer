import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SkillSetForm } from "@/components/forms/skillset-form";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { 
  User, 
  Settings, 
  Briefcase, 
  Award, 
  Shield, 
  UserCog,
  BadgeCheck,
  Mail,
  Building,
  FileText,
  Save,
  Loader2
} from "lucide-react";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  rank?: string;
  unit?: string;
  avatarUrl?: string;
  skillSets?: any[];
  createdAt: string;
  updatedAt: string;
}

interface ProfileUpdateData {
  name?: string;
  email?: string;
  password?: string;
  rank?: string;
  unit?: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileUpdateData>({});
  
  // Fetch current user data
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest<User>('/api/auth/me'),
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => 
      apiRequest(`/api/users/${currentUser?.id}`, {
        method: 'PUT',
        data,
      }),
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    },
  });
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle profile update
  const handleProfileUpdate = () => {
    if (currentUser?.id) {
      updateProfileMutation.mutate(profileData);
    }
  };
  
  // Start editing with current values
  const startEditing = () => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name,
        email: currentUser.email,
        rank: currentUser.rank,
        unit: currentUser.unit,
        avatarUrl: currentUser.avatarUrl,
      });
      setIsEditing(true);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setProfileData({});
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-5xl py-10 flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="container max-w-5xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              You need to be logged in to view your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-5xl py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          {!isEditing && (
            <Button onClick={startEditing}>
              <UserCog className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="skills">
              <Briefcase className="w-4 h-4 mr-2" />
              Skill Sets
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  View and update your personal and organizational information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={currentUser.avatarUrl || ""} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Badge variant={
                      currentUser.role === 'admin' ? "destructive" :
                      currentUser.role === 'trainer' ? "default" :
                      "secondary"
                    }>
                      {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                    </Badge>
                    
                    {!isEditing && (
                      <div className="text-sm text-muted-foreground text-center">
                        Member since {formatDate(currentUser.createdAt)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={profileData.name || ""}
                              onChange={handleProfileChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={profileData.email || ""}
                              onChange={handleProfileChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="rank">Rank</Label>
                            <Input
                              id="rank"
                              name="rank"
                              value={profileData.rank || ""}
                              onChange={handleProfileChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Input
                              id="unit"
                              name="unit"
                              value={profileData.unit || ""}
                              onChange={handleProfileChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                            <Input
                              id="avatarUrl"
                              name="avatarUrl"
                              value={profileData.avatarUrl || ""}
                              onChange={handleProfileChange}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Full Name</Label>
                            <div className="mt-1 font-medium">{currentUser.name}</div>
                          </div>
                          
                          <div>
                            <Label>Username</Label>
                            <div className="mt-1 font-medium">{currentUser.username}</div>
                          </div>
                          
                          <div>
                            <Label>Email Address</Label>
                            <div className="mt-1 font-medium flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                              {currentUser.email}
                            </div>
                          </div>
                          
                          <div>
                            <Label>Role</Label>
                            <div className="mt-1 font-medium flex items-center">
                              <BadgeCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                              {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                            </div>
                          </div>
                          
                          {currentUser.rank && (
                            <div>
                              <Label>Rank</Label>
                              <div className="mt-1 font-medium">{currentUser.rank}</div>
                            </div>
                          )}
                          
                          {currentUser.unit && (
                            <div>
                              <Label>Unit</Label>
                              <div className="mt-1 font-medium flex items-center">
                                <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                                {currentUser.unit}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              
              {isEditing && (
                <CardFooter className="flex justify-between border-t pt-5">
                  <Button variant="outline" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button onClick={handleProfileUpdate} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skill Sets</CardTitle>
                <CardDescription>
                  Manage your skill sets for better course matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentUser && (
                  <SkillSetForm 
                    userId={currentUser.id}
                    currentSkillSets={currentUser.skillSets || []}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Certificates</CardTitle>
                <CardDescription>
                  View and download your earned certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Certificate management will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input 
                        id="password" 
                        name="password"
                        type="password" 
                        placeholder="••••••••"
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Preferences</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications for important events
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={updateProfileMutation.isPending || !profileData.password}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Security Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}