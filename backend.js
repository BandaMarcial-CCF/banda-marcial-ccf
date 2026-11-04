// Camada de backend (Supabase). Recria a interface usada pelo app: claude.use("db" | "user" | "assets" | "downloads").
(function(){
const C=window.CFG||{};
if(!C.url||C.url.startsWith("COLE")||!window.supabase){window.claude={use:async()=>null};window.openLogin=()=>alert("Configure js/config.js com os dados do Supabase.");window.logout=()=>{};return}
const sb=supabase.createClient(C.url,C.key,{auth:{flowType:"pkce",persistSession:true,detectSessionInUrl:true}});
let session=null,role="visitante",profile={};
const OWNER=String(C.admin).toLowerCase();
async function loadRole(){role="visitante";profile={};if(!session)return;const u=session.user,own=(u.email||"").toLowerCase()===OWNER,meta=u.user_metadata?.full_name||"";if(own)role="dono";
 const mkOwner=async()=>{const r=await sb.rpc("admin_set_role",{target:u.id,new_role:"dono"});if(r.error)throw r.error};
 try{const{data}=await sb.from("roles").select("role,name,instrument,answered").eq("uid",u.id).maybeSingle();
  if(data){profile=data;if(!own)role=data.role;else if(data.role!=="dono"){await mkOwner()}}
  else{await sb.from("roles").insert({uid:u.id,email:u.email,name:meta,role:"visitante"});profile={name:meta,instrument:null,answered:false};if(own)await mkOwner()}
 }catch(e){}
 profile.role=role;profile.email=session?.user?.email||""}
const ready=sb.auth.getSession().then(async r=>{session=r.data.session;await loadRole()});
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
 me:async()=>({name:profile.name||session?.user?.user_metadata?.full_name||email().split("@")[0]||"Usuário"}),
 canEdit:()=>role==="dono"||role==="maestro",isOwner:()=>email()===OWNER,role:async()=>role,profile:async()=>profile,
 checkCode:async c=>{const{data,error}=await sb.rpc("check_member_code",{p_code:c});if(error)throw error;return !!data},
 saveQuiz:async({name,member,instrument,code})=>{
  if(member){const{data:ok,error}=await sb.rpc("claim_member",{p_code:code,p_name:name,p_instrument:instrument});if(error)throw error;if(!ok)throw Error("Código incorreto");
   if(role==="visitante")role="integrante";profile={...profile,name,instrument,answered:true,role};return}
  const patch={name,answered:true,instrument:null};const{data,error}=await sb.from("roles").update(patch).eq("uid",session.user.id).select();if(error)throw error;if(!data||!data.length)throw Error("Não foi possível salvar suas respostas");
  profile={...profile,...patch,role}}};
const assets={upload:async f=>{const ext=(f.name.split(".").pop()||"bin").toLowerCase(),name=rid()+"."+ext;
 const{error}=await sb.storage.from("galeria").upload(name,f,{contentType:f.type});if(error)throw error;
 return{url:sb.storage.from("galeria").getPublicUrl(name).data.publicUrl}}};
const downloads={save:async({filename,data})=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data]));a.download=filename;a.click()}};
const rolesApi={list:async()=>{const{data,error}=await sb.from("roles").select("uid,email,name,role,created_at,instrument,answered").order("created_at",{ascending:false});if(error)throw error;return data},
 remove:async uid=>{const{error}=await sb.rpc("admin_delete_user",{target:uid});if(error)throw error},
 set:async(uid,rl)=>{const{error}=await sb.rpc("admin_set_role",{target:uid,new_role:rl});if(error)throw error},
 getCode:async()=>{const{data,error}=await sb.rpc("admin_get_member_code");if(error)throw error;return data||""},
 setCode:async c=>{const{error}=await sb.rpc("admin_set_member_code",{new_code:c});if(error)throw error}};
const mkFiles=B=>({upload:async(f,name,type)=>{const{error}=await sb.storage.from(B).upload(name,f,{contentType:type,upsert:false});if(error)throw error;return name},
 url:async(p,ttl)=>{const{data,error}=await sb.storage.from(B).createSignedUrl(p,ttl||3600);if(error)throw error;return data.signedUrl},
 urls:async ps=>{const{data,error}=await sb.storage.from(B).createSignedUrls(ps,3600);if(error)throw error;return data},
 remove:async p=>{const{error}=await sb.storage.from(B).remove([p]);if(error)throw error}});
const filesApi=mkFiles("partituras"),audioApi=mkFiles("audios");
window.claude={use:async n=>{await ready;return({db,user:session?user:null,assets,downloads,roles:session?rolesApi:null,files:session?filesApi:null,audios:session?audioApi:null})[n]||null}};
window.logout=async()=>{await sb.auth.signOut();location.reload()};
window.openLogin=()=>{const m=document.createElement("div");m.className="modal";
m.innerHTML=`<div class="sheet"><h3>Entrar</h3><p class="m">Entre para enviar perguntas e inscrições.</p><button id="lg" type="button" style="width:100%;display:flex;align-items:center;justify-content:center;gap:12px;background:#fff;color:#1f1f1f;border:0;border-radius:14px;min-height:58px;font:600 17px system-ui,sans-serif;cursor:pointer;margin-top:6px;box-shadow:0 0 0 2px #e11d2e,0 6px 22px rgba(225,29,46,.45)"><svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Entrar com Google</span></button><p class="m" style="text-align:center;margin:16px 0 0">ou</p><label>Ou receba um link no e-mail<input id="le" type="email" placeholder="seu@email.com"></label><button class="b2" style="width:100%" id="lm">Enviar link de acesso</button><p id="lt" class="m"></p><button class="b2" data-a="close" style="width:100%">Fechar</button></div>`;
document.body.append(m);const back=location.origin+location.pathname;
m.querySelector("#lg").onclick=()=>sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:back}});
m.querySelector("#lm").onclick=async()=>{const e=m.querySelector("#le").value.trim();if(!e)return;const{error}=await sb.auth.signInWithOtp({email:e,options:{emailRedirectTo:back}});m.querySelector("#lt").textContent=error?"Erro: "+error.message:"Link enviado! Abra seu e-mail."}};
})();
