-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  medications TEXT,
  conditions TEXT,
  allergies TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required for this app)
CREATE POLICY "Allow public read access" 
ON public.patients 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.patients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON public.patients 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access" 
ON public.patients 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();