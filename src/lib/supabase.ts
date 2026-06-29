import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://msajpzdstvevpxvgywva.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYWpwemRzdHZldnB4dmd5dndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzU5NTcsImV4cCI6MjA1Njg1MTk1N30.L-95o6qg5s5i2N2QGhjx7sW8q9g3n8r9e2U-h7v-264";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
