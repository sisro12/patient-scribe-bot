-- Create table for medical conversations
CREATE TABLE public.medical_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for conversation messages
CREATE TABLE public.conversation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.medical_conversations(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    image_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for medical_conversations
CREATE POLICY "Admins can read conversations" ON public.medical_conversations
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert conversations" ON public.medical_conversations
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can delete conversations" ON public.medical_conversations
FOR DELETE USING (is_admin());

-- RLS policies for conversation_messages
CREATE POLICY "Admins can read messages" ON public.conversation_messages
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert messages" ON public.conversation_messages
FOR INSERT WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_medical_conversations_updated_at
BEFORE UPDATE ON public.medical_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for conversation images
INSERT INTO storage.buckets (id, name, public) VALUES ('conversation-images', 'conversation-images', true);

-- Storage policies
CREATE POLICY "Anyone can view conversation images" ON storage.objects
FOR SELECT USING (bucket_id = 'conversation-images');

CREATE POLICY "Authenticated users can upload conversation images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'conversation-images' AND auth.role() = 'authenticated');