// Configuração pública do Supabase (a chave "anon" é pública por design; quem protege os dados é o RLS do banco).
// NUNCA coloque aqui a chave "service_role".
window.CFG = {
  url: "https://srmppaqvpkierjzubufp.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybXBwYXF2cGtpZXJqenVidWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMzMzMjIsImV4cCI6MjEwODgwOTMyMn0.DyWcHm0iQ03AwuttFVlFQLa_SdceK9ePSPlero_Aobs",
  admin: "igortb.zimba@gmail.com" // usado só para mostrar/esconder a aba Admin; a permissão real é validada no banco
};
