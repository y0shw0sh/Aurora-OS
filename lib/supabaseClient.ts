import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  "https://jmpnghceipmjaqwbqiwv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcG5naGNlaXBtamFxd2JxaXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDc5ODMsImV4cCI6MjA5ODM4Mzk4M30.D-wThQG0uq3JJ3F8IgisAWfIl4-y3iav3zuxl5X0HyY"
)