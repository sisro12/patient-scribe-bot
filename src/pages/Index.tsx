import { useState } from "react";
import PatientForm, { PatientInfo } from "@/components/PatientForm";
import MedicalChat from "@/components/MedicalChat";
import PatientsList from "@/components/PatientsList";
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePatientSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-medical/5" dir="rtl">
      {/* Header */}
      <header className="border-b border-medical/10 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-medical to-medical-dark shadow-lg shadow-medical/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">نظام إدارة المرضى</h1>
              <p className="text-sm text-muted-foreground">استشارات طبية ذكية</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-medical">
              <Heart className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">صحتك أولاً</span>
            </div>
            <div className="flex items-center gap-2 border-r pr-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            مرحباً بك في نظام الاستشارات الطبية
          </h2>
          <p className="text-muted-foreground">
            أدخل معلومات المريض واحفظها أو اطرح أسئلتك للحصول على معلومات طبية مفيدة
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <PatientForm 
              patientInfo={patientInfo} 
              onPatientInfoChange={setPatientInfo}
              onPatientSaved={handlePatientSaved}
            />
            <PatientsList refreshTrigger={refreshTrigger} />
          </div>
          <MedicalChat patientInfo={patientInfo} />
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
