import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History, Trash2, MessageSquare, Loader2, ChevronDown, ChevronUp, User, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  patient_id: string | null;
  created_at: string;
  patient_name?: string;
  messages?: ConversationMessage[];
}

interface ConversationHistoryProps {
  patientId?: string;
  refreshTrigger?: number;
}

const ConversationHistory = ({ patientId, refreshTrigger }: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConversations = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from("medical_conversations")
      .select(`
        id,
        patient_id,
        created_at,
        patients (name)
      `)
      .order("created_at", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب المحادثات",
        variant: "destructive",
      });
    } else {
      const formattedData = data?.map((conv: any) => ({
        ...conv,
        patient_name: conv.patients?.name || "مريض غير محدد",
      })) || [];
      setConversations(formattedData);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [patientId, refreshTrigger]);

  const loadMessages = async (conversationId: string) => {
    if (expandedId === conversationId) {
      setExpandedId(null);
      return;
    }

    setLoadingMessages(conversationId);
    
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    } else {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, messages: data } : conv
        )
      );
      setExpandedId(conversationId);
    }
    
    setLoadingMessages(null);
  };

  const deleteConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("medical_conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المحادثة",
        variant: "destructive",
      });
    } else {
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      toast({
        title: "تم الحذف",
        description: "تم حذف المحادثة بنجاح",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-medical/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <History className="h-5 w-5 text-medical" />
          سجل المحادثات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-medical" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>لا توجد محادثات محفوظة</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="rounded-lg border border-medical/10 bg-background/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex flex-1 cursor-pointer items-center gap-2"
                      onClick={() => loadMessages(conv.id)}
                    >
                      <MessageSquare className="h-4 w-4 text-medical" />
                      <div>
                        <p className="font-medium text-foreground">
                          {conv.patient_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(conv.created_at)}
                        </p>
                      </div>
                      {loadingMessages === conv.id ? (
                        <Loader2 className="mr-auto h-4 w-4 animate-spin" />
                      ) : expandedId === conv.id ? (
                        <ChevronUp className="mr-auto h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-auto h-4 w-4" />
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف المحادثة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteConversation(conv.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {expandedId === conv.id && conv.messages && (
                    <div className="mt-3 space-y-2 border-t border-medical/10 pt-3">
                      {conv.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 ${
                            msg.role === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              msg.role === "user"
                                ? "bg-medical text-white"
                                : "bg-medical/10 text-medical"
                            }`}
                          >
                            {msg.role === "user" ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                          </div>
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === "user"
                                ? "bg-medical text-white"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {msg.image_url && (
                              <img
                                src={msg.image_url}
                                alt="صورة مرفقة"
                                className="mb-2 max-h-32 rounded object-contain"
                              />
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationHistory;
