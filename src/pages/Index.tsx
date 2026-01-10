import { useState } from "react";
import PatientForm, { PatientInfo } from "@/components/PatientForm";
import MedicalChat from "@/components/MedicalChat";
import PatientsList from "@/components/PatientsList";
import ConversationHistory from "@/components/ConversationHistory";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Stethoscope, Heart, LogOut, User } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: "",
    gender: "",
    medications: "",
    conditions: "",
    allergies: "",
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversationRefreshTrigger, setConversationRefreshTrigger] = useState(0);

  const handlePatientSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePatientSelect = (info: PatientInfo, patientId?: string) => {
    setPatientInfo(info);
    setSelectedPatientId(patientId);
  };

  const handleConversationSaved = () => {
    setConversationRefreshTrigger((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-medical/5" dir="rtl">
      {/* Header */}
      <header className="border-b border-medical/10 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-medical to-medical-dark shadow-lg shadow-medical/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">نظام إدارة المرضى</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">استشارات طبية ذكية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
            <div className="hidden md:flex items-center gap-2 text-medical">
              <Heart className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">صحتك أولاً</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 border-r pr-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8 text-center">
          <h2 className="mb-2 text-xl sm:text-2xl font-bold text-foreground">
            مرحباً بك في نظام الاستشارات الطبية
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            أدخل معلومات المريض واحفظها أو اطرح أسئلتك للحصول على معلومات طبية مفيدة
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <PatientForm 
              patientInfo={patientInfo} 
              onPatientInfoChange={setPatientInfo}
              onPatientSaved={handlePatientSaved}
            />
            <PatientsList 
              refreshTrigger={refreshTrigger} 
              onSelectPatient={handlePatientSelect} 
            />
            <ConversationHistory refreshTrigger={conversationRefreshTrigger} />
          </div>
          <div className="order-1 lg:order-2">
            <MedicalChat 
              patientInfo={patientInfo} 
              selectedPatientId={selectedPatientId}
              onConversationSaved={handleConversationSaved}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-medical/10 bg-card/30 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>جميع المعلومات المقدمة للأغراض التعليمية فقط - استشر طبيبك دائماً</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
