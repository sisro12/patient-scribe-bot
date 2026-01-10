import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, Trash2, Loader2, MousePointer, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { PatientInfo } from "./PatientForm";

interface Patient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  medications: string | null;
  conditions: string | null;
  allergies: string | null;
  created_at: string;
}

interface PatientsListProps {
  refreshTrigger: number;
  onSelectPatient?: (patient: PatientInfo, patientId?: string) => void;
}

const PatientsList = ({ refreshTrigger, onSelectPatient }: PatientsListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchPatients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المرضى",
        variant: "destructive",
      });
    } else {
      setPatients(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [refreshTrigger]);

  const deletePatient = async (id: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف المريض",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحذف",
        description: "تم حذف بيانات المريض بنجاح",
      });
      fetchPatients();
    }
  };

  const exportToExcel = () => {
    if (patients.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا يوجد مرضى لتصديرهم",
        variant: "destructive",
      });
      return;
    }

    const exportData = patients.map((p) => ({
      الاسم: p.name,
      العمر: p.age || "",
      الجنس: p.gender === "male" ? "ذكر" : p.gender === "female" ? "أنثى" : "",
      الأدوية: p.medications || "",
      "الحالات المرضية": p.conditions || "",
      الحساسية: p.allergies || "",
      "تاريخ الإضافة": new Date(p.created_at).toLocaleDateString("ar-SA"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المرضى");
    XLSX.writeFile(workbook, `سجل_المرضى_${new Date().toLocaleDateString("ar-SA")}.xlsx`);

    toast({
      title: "تم التصدير",
      description: "تم تصدير البيانات بنجاح",
    });
  };

  return (
    <Card className="border-medical/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-3 sm:gap-4 pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-foreground">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-medical" />
            سجل المرضى ({filteredPatients.length})
          </CardTitle>
          <Button
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="border-medical/20 text-medical hover:bg-medical/10 text-xs sm:text-sm"
            disabled={patients.length === 0}
          >
            <Download className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">تصدير</span> Excel
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مريض بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 border-medical/20 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-medical" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
            {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا يوجد مرضى مسجلين حالياً"}
          </div>
        ) : (
          <ScrollArea className="h-[250px] sm:h-[300px]">
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 border rounded-lg bg-background/50 cursor-pointer hover:bg-medical/5 transition-colors"
                  onClick={() => onSelectPatient?.({
                    name: patient.name,
                    age: patient.age?.toString() || "",
                    gender: patient.gender || "",
                    medications: patient.medications || "",
                    conditions: patient.conditions || "",
                    allergies: patient.allergies || "",
                  }, patient.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-3 w-3 text-medical opacity-50" />
                      <span className="font-medium text-sm">{patient.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePatient(patient.id);
                      }}
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>العمر: {patient.age || "-"}</span>
                    <span>الجنس: {patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "-"}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table View */}
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">العمر</TableHead>
                  <TableHead className="text-right">الجنس</TableHead>
                  <TableHead className="text-right">الأدوية</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow 
                    key={patient.id}
                    className="cursor-pointer hover:bg-medical/5 transition-colors"
                    onClick={() => onSelectPatient?.({
                      name: patient.name,
                      age: patient.age?.toString() || "",
                      gender: patient.gender || "",
                      medications: patient.medications || "",
                      conditions: patient.conditions || "",
                      allergies: patient.allergies || "",
                    }, patient.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MousePointer className="h-3 w-3 text-medical opacity-50" />
                        {patient.name}
                      </div>
                    </TableCell>
                    <TableCell>{patient.age || "-"}</TableCell>
                    <TableCell>
                      {patient.gender === "male" ? "ذكر" : patient.gender === "female" ? "أنثى" : "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {patient.medications || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePatient(patient.id);
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientsList;
