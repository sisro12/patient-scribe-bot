import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Loader2, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PatientInfo } from "./PatientForm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MedicalChatProps {
  patientInfo: PatientInfo;
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
    prompt: "أنت طبيب عام متخصص في الرعاية الصحية الأولية والتشخيص العام. قدم نصائح شاملة وحدد متى يجب إحالة المريض لأخصائي.",
    icon: "🩺"
  },
  {
    id: "cardiologist",
    name: "طبيب قلب",
    prompt: "أنت طبيب متخصص في أمراض القلب والأوعية الدموية. ركز على صحة القلب، ضغط الدم، الكوليسترول، وأمراض الشرايين.",
    icon: "❤️"
  },
  {
    id: "dermatologist",
    name: "طبيب جلدية",
    prompt: "أنت طبيب متخصص في الأمراض الجلدية. ركز على مشاكل البشرة، الحساسية الجلدية، الأكزيما، والصدفية.",
    icon: "🧴"
  },
  {
    id: "neurologist",
    name: "طبيب أعصاب",
    prompt: "أنت طبيب متخصص في أمراض الجهاز العصبي. ركز على الصداع، الصرع، السكتات الدماغية، وأمراض الأعصاب.",
    icon: "🧠"
  },
  {
    id: "orthopedic",
    name: "طبيب عظام",
    prompt: "أنت طبيب متخصص في جراحة العظام. ركز على كسور العظام، آلام المفاصل، التهاب المفاصل، وإصابات الرياضة.",
    icon: "🦴"
  },
  {
    id: "pediatrician",
    name: "طبيب أطفال",
    prompt: "أنت طبيب متخصص في طب الأطفال. ركز على صحة الأطفال، التطعيمات، النمو والتطور، وأمراض الطفولة الشائعة.",
    icon: "👶"
  },
  {
    id: "psychiatrist",
    name: "طبيب نفسي",
    prompt: "أنت طبيب متخصص في الطب النفسي. ركز على الاكتئاب، القلق، اضطرابات النوم، والصحة النفسية العامة.",
    icon: "🧘"
  },
  {
    id: "ophthalmologist",
    name: "طبيب عيون",
    prompt: "أنت طبيب متخصص في طب العيون. ركز على مشاكل الرؤية، الماء الأبيض، الماء الأزرق، وأمراض الشبكية.",
    icon: "👁️"
  },
  {
    id: "ent",
    name: "طبيب أنف وأذن وحنجرة",
    prompt: "أنت طبيب متخصص في أمراض الأنف والأذن والحنجرة. ركز على التهابات الأذن، الجيوب الأنفية، ومشاكل الحلق.",
    icon: "👂"
  },
  {
    id: "gastroenterologist",
    name: "طبيب جهاز هضمي",
    prompt: "أنت طبيب متخصص في أمراض الجهاز الهضمي. ركز على مشاكل المعدة، القولون، الكبد، وارتجاع المريء.",
    icon: "🫁"
  },
  {
    id: "pulmonologist",
    name: "طبيب صدر",
    prompt: "أنت طبيب متخصص في أمراض الجهاز التنفسي. ركز على الربو، الحساسية الصدرية، الالتهاب الرئوي، وأمراض الرئة.",
    icon: "🌬️"
  },
  {
    id: "urologist",
    name: "طبيب مسالك بولية",
    prompt: "أنت طبيب متخصص في أمراض المسالك البولية. ركز على التهابات المسالك، حصوات الكلى، ومشاكل البروستاتا.",
    icon: "💧"
  }
];

const MedicalChat = ({ patientInfo }: MedicalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("يرجى تسجيل الدخول أولاً");
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
          doctorPrompt: doctorType?.prompt
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

        <div className="flex gap-2">
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
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
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ⚠️ هذه المعلومات للأغراض التعليمية فقط ولا تغني عن استشارة الطبيب المختص
        </p>
      </CardContent>
    </Card>
  );
};

export default MedicalChat;
