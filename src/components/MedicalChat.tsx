import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Loader2, Stethoscope, ImagePlus, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PatientInfo } from "./PatientForm";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface MedicalChatProps {
  patientInfo: PatientInfo;
  selectedPatientId?: string;
  onConversationSaved?: () => void;
}

interface DoctorType {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}

const doctorTypes: DoctorType[] = [
  {
    id: "general",
    name: "طبيب عام",
    prompt: "أنت طبيب عام. أجب بشكل مختصر وصارم وواضح. لا تكرر المعلومات. قدم التشخيص المحتمل والعلاج المقترح في نقاط محددة.",
    icon: "🩺"
  },
  {
    id: "cardiologist",
    name: "طبيب قلب",
    prompt: "أنت طبيب قلب. أجب بشكل مختصر وصارم وواضح. ركز على صحة القلب والأوعية الدموية. قدم توصيات محددة وعملية.",
    icon: "❤️"
  },
  {
    id: "dermatologist",
    name: "طبيب جلدية",
    prompt: "أنت طبيب جلدية. أجب بشكل مختصر وصارم وواضح. حدد الحالة الجلدية والعلاج المناسب مباشرة.",
    icon: "🧴"
  },
  {
    id: "neurologist",
    name: "طبيب أعصاب",
    prompt: "أنت طبيب أعصاب. أجب بشكل مختصر وصارم وواضح. ركز على الأعراض العصبية والتشخيص والعلاج.",
    icon: "🧠"
  },
  {
    id: "orthopedic",
    name: "طبيب عظام",
    prompt: "أنت طبيب عظام. أجب بشكل مختصر وصارم وواضح. حدد المشكلة والعلاج المطلوب بدقة.",
    icon: "🦴"
  },
  {
    id: "pediatrician",
    name: "طبيب أطفال",
    prompt: "أنت طبيب أطفال. أجب بشكل مختصر وصارم وواضح. قدم تشخيصاً وعلاجاً مناسباً لعمر الطفل.",
    icon: "👶"
  },
  {
    id: "psychiatrist",
    name: "طبيب نفسي",
    prompt: "أنت طبيب نفسي. أجب بشكل مختصر وصارم وواضح. حدد الحالة النفسية وخطة العلاج المقترحة.",
    icon: "🧘"
  },
  {
    id: "ophthalmologist",
    name: "طبيب عيون",
    prompt: "أنت طبيب عيون. أجب بشكل مختصر وصارم وواضح. حدد مشكلة الرؤية والعلاج المناسب.",
    icon: "👁️"
  },
  {
    id: "ent",
    name: "طبيب أنف وأذن وحنجرة",
    prompt: "أنت طبيب أنف وأذن وحنجرة. أجب بشكل مختصر وصارم وواضح. حدد المشكلة والعلاج مباشرة.",
    icon: "👂"
  },
  {
    id: "gastroenterologist",
    name: "طبيب جهاز هضمي",
    prompt: "أنت طبيب جهاز هضمي. أجب بشكل مختصر وصارم وواضح. حدد مشكلة الجهاز الهضمي والعلاج.",
    icon: "🫁"
  },
  {
    id: "pulmonologist",
    name: "طبيب صدر",
    prompt: "أنت طبيب صدر. أجب بشكل مختصر وصارم وواضح. حدد مشكلة الجهاز التنفسي والعلاج المناسب.",
    icon: "🌬️"
  },
  {
    id: "urologist",
    name: "طبيب مسالك بولية",
    prompt: "أنت طبيب مسالك بولية. أجب بشكل مختصر وصارم وواضح. حدد المشكلة والعلاج بدقة.",
    icon: "💧"
  }
];

const MedicalChat = ({ patientInfo, selectedPatientId, onConversationSaved }: MedicalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("general");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (base64Image: string): Promise<string | null> => {
    try {
      const base64Data = base64Image.split(",")[1];
      const mimeType = base64Image.split(";")[0].split(":")[1];
      const extension = mimeType.split("/")[1];
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const { error } = await supabase.storage
        .from("conversation-images")
        .upload(fileName, blob);

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: publicUrl } = supabase.storage
        .from("conversation-images")
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      return null;
    }
  };

  const saveConversation = async () => {
    if (messages.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد رسائل لحفظها",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from("medical_conversations")
        .insert({
          patient_id: selectedPatientId || null,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Save messages with uploaded images
      const messagesToInsert = await Promise.all(
        messages.map(async (msg) => {
          let imageUrl = null;
          if (msg.image) {
            imageUrl = await uploadImage(msg.image);
          }
          return {
            conversation_id: convData.id,
            role: msg.role,
            content: msg.content,
            image_url: imageUrl,
          };
        })
      );

      const { error: msgError } = await supabase
        .from("conversation_messages")
        .insert(messagesToInsert);

      if (msgError) throw msgError;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ المحادثة بنجاح",
      });

      setMessages([]);
      onConversationSaved?.();
    } catch (error) {
      console.error("Save conversation error:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ المحادثة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صورة فقط",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = { role: "user", content: input, image: selectedImage || undefined };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    let assistantContent = "";

    try {
      // Refresh and get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !session?.access_token) {
        toast({
          title: "انتهت الجلسة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          variant: "destructive",
        });
        return;
      }

      const doctorType = doctorTypes.find(d => d.id === selectedDoctor);
      
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          patientInfo, 
          question: input,
          doctorType: doctorType?.id,
          doctorPrompt: doctorType?.prompt,
          image: imageToSend
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "حدث خطأ في الاتصال");
      }

      if (!resp.body) throw new Error("لا توجد بيانات");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentDoctor = doctorTypes.find(d => d.id === selectedDoctor);

  return (
    <Card className="flex h-[700px] flex-col border-medical/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Stethoscope className="h-5 w-5 text-medical" />
          استشارة طبية ذكية
        </CardTitle>
        <div className="mt-3">
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-full border-medical/20 bg-background/50">
              <SelectValue placeholder="اختر نوع الطبيب">
                {currentDoctor && (
                  <span className="flex items-center gap-2">
                    <span>{currentDoctor.icon}</span>
                    <span>{currentDoctor.name}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {doctorTypes.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  <span className="flex items-center gap-2">
                    <span>{doctor.icon}</span>
                    <span>{doctor.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 rounded-lg border border-medical/10 bg-background/30 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Bot className="h-12 w-12 text-medical/50" />
              <p>اختر نوع الطبيب واطرح سؤالك الطبي</p>
              <p className="text-sm text-muted-foreground/70">
                {currentDoctor?.name}: سيقدم لك نصائح متخصصة في مجاله
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === "user" ? "bg-medical text-white" : "bg-medical/10 text-medical"
                    }`}
                  >
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-medical text-white"
                        : "bg-muted text-foreground"
                    }`}
                    dir="rtl"
                  >
                    {message.image && (
                      <img 
                        src={message.image} 
                        alt="صورة مرفقة" 
                        className="mb-2 max-h-40 rounded-lg object-contain"
                      />
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-medical/10 text-medical">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <p className="text-sm text-muted-foreground">جاري التفكير...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {selectedImage && (
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="معاينة الصورة" 
              className="h-20 rounded-lg border border-medical/20 object-contain"
            />
            <button
              onClick={removeImage}
              className="absolute -left-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={sendMessage}
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="shrink-0 bg-medical hover:bg-medical-dark"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك الطبي هنا..."
            className="min-h-[50px] resize-none border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20"
            dir="rtl"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 border-medical/20 hover:bg-medical/10"
          >
            <ImagePlus className="h-4 w-4 text-medical" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={saveConversation}
            disabled={messages.length === 0 || isSaving}
            className="shrink-0 border-medical/20 hover:bg-medical/10"
            title="حفظ المحادثة"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 text-medical" />
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ⚠️ هذه المعلومات للأغراض التعليمية فقط ولا تغني عن استشارة الطبيب المختص
        </p>
      </CardContent>
    </Card>
  );
};

export default MedicalChat;
