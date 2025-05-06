import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SkillSet } from "@shared/types";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Form schema
const programFormSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  skillSetId: z.number({
    required_error: "Please select a skill set",
  }),
  skillSetLevel: z.number({
    required_error: "Please select a skill level",
  }),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  duration: z.string().min(1, "Duration is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  venue: z.enum(["VTC", "Face-to-Face"], {
    required_error: "Please select a venue type",
  }),
  location: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  certificateTitle: z.string().optional(),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

interface ProgramFormProps {
  programId?: number;
}

export function ProgramForm({ programId }: ProgramFormProps = {}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [newPrerequisite, setNewPrerequisite] = useState("");

  // Fetch skill sets for dropdown
  const { data: skillSets = [] } = useQuery<SkillSet[]>({
    queryKey: ["/api/skill-sets"],
    // Fallback to empty array if API doesn't exist yet
    queryFn: async () => {
      try {
        const res = await fetch("/api/skill-sets");
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error("Error fetching skill sets:", error);
        return [];
      }
    },
  });

  // Fetch program data if editing
  const { data: program, isLoading: isLoadingProgram } = useQuery({
    queryKey: [`/api/programs/${programId}`],
    enabled: !!programId,
  });

  // Form definition
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      skillSetId: undefined,
      skillSetLevel: 1,
      startDate: new Date(),
      duration: "",
      capacity: 20,
      venue: "Face-to-Face",
      location: "",
      objectives: [],
      prerequisites: [],
      passingScore: 70,
      certificateTitle: "",
    },
  });

  // Set form values when program data is loaded (for editing)
  React.useEffect(() => {
    if (program && programId) {
      form.reset({
        code: program.code,
        name: program.name,
        description: program.description || "",
        skillSetId: program.skillSetId,
        skillSetLevel: program.skillSetLevel,
        startDate: new Date(program.startDate),
        duration: program.duration,
        capacity: program.capacity,
        venue: program.venue as "VTC" | "Face-to-Face",
        location: program.location || "",
        objectives: program.objectives || [],
        prerequisites: program.prerequisites || [],
        passingScore: program.passingScore || 70,
        certificateTitle: program.certificateTitle || "",
      });
      setObjectives(program.objectives || []);
      setPrerequisites(program.prerequisites || []);
    }
  }, [program, programId, form]);

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (values: ProgramFormValues) => {
      const response = await apiRequest("POST", "/api/programs", {
        ...values,
        objectives,
        prerequisites,
        startDate: values.startDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Success",
        description: "Program created successfully.",
      });
      setLocation("/training-programs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
        variant: "destructive",
      });
    },
  });

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async (values: ProgramFormValues) => {
      const response = await apiRequest("PUT", `/api/programs/${programId}`, {
        ...values,
        objectives,
        prerequisites,
        startDate: values.startDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/programs/${programId}`] });
      toast({
        title: "Success",
        description: "Program updated successfully.",
      });
      setLocation("/training-programs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: ProgramFormValues) {
    // Add objectives and prerequisites to the data
    const formData = {
      ...data,
      objectives,
      prerequisites,
    };

    if (programId) {
      updateProgramMutation.mutate(formData);
    } else {
      createProgramMutation.mutate(formData);
    }
  }

  // Handle adding a new objective
  function handleAddObjective() {
    if (newObjective.trim() !== "") {
      setObjectives([...objectives, newObjective]);
      setNewObjective("");
    }
  }

  // Handle removing an objective
  function handleRemoveObjective(index: number) {
    const newObjectives = [...objectives];
    newObjectives.splice(index, 1);
    setObjectives(newObjectives);
  }

  // Handle adding a new prerequisite
  function handleAddPrerequisite() {
    if (newPrerequisite.trim() !== "") {
      setPrerequisites([...prerequisites, newPrerequisite]);
      setNewPrerequisite("");
    }
  }

  // Handle removing a prerequisite
  function handleRemovePrerequisite(index: number) {
    const newPrerequisites = [...prerequisites];
    newPrerequisites.splice(index, 1);
    setPrerequisites(newPrerequisites);
  }

  if (programId && isLoadingProgram) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Define the basic details of your training program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. NETBn-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for this program
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Network Security Fundamentals" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the program content and purpose"
                      className="resize-none min-h-32"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Set and Requirements</CardTitle>
            <CardDescription>
              Define the skill set category and level required for this program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="skillSetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Set Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Fallback categories if API isn't available yet */}
                        {skillSets.length === 0 ? (
                          <>
                            <SelectItem value="1">Cybersecurity</SelectItem>
                            <SelectItem value="2">IT Infrastructure</SelectItem>
                            <SelectItem value="3">Leadership</SelectItem>
                            <SelectItem value="4">Networking</SelectItem>
                            <SelectItem value="5">Communication</SelectItem>
                          </>
                        ) : (
                          skillSets.map((skillSet) => (
                            <SelectItem key={skillSet.id} value={skillSet.id.toString()}>
                              {skillSet.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skillSetLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Level</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Level 1 (Basic)</SelectItem>
                        <SelectItem value="2">Level 2 (Intermediate)</SelectItem>
                        <SelectItem value="3">Level 3 (Advanced)</SelectItem>
                        <SelectItem value="4">Level 4 (Expert)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prerequisites section */}
            <div>
              <FormLabel>Prerequisites</FormLabel>
              <FormDescription>
                List any prerequisites required for this program
              </FormDescription>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="Add a prerequisite"
                  value={newPrerequisite}
                  onChange={(e) => setNewPrerequisite(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPrerequisite();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPrerequisite}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {prerequisites.map((prerequisite, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md bg-secondary"
                  >
                    <span className="text-sm">{prerequisite}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePrerequisite(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {prerequisites.length === 0 && (
                  <p className="text-sm text-neutral-dark dark:text-neutral-light italic">
                    No prerequisites added
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule and Logistics</CardTitle>
            <CardDescription>
              Define when and how the program will be conducted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2 Weeks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of trainees
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select venue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Face-to-Face">Face-to-Face</SelectItem>
                        <SelectItem value="VTC">VTC (Virtual)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Training Room B or Virtual Meeting Link" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical location or virtual meeting details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Objectives and Certification</CardTitle>
            <CardDescription>
              Define the learning objectives and certification details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Objectives section */}
            <div>
              <FormLabel>Learning Objectives</FormLabel>
              <FormDescription>
                List what trainees will learn from this program
              </FormDescription>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="Add an objective"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddObjective();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddObjective}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {objectives.map((objective, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md bg-secondary"
                  >
                    <span className="text-sm">{objective}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveObjective(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {objectives.length === 0 && (
                  <p className="text-sm text-neutral-dark dark:text-neutral-light italic">
                    No objectives added
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum score required to pass (%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="certificateTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Title (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Network Security Specialist" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Title to display on the certificate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/training-programs")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createProgramMutation.isPending || updateProgramMutation.isPending
            }
          >
            {programId ? (
              updateProgramMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Update Program"
              )
            ) : createProgramMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Create Program"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
