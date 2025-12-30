// config.js
const SUPABASE_CONFIG = {
    URL: "https://xczrexzzmmrpdokcitvg.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjenJleHp6bW1ycGRva2NpdHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDExNDEsImV4cCI6MjA3NjA3NzE0MX0.RoTn4GQ7yOKhGInH6aIuuXpmlvzFfx0tY6gn9Myx1Gk"
};

// دالة للحصول على إعدادات Supabase
function getSupabaseConfig() {
    return {
        supabaseUrl: SUPABASE_CONFIG.URL,
        supabaseKey: SUPABASE_CONFIG.ANON_KEY
    };
}
