// Camada de backend (Supabase). Recria a interface usada pelo app: claude.use("db" | "user" | "assets" | "downloads").
(function(){
const C=window.CFG||{};
if(!C.url||C.url.startsWith("COLE")||!window.supabase){window.claude={use:async()=>null};window.openLogin=()=>alert("Configure js/config.js com os dados do Supabase.");window.logout=()=>{};return}
const sb=supabase.createClient(C.url,C.key,{auth:{flowType:"pkce",persistSession:true,detectSessionInUrl:true}});
let session=null;const ready=sb.auth.getSession().then(r=>{session=r.data.session});
sb.auth.onAuthStateChange((_e,s)=>{session=s});
const parentOf=p=>p.replace(/\/[^/]+$/,""),rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const dref=path=>({
 async get(){const{data,error}=await sb.from("docs").select("data").eq("path",path).maybeSingle();if(error)throw error;return{exists:!!data,data:()=>data&&data.data}},
 async set(v){const{error}=await sb.from("docs").upsert({path,data:v});if(error)throw error},
 async delete(){const{error}=await sb.from("docs").delete().eq("path",path);if(error)throw error}});
const db={doc:dref,collection:p=>({
 async get(){const{data,error}=await sb.from("docs").select("path,data").eq("parent",p);if(error)throw error;return{docs:data.map(r=>({id:r.path.split("/").pop(),data:()=>r.data}))}},
 async add(v){const id=rid();await dref(p+"/"+id).set(v);return{id}}})};
const email=()=>(session?.user?.email||"").toLowerCase();
const user={id:async()=>session?.user?.id||null,
 me:async()=>({name:session?.user?.user_metadata?.full_name||email().split("@")[0]||"Usuário"}),
 canEdit:()=>email()===String(C.admin).toLowerCase(),isOwner:()=>false};
const assets={upload:async f=>{const ext=(f.name.split(".").pop()||"bin").toLowerCase(),name=rid()+"."+ext;
 const{error}=await sb.storage.from("galeria").upload(name,f,{contentType:f.type});if(error)throw error;
 return{url:sb.storage.from("galeria").getPublicUrl(name).data.publicUrl}}};
const downloads={save:async({filename,data})=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data]));a.download=filename;a.click()}};
window.claude={use:async n=>{await ready;return({db,user:session?user:null,assets,downloads})[n]||null}};
window.logout=async()=>{await sb.auth.signOut();location.reload()};
window.openLogin=()=>{const m=document.createElement("div");m.className="modal";
m.innerHTML=`<div class="sheet"><h3>Entrar</h3><p class="m">Entre para enviar perguntas e inscrições.</p><button class="b" style="width:100%" id="lg">Entrar com Google</button><label>Ou receba um link no e-mail<input id="le" type="email" placeholder="seu@email.com"></label><button class="b2" style="width:100%" id="lm">Enviar link de acesso</button><p id="lt" class="m"></p><button class="b2" data-a="close" style="width:100%">Fechar</button></div>`;
document.body.append(m);const back=location.origin+location.pathname;
m.querySelector("#lg").onclick=()=>sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:back}});
m.querySelector("#lm").onclick=async()=>{const e=m.querySelector("#le").value.trim();if(!e)return;const{error}=await sb.auth.signInWithOtp({email:e,options:{emailRedirectTo:back}});m.querySelector("#lt").textContent=error?"Erro: "+error.message:"Link enviado! Abra seu e-mail."}};
})();
