import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
  medications?: string;
  conditions?: string;
  allergies?: string;
}

interface RequestBody {
  patientInfo: PatientInfo;
  question: string;
  doctorType?: string;
  doctorPrompt?: string;
  image?: string;
}

const validateInput = (body: RequestBody): { valid: boolean; error?: string } => {
  // Allow empty question if image is provided
  if (!body.question && !body.image) {
    return { valid: false, error: "السؤال أو الصورة مطلوبة" };
  }
  if (body.question && typeof body.question !== 'string') {
    return { valid: false, error: "السؤال غير صالح" };
  }
  if (body.question && body.question.length > 1000) {
    return { valid: false, error: "السؤال طويل جداً (الحد الأقصى 1000 حرف)" };
  }
  
  // Validate patient info fields
  const patientInfo = body.patientInfo || {};
  if (patientInfo.name && patientInfo.name.length > 100) {
    return { valid: false, error: "اسم المريض طويل جداً" };
  }
  if (patientInfo.medications && patientInfo.medications.length > 500) {
    return { valid: false, error: "قائمة الأدوية طويلة جداً" };
  }
  if (patientInfo.conditions && patientInfo.conditions.length > 500) {
    return { valid: false, error: "قائمة الحالات المرضية طويلة جداً" };
  }
  if (patientInfo.allergies && patientInfo.allergies.length > 500) {
    return { valid: false, error: "قائمة الحساسية طويلة جداً" };
  }
  
  return { valid: true };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return new Response(JSON.stringify({ error: "غير مصرح - يرجى تسجيل الدخول" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role to verify the JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user using the JWT directly
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      console.log("Auth error:", authError);
      return new Response(JSON.stringify({ error: "انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.log("Role check error:", roleError);
      return new Response(JSON.stringify({ error: "خطأ في التحقق من الصلاحيات" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!roleData) {
      console.log("User is not admin:", user.id);
      return new Response(JSON.stringify({ error: "غير مصرح - صلاحيات الأدمن مطلوبة" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin verified:", user.email);

    const body: RequestBody = await req.json();
    
    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { patientInfo, question, doctorPrompt, image } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use doctor-specific prompt if provided, otherwise use default
    const doctorContext = doctorPrompt || "أنت مساعد طبي ذكي. ستتلقى معلومات عن مريض وسؤال طبي. قدم إجابات مفيدة ومعلوماتية.";

    const systemPrompt = `${doctorContext}

تنويه مهم: هذه المعلومات للأغراض التعليمية فقط ولا تغني عن استشارة الطبيب المختص. يجب دائماً مراجعة الطبيب للحصول على تشخيص دقيق وعلاج مناسب.

معلومات المريض:
- الاسم: ${patientInfo.name || 'غير محدد'}
- العمر: ${patientInfo.age || 'غير محدد'}
- الجنس: ${patientInfo.gender || 'غير محدد'}
- الأدوية الحالية: ${patientInfo.medications || 'لا يوجد'}
- الحالات المرضية السابقة: ${patientInfo.conditions || 'لا يوجد'}
- الحساسية: ${patientInfo.allergies || 'لا يوجد'}

${image ? 'المريض أرفق صورة طبية (تحليل/أشعة/حالة مرضية). قم بتحليلها وتقديم ملاحظاتك الطبية.' : ''}`;

    // Build user message content
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    if (question) {
      userContent.push({ type: "text", text: question });
    } else if (image) {
      userContent.push({ type: "text", text: "حلل هذه الصورة الطبية وقدم ملاحظاتك" });
    }
    
    if (image) {
      userContent.push({ type: "image_url", image_url: { url: image } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمتابعة." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "حدث خطأ في الخدمة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Medical chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
