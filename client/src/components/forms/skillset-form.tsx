import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Icons
import { Check, Info, BriefcaseBusiness, FileText, AlarmClock, Award, Save } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  skillSetIds: z.array(z.number()),
});

type FormData = z.infer<typeof formSchema>;

interface SkillSet {
  id: number;
  name: string;
  category: string;
  level: number;
  description?: string;
}

interface SkillSetFormProps {
  userId: number;
  currentSkillSets?: SkillSet[];
  onSuccess?: () => void;
}

export function SkillSetForm({ userId, currentSkillSets = [], onSuccess }: SkillSetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");
  
  // Fetch all skill sets
  const { data: skillSets = [], isLoading: isLoadingSkillSets } = useQuery({
    queryKey: ['/api/skillsets'],
    queryFn: () => apiRequest<SkillSet[]>('/api/skillsets'),
  });
  
  // Fetch skill set categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/skillsets/categories'],
    queryFn: () => apiRequest<string[]>('/api/skillsets/categories'),
  });
  
  // Initialize the form with current skill sets
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skillSetIds: currentSkillSets?.map(skillSet => skillSet.id) || [],
    },
  });
  
  // Update default values when currentSkillSets changes
  useEffect(() => {
    if (currentSkillSets.length > 0) {
      form.setValue("skillSetIds", currentSkillSets.map(skillSet => skillSet.id));
    }
  }, [currentSkillSets, form]);
  
  // Mutation to update user's skill sets
  const updateSkillSetsMutation = useMutation({
    mutationFn: (data: FormData) => 
      apiRequest(`/api/users/${userId}/skillsets`, {
        method: 'PUT',
        data,
      }),
    onSuccess: () => {
      toast({
        title: "Skill sets updated",
        description: "Your skill sets have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update skill sets",
        description: error.message || "There was an error updating your skill sets.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormData) => {
    updateSkillSetsMutation.mutate(data);
  };
  
  // Function to toggle skill set selection
  const toggleSkillSet = (id: number) => {
    const currentIds = form.getValues("skillSetIds");
    const isSelected = currentIds.includes(id);
    
    if (isSelected) {
      // Remove the skill set
      form.setValue("skillSetIds", currentIds.filter(skillId => skillId !== id));
    } else {
      // Add the skill set
      form.setValue("skillSetIds", [...currentIds, id]);
    }
  };
  
  // Filter skill sets based on search and category
  const filteredSkillSets = skillSets.filter(skillSet => {
    const matchesSearch = searchValue === "" || 
      skillSet.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      skillSet.description?.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesCategory = activeTab === "all" || skillSet.category === activeTab;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group skill sets by category for easy browsing
  const skillSetsByCategory = filteredSkillSets.reduce((acc, skillSet) => {
    if (!acc[skillSet.category]) {
      acc[skillSet.category] = [];
    }
    acc[skillSet.category].push(skillSet);
    return acc;
  }, {} as Record<string, SkillSet[]>);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Skill Sets</h2>
              <p className="text-sm text-muted-foreground">
                Select the skill sets that match your expertise
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={updateSkillSetsMutation.isPending || isLoadingSkillSets}
            >
              {updateSkillSetsMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Skill Sets
                </>
              )}
            </Button>
          </div>
          
          <Input
            placeholder="Search skill sets..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-md"
          />
          
          <Card className="mt-4">
            <CardHeader className="p-4 pb-2">
              <TabsList className="grid grid-cols-2 md:flex md:flex-wrap">
                <TabsTrigger 
                  value="all" 
                  onClick={() => setActiveTab("all")}
                  className={activeTab === "all" ? "bg-primary text-primary-foreground" : ""}
                >
                  All Categories
                </TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger 
                    key={category}
                    value={category}
                    onClick={() => setActiveTab(category)}
                    className={activeTab === category ? "bg-primary text-primary-foreground" : ""}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>
            
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="skillSetIds"
                render={() => (
                  <FormItem>
                    <ScrollArea className="h-[400px] rounded-md border p-4">
                      {Object.entries(skillSetsByCategory).length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No skill sets found</p>
                        </div>
                      ) : (
                        Object.entries(skillSetsByCategory).map(([category, skills]) => (
                          <div key={category} className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{category}</h3>
                              <Badge variant="outline">{skills.length}</Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {skills.map(skill => {
                                const isSelected = form.watch("skillSetIds").includes(skill.id);
                                return (
                                  <div 
                                    key={skill.id}
                                    className={`
                                      p-3 rounded-lg cursor-pointer
                                      ${isSelected 
                                        ? "bg-primary/10 border border-primary" 
                                        : "bg-card border"
                                      }
                                      hover:bg-accent transition-colors
                                    `}
                                    onClick={() => toggleSkillSet(skill.id)}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-medium flex items-center gap-2">
                                          {skill.name}
                                          <Badge>{`Level ${skill.level}`}</Badge>
                                        </div>
                                        {skill.description && (
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {skill.description}
                                          </p>
                                        )}
                                      </div>
                                      <Checkbox 
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSkillSet(skill.id)}
                                        className="h-5 w-5"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                {form.watch("skillSetIds").length} skill sets selected
              </div>
              <Button 
                type="submit" 
                disabled={updateSkillSetsMutation.isPending}
              >
                {updateSkillSetsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}