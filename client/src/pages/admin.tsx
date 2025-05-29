import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema, insertMilestoneSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings, Users, Trophy, CheckCircle, LogOut } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { z } from "zod";

const campaignFormSchema = insertCampaignSchema.extend({
  total_days: z.number().min(1).max(365),
  title_en: z.string().min(1, "English title is required"),
  title_ar: z.string().min(1, "Arabic title is required"),
  description_en: z.string().min(1, "English description is required"),
  description_ar: z.string().min(1, "Arabic description is required"),
  reward_title_en: z.string().min(1, "English reward title is required"),
  reward_title_ar: z.string().min(1, "Arabic reward title is required"),
  reward_description_en: z.string().min(1, "English reward description is required"),
  reward_description_ar: z.string().min(1, "Arabic reward description is required"),
});

const milestoneFormSchema = insertMilestoneSchema.extend({
  day_number: z.number().min(1),
  order_index: z.number().min(0),
  title_en: z.string().min(1, "English title is required"),
  title_ar: z.string().min(1, "Arabic title is required"),
  description_en: z.string().min(1, "English description is required"),
  description_ar: z.string().min(1, "Arabic description is required"),
});

export default function Admin() {
  const { lang } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin, logout } = useAdminAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);

  // Queries
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/admin/campaigns"],
  });

  const { data: milestones = [] } = useQuery({
    queryKey: [`/admin/campaigns/${selectedCampaign}/milestones`],
    enabled: !!selectedCampaign,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["/api/admin/completions"],
  });

  const { data: campaignCompletions = [] } = useQuery({
    queryKey: ["/api/admin/campaign-completions"],
  });

  // Campaign mutations
  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign created successfully!" });
      setEditingCampaign(null);
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/admin/campaigns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign updated successfully!" });
      setEditingCampaign(null);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign deleted successfully!" });
    },
  });

  // Milestone mutations
  const createMilestoneMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/milestones", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${selectedCampaign}/milestones`] });
      toast({ title: "Milestone created successfully!" });
      setEditingMilestone(null);
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/admin/milestones/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${selectedCampaign}/milestones`] });
      toast({ title: "Milestone updated successfully!" });
      setEditingMilestone(null);
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/milestones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/campaigns/${selectedCampaign}/milestones`] });
      toast({ title: "Milestone deleted successfully!" });
    },
  });

  const CampaignForm = ({ campaign, onClose }: { campaign?: any; onClose: () => void }) => {
    const form = useForm({
      resolver: zodResolver(campaignFormSchema),
      defaultValues: campaign || {
        title_en: "",
        title_ar: "",
        description_en: "",
        description_ar: "",
        reward_title_en: "",
        reward_title_ar: "",
        reward_description_en: "",
        reward_description_ar: "",
        total_days: 7,
        is_active: false,
      },
    });

    const onSubmit = (data: any) => {
      if (campaign) {
        updateCampaignMutation.mutate({ id: campaign.id, data });
      } else {
        createCampaignMutation.mutate(data);
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Campaign Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Campaign Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reward_title_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Reward Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reward_title_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Reward Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reward_description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Reward Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reward_description_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Reward Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reward_code_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Reward Code</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter the reward code text to display when campaign is completed..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reward_code_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Reward Code</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="أدخل نص رمز المكافأة ليتم عرضه عند إكمال الحملة..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="total_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Days</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Active Campaign</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-2">
            <Button type="submit" disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}>
              {campaign ? "Update" : "Create"} Campaign
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  const MilestoneForm = ({ milestone, onClose }: { milestone?: any; onClose: () => void }) => {
    const form = useForm({
      resolver: zodResolver(milestoneFormSchema),
      defaultValues: milestone || {
        campaign_id: selectedCampaign,
        day_number: 1,
        title_en: "",
        title_ar: "",
        description_en: "",
        description_ar: "",
        order_index: 0,
      },
    });

    const onSubmit = (data: any) => {
      if (milestone) {
        updateMilestoneMutation.mutate({ id: milestone.id, data });
      } else {
        createMilestoneMutation.mutate(data);
      }
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="day_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day Number</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>English Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arabic Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="order_index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Index</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-2">
            <Button type="submit" disabled={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}>
              {milestone ? "Update" : "Create"} Milestone
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Activity Streak Admin</h1>
            <p className="text-gray-600">Manage campaigns, milestones, and view completion data</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {admin?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {admin?.role}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Milestones</span>
            </TabsTrigger>
            <TabsTrigger value="completions" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Task Completions</span>
            </TabsTrigger>
            <TabsTrigger value="campaign-completions" className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Campaign Winners</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Campaigns</h2>
              <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCampaign({})}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCampaign?.id ? "Edit Campaign" : "Create New Campaign"}
                    </DialogTitle>
                  </DialogHeader>
                  {editingCampaign && (
                    <CampaignForm
                      campaign={editingCampaign.id ? editingCampaign : null}
                      onClose={() => setEditingCampaign(null)}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign: any) => (
                <Card key={campaign.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        ID: {campaign.id} - {campaign.title_en}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {campaign.is_active && (
                          <Badge variant="default" className="bg-green-500">
                            Active
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCampaign(campaign)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{campaign.description_en}</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Duration: {campaign.total_days} days
                    </p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium text-sm">{campaign.reward_title_en}</p>
                      <p className="text-xs text-gray-600">{campaign.reward_description_en}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Milestones</h2>
              <div className="flex items-center space-x-4">
                <Select value={selectedCampaign?.toString()} onValueChange={(value) => setSelectedCampaign(parseInt(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign: any) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCampaign && (
                  <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingMilestone({})}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Milestone
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingMilestone?.id ? "Edit Milestone" : "Create New Milestone"}
                        </DialogTitle>
                      </DialogHeader>
                      <MilestoneForm
                        milestone={editingMilestone?.id ? editingMilestone : null}
                        onClose={() => setEditingMilestone(null)}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {selectedCampaign && (
              <div className="space-y-4">
                {Object.entries((milestones as any[]).reduce((acc: Record<number, any[]>, milestone: any) => {
                  const day = milestone.day_number;
                  if (!acc[day]) acc[day] = [];
                  acc[day].push(milestone);
                  return acc;
                }, {})).map(([dayNumber, dayMilestones]: [string, any[]]) => (
                  <Card key={dayNumber}>
                    <CardHeader>
                      <CardTitle>Day {dayNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dayMilestones.map((milestone: any) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  ID: {milestone.id}
                                </span>
                                <p className="font-medium">{milestone.title}</p>
                              </div>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                              <p className="text-xs text-gray-500">Order: {milestone.order_index}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMilestone(milestone)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completions" className="space-y-4">
            <h2 className="text-xl font-semibold">Completion Data</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {completions.length === 0 ? (
                    <p className="text-center text-gray-500">No completion data available</p>
                  ) : (
                    completions.map((completion: any) => (
                      <div key={completion.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">
                            User {completion.user_id} - Campaign {completion.campaign_id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Day {completion.day_number}, Milestone {completion.milestone_id}
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed: {new Date(completion.completed_at).toLocaleString()}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaign-completions" className="space-y-4">
            <h2 className="text-xl font-semibold">Campaign Winners</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {campaignCompletions.length === 0 ? (
                    <p className="text-center text-gray-500">No users have completed entire campaigns yet</p>
                  ) : (
                    (campaignCompletions as any[]).map((completion: any) => (
                      <div key={completion.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                        <div>
                          <p className="font-bold text-green-800">
                            🏆 User {completion.user_id} completed Campaign {completion.campaign_id}
                          </p>
                          <p className="text-sm text-green-700">
                            Finished all milestones and earned the reward
                          </p>
                          <p className="text-xs text-green-600">
                            Completed: {new Date(completion.completed_at).toLocaleString()}
                          </p>
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-500" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}