import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Pill, Heart, AlertTriangle } from "lucide-react";

export interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  medications: string;
  conditions: string;
  allergies: string;
}

interface PatientFormProps {
  patientInfo: PatientInfo;
  onPatientInfoChange: (info: PatientInfo) => void;
}

const PatientForm = ({ patientInfo, onPatientInfoChange }: PatientFormProps) => {
  const handleChange = (field: keyof PatientInfo, value: string) => {
    onPatientInfoChange({ ...patientInfo, [field]: value });
  };

  return (
    <Card className="border-medical/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <User className="h-5 w-5 text-medical" />
          معلومات المريض
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-foreground/80">
              <User className="h-4 w-4" />
              الاسم الكامل
            </Label>
            <Input
              id="name"
              placeholder="أدخل اسم المريض"
              value={patientInfo.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20"
              dir="rtl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age" className="flex items-center gap-2 text-foreground/80">
              <Calendar className="h-4 w-4" />
              العمر
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="العمر بالسنوات"
              value={patientInfo.age}
              onChange={(e) => handleChange("age", e.target.value)}
              className="border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20"
              dir="rtl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="text-foreground/80">الجنس</Label>
          <Select value={patientInfo.gender} onValueChange={(value) => handleChange("gender", value)}>
            <SelectTrigger className="border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20">
              <SelectValue placeholder="اختر الجنس" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">ذكر</SelectItem>
              <SelectItem value="female">أنثى</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medications" className="flex items-center gap-2 text-foreground/80">
            <Pill className="h-4 w-4" />
            الأدوية الحالية
          </Label>
          <Textarea
            id="medications"
            placeholder="أدخل الأدوية التي يتناولها المريض حالياً..."
            value={patientInfo.medications}
            onChange={(e) => handleChange("medications", e.target.value)}
            className="min-h-[80px] border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="conditions" className="flex items-center gap-2 text-foreground/80">
            <Heart className="h-4 w-4" />
            الحالات المرضية السابقة
          </Label>
          <Textarea
            id="conditions"
            placeholder="مثل: السكري، الضغط، أمراض القلب..."
            value={patientInfo.conditions}
            onChange={(e) => handleChange("conditions", e.target.value)}
            className="min-h-[80px] border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies" className="flex items-center gap-2 text-foreground/80">
            <AlertTriangle className="h-4 w-4" />
            الحساسية
          </Label>
          <Textarea
            id="allergies"
            placeholder="أي حساسية معروفة للأدوية أو المواد..."
            value={patientInfo.allergies}
            onChange={(e) => handleChange("allergies", e.target.value)}
            className="min-h-[60px] border-medical/20 bg-background/50 focus:border-medical focus:ring-medical/20"
            dir="rtl"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientForm;
