import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, UserCircle, Award, Calendar, Shield, Users } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import SkillSetsSelect from "@/components/forms/skillsets-select";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();
  const [selectedSkillSetIds, setSelectedSkillSetIds] = useState<number[]>([]);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch current user data
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Perform initial setup when user data loads
  const isFirstLoad = useState(true)[0];
  if (currentUser && isFirstLoad && selectedSkillSetIds.length === 0) {
    // Initialize selected skills from user data
    const userSkillSets = currentUser.skillSets || [];
    if (Array.isArray(userSkillSets) && userSkillSets.length > 0) {
      setSelectedSkillSetIds(userSkillSets.map((skill: any) => skill.id));
    }
  }
  
  // Save updated skillsets
  const updateSkillSets = useMutation({
    mutationFn: async (skillSetIds: number[]) => {
      if (!currentUser || !currentUser.id) {
        throw new Error("User data is not available");
      }
      
      return apiRequest(`/api/users/${currentUser.id}/skillsets`, {
        method: 'PUT',
        data: { skillSetIds }
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Skills updated",
        description: "Your skill sets have been successfully updated.",
      });
      setIsEditingSkills(false);
    },
    onError: (error) => {
      console.error("Error updating skills:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your skills. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Format skill sets for display with custom styling by category
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string, text: string }> = {
      'Technical': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Leadership': { bg: 'bg-green-100', text: 'text-green-800' },
      'Operational': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'Communication': { bg: 'bg-violet-100', text: 'text-violet-800' }
    };
    
    return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  // Handle saving skill sets
  const handleSaveSkillSets = () => {
    updateSkillSets.mutate(selectedSkillSetIds);
  };

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Not Authenticated</h2>
        <p className="mt-2">Please log in to view your profile.</p>
      </div>
    );
  }

  // Determine the color and icon to use for the role badge
  const getRoleBadge = () => {
    const roleConfig: Record<string, { color: string, icon: React.ReactNode }> = {
      'admin': { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: <Shield className="h-3.5 w-3.5 mr-1" />
      },
      'trainer': { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: <Users className="h-3.5 w-3.5 mr-1" />
      },
      'trainee': { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: <Award className="h-3.5 w-3.5 mr-1" />
      },
      'training_director': { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: <Calendar className="h-3.5 w-3.5 mr-1" />
      }
    };
    
    const role = currentUser.role || 'trainee';
    const config = roleConfig[role] || roleConfig.trainee;
    
    return (
      <Badge variant="outline" className={`${config.color} flex items-center`}>
        {config.icon} {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                  <AvatarFallback className="text-2xl">
                    {currentUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="mt-4 text-center">{currentUser.name}</CardTitle>
              <div className="flex justify-center mt-1">
                {getRoleBadge()}
              </div>
              {(currentUser.role === 'trainee' || currentUser.role === 'trainer') && (
                <div className="mt-3 text-center">
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1">
                    {currentUser.rank || 'No Rank'}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {currentUser.unit || 'No Unit'}
                  </span>
                </div>
              )}
              <CardDescription className="text-center mt-2">
                Member since {formatDistanceToNow(new Date(currentUser.createdAt), { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="my-2" />
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                  <p className="mt-1">{currentUser.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Username</h3>
                  <p className="mt-1">{currentUser.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{currentUser.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  <p className="mt-1 capitalize">{currentUser.role?.replace('_', ' ') || 'Trainee'}</p>
                </div>
                {currentUser.rank && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Rank</h3>
                    <p className="mt-1">{currentUser.rank || 'None'}</p>
                  </div>
                )}
                {currentUser.unit && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Unit</h3>
                    <p className="mt-1">{currentUser.unit || 'None'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Tabs */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skillsets">Skill Sets</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                  <CardDescription>
                    View your profile information and skills summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800">Total Skill Sets</h3>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          {Array.isArray(currentUser.skillSets) ? currentUser.skillSets.length : 0}
                        </p>
                      </div>
                      {currentUser.role === 'trainee' && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-green-800">Enrolled Programs</h3>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {currentUser.programEnrollments?.length || 0}
                          </p>
                        </div>
                      )}
                      {currentUser.role === 'trainer' && (
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-amber-800">Programs Led</h3>
                          <p className="text-2xl font-bold text-amber-900 mt-1">
                            {currentUser.programsCreated?.length || 0}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Skill Sets Summary */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Your Skill Sets</h3>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(currentUser.skillSets) && currentUser.skillSets.length > 0 ? (
                          currentUser.skillSets.map((skill: any) => {
                            const { bg, text } = getCategoryColor(skill.category);
                            return (
                              <Badge 
                                key={skill.id} 
                                variant="outline"
                                className={`${bg} ${text} border-none`}
                              >
                                {skill.name} (Lvl {skill.level})
                              </Badge>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No skill sets added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Skill Sets Tab */}
            <TabsContent value="skillsets" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Manage Your Skill Sets</CardTitle>
                      <CardDescription>
                        Add or remove skill sets to match your expertise
                      </CardDescription>
                    </div>
                    {!isEditingSkills ? (
                      <Button onClick={() => setIsEditingSkills(true)}>
                        Edit Skills
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditingSkills(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveSkillSets}
                          disabled={updateSkillSets.isPending}
                        >
                          {updateSkillSets.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingSkills ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Select the skill sets that best represent your capabilities. These will help match you with appropriate training programs.
                      </p>
                      <SkillSetsSelect
                        selectedSkillSetIds={selectedSkillSetIds}
                        onChange={setSelectedSkillSetIds}
                        label="Your Skill Sets"
                        description="Select all skill sets that apply to your experience and training level"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Display skill sets by category */}
                      {Array.isArray(currentUser.skillSets) && currentUser.skillSets.length > 0 ? (
                        (() => {
                          // Group skills by category
                          const groupedSkills = currentUser.skillSets.reduce((acc: Record<string, any[]>, skill: any) => {
                            if (!acc[skill.category]) {
                              acc[skill.category] = [];
                            }
                            acc[skill.category].push(skill);
                            return acc;
                          }, {});
                          
                          return Object.entries(groupedSkills).map(([category, skills]) => (
                            <div key={category}>
                              <h3 className="text-sm font-medium text-gray-500 mb-2">{category}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {skills.sort((a: any, b: any) => b.level - a.level).map((skill: any) => {
                                  const { bg, text } = getCategoryColor(skill.category);
                                  return (
                                    <div key={skill.id} className={`p-3 rounded-md ${bg}`}>
                                      <div className="flex justify-between items-center">
                                        <h4 className={`font-medium ${text}`}>{skill.name}</h4>
                                        <Badge variant="outline" className={`${text} border-current`}>
                                          Level {skill.level}
                                        </Badge>
                                      </div>
                                      {skill.description && (
                                        <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="text-center py-8">
                          <UserCircle className="h-12 w-12 text-gray-300 mx-auto" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No skill sets added</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            You haven't added any skill sets to your profile yet.
                          </p>
                          <Button onClick={() => setIsEditingSkills(true)} className="mt-4">
                            Add Skill Sets
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}