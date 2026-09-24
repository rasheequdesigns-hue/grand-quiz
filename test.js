import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qpgnzgowqjvdpkxrdect.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZ256Z293cWp2ZHBreHJkZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzEyNjUsImV4cCI6MjEwMjQ0NzI2NX0.m7v9Qp_DI2RuIJ9VnQJiFAm5H51NMM9bHgfL_cCTSqM'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  const { data, error } = await supabase
    .from('granddb')
    .insert({
      record_type: 'setting',
      name: 'Test Quiz',
      question_text: 'short-test-string'
    })
    .select()
    .single()

  console.log("INSERT SETTING DATA:", data)
  console.log("INSERT ERROR:", error)

  if (error) {
    console.error("INSERT ERROR:", error)
  } else {
    console.log("INSERT SUCCESS:", data)
  }
}

testInsert()
