import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, MeetingSuggestion } from "@shared/types";

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
import { 
  Calendar as CalendarIcon, 
  Check, 
  Clock, 
  Loader2, 
  Plus, 
  Users, 
  X, 
  Calendar as CalendarIconSolid,
  Info,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  Circle,
  CalendarX,
  CalendarClock,
  CalendarDays,
  CalendarRange
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Form schema
const meetingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startTime: z.date({
    required_error: "Please select a start time",
  }),
  endTime: z.date({
    required_error: "Please select an end time",
  }),
  location: z.string().optional(),
  type: z.enum(["VTC", "Face-to-Face"], {
    required_error: "Please select a meeting type",
  }),
  participants: z.array(z.number()).min(1, "Please select at least one participant"),
  participantSettings: z.array(z.object({
    userId: z.number(),
    role: z.enum([
      'Organizer', 
      'Attendee', 
      'Presenter', 
      'Stakeholder', 
      'Observer', 
      'Subject Matter Expert', 
      'Trainee', 
      'Trainer', 
      'Optional'
    ]).optional().default('Attendee'),
    requiredAttendance: z.boolean().optional().default(true),
  })).optional().default([]),
  agenda: z.array(z.string()).optional(),
  notes: z.string().optional(),
  priority: z.enum(['High', 'Normal', 'Low']).optional().default('Normal'),
  recurrence: z.enum(['None', 'Daily', 'Weekly', 'Monthly']).optional().default('None'),
  tags: z.array(z.string()).optional().default([]),
  requiredAttendance: z.boolean().optional().default(true),
})
.refine(
  (data) => data.endTime > data.startTime,
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

type MeetingFormValues = z.infer<typeof meetingFormSchema>;

interface MeetingFormProps {
  meetingId?: number;
}

export function MeetingForm({ meetingId }: MeetingFormProps = {}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [agenda, setAgenda] = useState<string[]>([]);
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [showAiSuggestionDialog, setShowAiSuggestionDialog] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<MeetingSuggestion | null>(null);
  const [isLoadingAiSuggestion, setIsLoadingAiSuggestion] = useState(false);

  // Fetch users for participant selection
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch meeting data if editing
  const { data: meeting, isLoading: isLoadingMeeting } = useQuery({
    queryKey: [`/api/meetings/${meetingId}`],
    enabled: !!meetingId,
  });

  // Form definition
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
      location: "",
      type: "Face-to-Face",
      participants: [],
      participantSettings: [],
      agenda: [],
      notes: "",
      priority: "Normal",
      recurrence: "None",
      tags: [],
      requiredAttendance: true,
    },
  });

  // Set form values when meeting data is loaded (for editing)
  useEffect(() => {
    if (meeting && meetingId) {
      // Create participant settings from meeting participants
      const participantSettings = meeting.participants.map(participant => ({
        userId: participant.id,
        role: 'Attendee' as const,
        requiredAttendance: meeting.requiredAttendance ?? true,
      }));
      
      form.reset({
        title: meeting.title,
        description: meeting.description || "",
        startTime: new Date(meeting.startTime),
        endTime: new Date(meeting.endTime),
        location: meeting.location || "",
        type: meeting.type as "VTC" | "Face-to-Face",
        participants: meeting.participants.map(p => p.id),
        participantSettings,
        agenda: meeting.agenda || [],
        notes: meeting.notes || "",
        priority: meeting.priority || "Normal",
        recurrence: meeting.recurrence || "None",
        tags: meeting.tags || [],
        requiredAttendance: meeting.requiredAttendance ?? true,
      });
      setAgenda(meeting.agenda || []);
      setSelectedParticipants(meeting.participants);
    }
  }, [meeting, meetingId, form]);

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: async (values: MeetingFormValues) => {
      const response = await apiRequest("POST", "/api/meetings", {
        ...values,
        agenda,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Success",
        description: "Meeting scheduled successfully.",
      });
      navigate("/meetings");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    },
  });

  // Update meeting mutation
  const updateMeetingMutation = useMutation({
    mutationFn: async (values: MeetingFormValues) => {
      const response = await apiRequest("PUT", `/api/meetings/${meetingId}`, {
        ...values,
        agenda,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
      toast({
        title: "Success",
        description: "Meeting updated successfully.",
      });
      navigate("/meetings");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meeting",
        variant: "destructive",
      });
    },
  });

  // AI suggestion mutation
  const getAiSuggestionMutation = useMutation({
    mutationFn: async ({ 
      participantIds, 
      meetingPurpose, 
      priority, 
      participantSettings 
    }: { 
      participantIds: number[], 
      meetingPurpose: string,
      priority?: string, 
      participantSettings?: Array<{ userId: number, requiredAttendance: boolean }>
    }) => {
      setIsLoadingAiSuggestion(true);
      try {
        const response = await apiRequest("POST", "/api/meetings/suggest-time", {
          participantIds,
          meetingPurpose,
          durationMinutes: 60, // Default to 1 hour meeting
          priority,
          participantSettings,
        });
        const data = await response.json();
        setIsLoadingAiSuggestion(false);
        return data;
      } catch (error) {
        setIsLoadingAiSuggestion(false);
        throw error;
      }
    },
    onSuccess: (data: MeetingSuggestion) => {
      setAiSuggestion(data);
      setShowAiSuggestionDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI suggestion",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: MeetingFormValues) {
    // Add agenda to the data
    const formData = {
      ...data,
      agenda,
    };

    if (meetingId) {
      updateMeetingMutation.mutate(formData);
    } else {
      createMeetingMutation.mutate(formData);
    }
  }

  // Handle adding a new agenda item
  function handleAddAgendaItem() {
    if (newAgendaItem.trim() !== "") {
      setAgenda([...agenda, newAgendaItem]);
      setNewAgendaItem("");
    }
  }

  // Handle removing an agenda item
  function handleRemoveAgendaItem(index: number) {
    const newAgenda = [...agenda];
    newAgenda.splice(index, 1);
    setAgenda(newAgenda);
  }

  // Handle selecting a user as participant
  function handleSelectUser(userId: number, checked: boolean) {
    setSelectedUsers(
      checked
        ? [...selectedUsers, userId]
        : selectedUsers.filter((id) => id !== userId)
    );
  }

  // Handle adding selected users as participants
  function handleAddParticipants() {
    const currentParticipants = form.getValues("participants") || [];
    const newParticipants = [...new Set([...currentParticipants, ...selectedUsers])];
    form.setValue("participants", newParticipants);
    
    // Update the selectedParticipants array for display
    const participantUsers = users.filter(user => newParticipants.includes(user.id));
    setSelectedParticipants(participantUsers);
    
    setSelectedUsers([]);
    setIsAddingParticipants(false);
  }

  // Handle removing a participant
  function handleRemoveParticipant(userId: number) {
    const currentParticipants = form.getValues("participants") || [];
    const newParticipants = currentParticipants.filter(id => id !== userId);
    form.setValue("participants", newParticipants);
    
    // Update the selectedParticipants array for display
    setSelectedParticipants(prev => prev.filter(user => user.id !== userId));
  }

  // Get AI suggestion for meeting time
  function handleGetAiSuggestion() {
    const participants = form.getValues("participants") || [];
    const title = form.getValues("title") || "";
    const priority = form.getValues("priority");
    const requiredAttendance = form.getValues("requiredAttendance");
    const participantSettings = form.getValues("participantSettings");
    
    if (participants.length === 0) {
      toast({
        title: "Missing Participants",
        description: "Please select participants before requesting a suggestion",
        variant: "destructive",
      });
      return;
    }
    
    // Create participant settings if not already set
    const settings = participantSettings.length > 0 
      ? participantSettings
      : participants.map(id => ({
          userId: id,
          requiredAttendance: requiredAttendance || true,
        }));
    
    getAiSuggestionMutation.mutate({
      participantIds: participants,
      meetingPurpose: title,
      priority,
      participantSettings: settings,
    });
  }

  // Apply AI suggestion to form
  function applyAiSuggestion() {
    if (!aiSuggestion) return;
    
    try {
      // Parse date and time from suggestion
      const suggestedDate = new Date(aiSuggestion.suggestedDate);
      const [hours, minutes] = aiSuggestion.suggestedTime.split(":").map(Number);
      
      // Set the hours and minutes on the suggested date
      suggestedDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time (1 hour later by default)
      const endTime = new Date(suggestedDate);
      endTime.setHours(endTime.getHours() + 1);
      
      // Update form fields
      form.setValue("startTime", suggestedDate);
      form.setValue("endTime", endTime);
      
      setShowAiSuggestionDialog(false);
      
      toast({
        title: "Success",
        description: "AI suggestion applied to the meeting schedule",
      });
    } catch (error) {
      console.error("Error applying AI suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to apply AI suggestion",
        variant: "destructive",
      });
    }
  }

  // Filtered users for participant selection
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.rank && user.rank.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.unit && user.unit.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (meetingId && isLoadingMeeting) {
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
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>
              Define the basic information for your meeting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Network Security Planning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of the meeting"
                      className="resize-none min-h-24"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="High">
                          <div className="flex items-center">
                            <ArrowUpCircle className="mr-2 h-4 w-4 text-red-500" />
                            <span>High</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Normal">
                          <div className="flex items-center">
                            <Circle className="mr-2 h-4 w-4 text-blue-500" />
                            <span>Normal</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Low">
                          <div className="flex items-center">
                            <ArrowDownCircle className="mr-2 h-4 w-4 text-gray-500" />
                            <span>Low</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the importance level of this meeting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurrence</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recurrence pattern" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">
                          <div className="flex items-center">
                            <CalendarX className="mr-2 h-4 w-4" />
                            <span>None</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Daily">
                          <div className="flex items-center">
                            <CalendarClock className="mr-2 h-4 w-4" />
                            <span>Daily</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Weekly">
                          <div className="flex items-center">
                            <CalendarDays className="mr-2 h-4 w-4" />
                            <span>Weekly</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Monthly">
                          <div className="flex items-center">
                            <CalendarRange className="mr-2 h-4 w-4" />
                            <span>Monthly</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How frequently this meeting should recur
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="requiredAttendance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Required Attendance</FormLabel>
                    <FormDescription>
                      Make this meeting mandatory for all participants by default
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>
                  Select when the meeting will take place
                </CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetAiSuggestion}
                      disabled={isLoadingAiSuggestion}
                    >
                      {isLoadingAiSuggestion ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      AI Suggest Time
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI to suggest an optimal meeting time based on participant availability</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
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
                            onSelect={(date) => {
                              const newDate = new Date(field.value);
                              newDate.setFullYear(date!.getFullYear(), date!.getMonth(), date!.getDate());
                              field.onChange(newDate);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                                format(field.value, "h:mm a")
                              ) : (
                                <span>Set time</span>
                              )}
                              <Clock className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="start">
                          <div className="grid gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                onValueChange={(value) => {
                                  const newDate = new Date(field.value);
                                  newDate.setHours(parseInt(value));
                                  field.onChange(newDate);
                                }}
                                value={field.value.getHours().toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {i.toString().padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                onValueChange={(value) => {
                                  const newDate = new Date(field.value);
                                  newDate.setMinutes(parseInt(value));
                                  field.onChange(newDate);
                                }}
                                value={field.value.getMinutes().toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                    <SelectItem key={minute} value={minute.toString()}>
                                      {minute.toString().padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
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
                            onSelect={(date) => {
                              const newDate = new Date(field.value);
                              newDate.setFullYear(date!.getFullYear(), date!.getMonth(), date!.getDate());
                              field.onChange(newDate);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                                format(field.value, "h:mm a")
                              ) : (
                                <span>Set time</span>
                              )}
                              <Clock className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="start">
                          <div className="grid gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                onValueChange={(value) => {
                                  const newDate = new Date(field.value);
                                  newDate.setHours(parseInt(value));
                                  field.onChange(newDate);
                                }}
                                value={field.value.getHours().toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {i.toString().padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                onValueChange={(value) => {
                                  const newDate = new Date(field.value);
                                  newDate.setMinutes(parseInt(value));
                                  field.onChange(newDate);
                                }}
                                value={field.value.getMinutes().toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                    <SelectItem key={minute} value={minute.toString()}>
                                      {minute.toString().padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location and Type</CardTitle>
            <CardDescription>
              Define how and where the meeting will be conducted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meeting type" />
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
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={
                          form.watch("type") === "VTC" 
                            ? "e.g. Meeting Link or Virtual Room ID" 
                            : "e.g. Conference Room A"
                        } 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {form.watch("type") === "VTC" 
                        ? "Virtual meeting link or room information" 
                        : "Physical location of the meeting"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Participants</CardTitle>
                <CardDescription>
                  Invite people to the meeting
                </CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddingParticipants(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Add Participants
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem>
                  {selectedParticipants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {selectedParticipants.map((participant) => {
                        // Find participant settings if they exist
                        const settings = form.getValues("participantSettings").find(
                          (ps) => ps.userId === participant.id
                        ) || {
                          userId: participant.id,
                          role: 'Attendee',
                          requiredAttendance: form.getValues("requiredAttendance"),
                        };
                        
                        // Add settings if they don't exist
                        if (!form.getValues("participantSettings").some(ps => ps.userId === participant.id)) {
                          const currentSettings = form.getValues("participantSettings");
                          form.setValue("participantSettings", [...currentSettings, settings]);
                        }
                        
                        return (
                          <div
                            key={participant.id}
                            className="flex flex-col p-3 border rounded-md bg-secondary"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  {participant.avatarUrl ? (
                                    <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                                  ) : null}
                                  <AvatarFallback>
                                    {participant.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{participant.name}</span>
                                {participant.rank && (
                                  <span className="ml-2 text-xs text-muted-foreground">{participant.rank}</span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveParticipant(participant.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                              <Select
                                value={settings.role || 'Attendee'}
                                onValueChange={(value) => {
                                  const currentSettings = form.getValues("participantSettings");
                                  const updatedSettings = currentSettings.map(ps => 
                                    ps.userId === participant.id 
                                      ? { ...ps, role: value } 
                                      : ps
                                  );
                                  form.setValue("participantSettings", updatedSettings);
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Organizer">Organizer</SelectItem>
                                  <SelectItem value="Attendee">Attendee</SelectItem>
                                  <SelectItem value="Presenter">Presenter</SelectItem>
                                  <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                                  <SelectItem value="Observer">Observer</SelectItem>
                                  <SelectItem value="Subject Matter Expert">SME</SelectItem>
                                  <SelectItem value="Trainee">Trainee</SelectItem>
                                  <SelectItem value="Trainer">Trainer</SelectItem>
                                  <SelectItem value="Optional">Optional</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`required-${participant.id}`}
                                  checked={settings.requiredAttendance}
                                  onCheckedChange={(checked) => {
                                    const currentSettings = form.getValues("participantSettings");
                                    const updatedSettings = currentSettings.map(ps => 
                                      ps.userId === participant.id 
                                        ? { ...ps, requiredAttendance: !!checked } 
                                        : ps
                                    );
                                    form.setValue("participantSettings", updatedSettings);
                                  }}
                                />
                                <Label 
                                  htmlFor={`required-${participant.id}`} 
                                  className="text-xs cursor-pointer"
                                >
                                  Required attendance
                                </Label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mt-2">
                      No participants selected. Click "Add Participants" to invite people.
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormDescription>
                    Add keywords to categorize this meeting (comma-separated)
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="e.g. security, training, planning"
                      value={field.value.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                        field.onChange(tags);
                      }}
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
            <CardTitle>Agenda and Notes</CardTitle>
            <CardDescription>
              Define the meeting agenda and any additional notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel>Meeting Agenda (Optional)</FormLabel>
              <FormDescription>
                List the topics to be discussed during the meeting
              </FormDescription>
              <div className="flex space-x-2 mt-2">
                <Input
                  placeholder="Add an agenda item"
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAgendaItem();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAgendaItem}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {agenda.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md bg-secondary"
                  >
                    <span className="text-sm">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAgendaItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {agenda.length === 0 && (
                  <p className="text-sm text-neutral-dark dark:text-neutral-light italic">
                    No agenda items added
                  </p>
                )}
              </div>
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or context"
                      className="resize-none min-h-24"
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

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/meetings")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createMeetingMutation.isPending || updateMeetingMutation.isPending
            }
          >
            {meetingId ? (
              updateMeetingMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Update Meeting"
              )
            ) : createMeetingMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Schedule Meeting"
            )}
          </Button>
        </div>
      </form>
      
      {/* Participant Selection Dialog */}
      <Dialog open={isAddingParticipants} onOpenChange={setIsAddingParticipants}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Participants</DialogTitle>
            <DialogDescription>
              Select the users you want to invite to this meeting
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                  No users found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-2 border rounded-md"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(user.id, checked as boolean)
                        }
                      />
                      <div className="flex items-center flex-1">
                        <Avatar className="h-8 w-8 mr-2">
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                          ) : null}
                          <AvatarFallback>
                            {user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <label
                            htmlFor={`user-${user.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {user.name}
                          </label>
                          <p className="text-xs text-neutral-dark dark:text-neutral-light">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingParticipants(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParticipants}>
              <Check className="mr-2 h-4 w-4" />
              Add Selected ({selectedUsers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Suggestion Dialog */}
      <Dialog open={showAiSuggestionDialog} onOpenChange={setShowAiSuggestionDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              AI Suggested Meeting Time
            </DialogTitle>
            <DialogDescription>
              Based on participants' schedules and availability
            </DialogDescription>
          </DialogHeader>
          
          {aiSuggestion ? (
            <div className="py-4 space-y-4">
              <div className="bg-secondary rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CalendarIconSolid className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold">Suggested Time</h3>
                </div>
                <p className="text-lg font-medium">
                  {new Date(aiSuggestion.suggestedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-lg font-medium">
                  {aiSuggestion.suggestedTime} - {
                    (() => {
                      const [hours, minutes] = aiSuggestion.suggestedTime.split(":").map(Number);
                      const endTime = new Date();
                      endTime.setHours(hours + 1, minutes);
                      return endTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true
                      });
                    })()
                  }
                </p>
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <Info className="h-4 w-4 mr-2 text-neutral-dark dark:text-neutral-light" />
                  <p className="text-sm text-neutral-dark dark:text-neutral-light">AI Reasoning</p>
                </div>
                <p className="text-sm">{aiSuggestion.reason}</p>
              </div>
              
              <div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-neutral-dark dark:text-neutral-light" />
                  <p className="text-sm text-neutral-dark dark:text-neutral-light">
                    {aiSuggestion.availableParticipants} of {aiSuggestion.totalParticipants} participants available
                  </p>
                </div>
                <div className="w-full bg-neutral-light dark:bg-neutral-dark h-2 rounded-full mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${(aiSuggestion.availableParticipants / aiSuggestion.totalParticipants) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Alternative Times Section */}
              {aiSuggestion.alternativeTimes && aiSuggestion.alternativeTimes.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 mr-2 text-neutral-dark dark:text-neutral-light" />
                    <h3 className="text-sm font-semibold">Alternative Times</h3>
                  </div>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                    {aiSuggestion.alternativeTimes.map((alt, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 bg-secondary/50 rounded-md text-sm hover:bg-secondary transition-colors"
                        role="button"
                        onClick={() => {
                          // Create a new suggestion object with the alternative time
                          const newSuggestion = {
                            ...aiSuggestion,
                            suggestedDate: alt.date,
                            suggestedTime: alt.time,
                            availableParticipants: alt.availableParticipants,
                            // Preserve other properties
                          };
                          setAiSuggestion(newSuggestion);
                        }}
                      >
                        <div>
                          <span className="font-medium">
                            {new Date(alt.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="mx-2">at</span>
                          <span className="font-medium">{alt.time}</span>
                        </div>
                        <Badge variant="outline" className="ml-2 whitespace-nowrap">
                          {alt.availableParticipants}/{aiSuggestion.totalParticipants} available
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflict Details Section */}
              {aiSuggestion.conflictDetails && (
                <div className="mt-4 border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-500 mr-2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Scheduling Conflicts</h3>
                  </div>
                  
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                    {aiSuggestion.conflictDetails.conflictResolutionSuggestion}
                  </div>
                  
                  <div className="max-h-[120px] overflow-y-auto pr-1">
                    <table className="w-full text-xs">
                      <thead className="text-amber-800 dark:text-amber-400">
                        <tr>
                          <th className="text-left py-1">Participant</th>
                          <th className="text-left py-1">Conflict</th>
                        </tr>
                      </thead>
                      <tbody className="text-amber-700 dark:text-amber-300">
                        {aiSuggestion.conflictDetails.conflictingParticipants.map((participant, index) => (
                          <tr key={index} className="border-t border-amber-200/50 dark:border-amber-700/30">
                            <td className="py-1">{participant.name}</td>
                            <td className="py-1">{participant.conflictReason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p>Generating meeting time suggestion...</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiSuggestionDialog(false)}>
              Ignore
            </Button>
            <Button onClick={applyAiSuggestion} disabled={!aiSuggestion}>
              Apply Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
