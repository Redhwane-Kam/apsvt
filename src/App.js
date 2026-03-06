import { useState, useMemo, useEffect, useCallback } from "react";
import { db as supa } from "./supabase";

// ── Polices arabes ────────────────────────────────────────────────
if (!document.getElementById("arabic-fonts")) {
  const lnk = document.createElement("link");
  lnk.id = "arabic-fonts"; lnk.rel = "stylesheet";
  lnk.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap";
  document.head.appendChild(lnk);
}

// ── Constantes ────────────────────────────────────────────────────
const ROLES = {
  admin:      { label: "مدير النظام",    icon: "🌳", color: "#1a5c36", bg: "#e8f7ee" },
  president:  { label: "الرئيس/ة",       icon: "⭐", color: "#1a3d7a", bg: "#e8f0fc" },
  tresorier:  { label: "أمين/ة المال",   icon: "💼", color: "#5c1a1a", bg: "#fdeaea" },
  secretaire: { label: "الكاتب/ة العام", icon: "📋", color: "#5c4a1a", bg: "#fff8e1" },
  membre:     { label: "عضو",            icon: "🌱", color: "#1a4a3a", bg: "#e8f7f0" },
};
const TYPES_ANNONCE = {
  excursion: { label: "رحلة علمية", color: "#2e7d32", bg: "#e8f5e9", icon: "🥾" },
  evenement: { label: "فعالية",     color: "#1565c0", bg: "#e3f2fd", icon: "📅" },
  formation: { label: "تكوين",      color: "#6a1a6a", bg: "#f3e5f5", icon: "📚" },
  actualite: { label: "أخبار",      color: "#e65100", bg: "#fff3e0", icon: "📰" },
};
const CAT_R = ["اشتراك","تبرع","منحة","مبيعات","إيراد آخر"];
const CAT_D = ["معدات","تنقلات","إيجار","تأمين","تواصل","تكوين","مصروف آخر"];

// ── Utilitaires ───────────────────────────────────────────────────
const fmt     = n => new Intl.NumberFormat("ar-TN",{minimumFractionDigits:3,maximumFractionDigits:3}).format(n)+" د.ت";
const fmtDate = d => new Date(d+"T00:00:00").toLocaleDateString("ar-TN",{day:"2-digit",month:"long",year:"numeric"});
const today   = () => new Date().toISOString().split("T")[0];
// Simple hash (not cryptographic — for demo; upgrade to bcrypt in production)
const simpleHash = s => btoa(unescape(encodeURIComponent(s + "_apsvt_salt")));

// ── Design tokens ─────────────────────────────────────────────────
const C = {
  forest:"#12301e",canopy:"#1e5c38",leaf:"#3a8c56",moss:"#6ab882",mist:"#b8dfc8",
  parchment:"#f4f0e8",cream:"#fdfaf4",surface:"#ffffff",border:"#dde8e2",
  muted:"#7a9485",text:"#1c2e26",textSoft:"#4a6558",
  income:"#1e6b3e",incomeBg:"#e8f7ee",expense:"#8b2020",expenseBg:"#fdeaea",
  warn:"#7a5c00",warnBg:"#fff8e1",info:"#1a4a7a",infoBg:"#e8f0fc",
};

// ── Composants UI ─────────────────────────────────────────────────
const Btn = ({ children, variant="primary", onClick, style={}, disabled }) => {
  const base = {padding:"10px 20px",borderRadius:9,border:"none",cursor:disabled?"not-allowed":"pointer",fontSize:14,fontFamily:"'Cairo','Tajawal',sans-serif",display:"inline-flex",alignItems:"center",gap:7,transition:"all .15s",opacity:disabled?.5:1};
  const v = { primary:{background:`linear-gradient(135deg,${C.canopy},${C.leaf})`,color:"#fff",boxShadow:"0 4px 14px rgba(30,92,56,.3)"}, danger:{background:C.expenseBg,color:C.expense,border:"1px solid #f5c6c6"}, ghost:{background:"#f0f5f2",color:C.textSoft,border:`1px solid ${C.border}`}, warn:{background:C.warnBg,color:C.warn,border:"1px solid #ffe082"} };
  return <button onClick={onClick} disabled={disabled} style={{...base,...v[variant],...style}}>{children}</button>;
};
const Input = ({value,onChange,type="text",placeholder,style={},...rest}) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} {...rest}
    style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:14,color:C.text,background:"#fafcfb",outline:"none",boxSizing:"border-box",fontFamily:"sans-serif",...style}}/>
);
const Sel = ({value,onChange,children,style={}}) => (
  <select value={value} onChange={onChange} style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:14,color:C.text,background:"#fafcfb",outline:"none",boxSizing:"border-box",fontFamily:"sans-serif",cursor:"pointer",...style}}>{children}</select>
);
const Field = ({label,children,col}) => (
  <div style={{gridColumn:col}}>
    <label style={{display:"block",fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6,fontFamily:"sans-serif"}}>{label}</label>
    {children}
  </div>
);
const Card = ({children,style={}}) => (
  <div style={{background:C.surface,borderRadius:16,padding:"24px 28px",boxShadow:"0 2px 16px rgba(0,0,0,.06)",border:`1px solid ${C.border}`,...style}}>{children}</div>
);
const Badge = ({children,color,bg,style={}}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 12px",borderRadius:20,fontSize:12,fontFamily:"sans-serif",background:bg||"#f0f5f2",color:color||C.muted,...style}}>{children}</span>
);
const TH = ({children}) => <th style={{padding:"11px 16px",textAlign:"right",fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"sans-serif",borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap"}}>{children}</th>;
const TD = ({children,style={}}) => <td style={{padding:"13px 16px",fontSize:14,color:C.text,borderBottom:`1px solid #edf3ef`,fontFamily:"sans-serif",...style}}>{children}</td>;
const Modal = ({title,onClose,onSave,saveLabel="حفظ",children,width=640}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(8,20,12,.6)",backdropFilter:"blur(6px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{background:C.surface,borderRadius:20,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 48px 120px rgba(0,0,0,.35)",border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 28px 0"}}>
        <h2 style={{margin:0,fontSize:19,fontWeight:"normal",color:C.forest}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:C.muted,lineHeight:1,padding:4}}>✕</button>
      </div>
      <div style={{padding:"20px 28px"}}>{children}</div>
      {onSave&&<div style={{padding:"0 28px 24px",display:"flex",gap:10,justifyContent:"flex-start"}}>
        <Btn onClick={onSave}>{saveLabel}</Btn>
        <Btn variant="ghost" onClick={onClose}>إلغاء</Btn>
      </div>}
    </div>
  </div>
);
const Toast = ({msg,type}) => (
  <div style={{position:"fixed",bottom:28,right:28,background:type==="warn"?C.warnBg:type==="error"?C.expenseBg:C.incomeBg,border:`1px solid ${type==="warn"?"#ffe082":type==="error"?"#f5c6c6":"#81c784"}`,borderRadius:12,padding:"14px 22px",boxShadow:"0 12px 36px rgba(0,0,0,.18)",fontSize:14,color:type==="warn"?C.warn:type==="error"?C.expense:C.income,fontFamily:"sans-serif",zIndex:9999,display:"flex",alignItems:"center",gap:10}}>
    {type==="warn"?"⚠️":type==="error"?"❌":"✅"} {msg}
  </div>
);
const Loader = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:C.parchment,flexDirection:"column",gap:16}}>
    <div style={{width:48,height:48,border:`4px solid ${C.mist}`,borderTop:`4px solid ${C.leaf}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <p style={{color:C.muted,fontFamily:"'Cairo',sans-serif",fontSize:16}}>جاري التحميل...</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ════════════════════════════════════════════════════════════════
// ÉCRAN SETUP ADMIN
// ════════════════════════════════════════════════════════════════
function SetupAdmin({onDone}) {
  const [pwd,setPwd]=useState(""); const [pwd2,setPwd2]=useState(""); const [err,setErr]=useState(""); const [vis,setVis]=useState(false); const [saving,setSaving]=useState(false);
  const submit = async () => {
    if(pwd.length<8){setErr("كلمة السر يجب أن تحتوي على 8 أحرف على الأقل");return;}
    if(pwd!==pwd2){setErr("كلمتا السر غير متطابقتين");return;}
    setSaving(true);
    await supa.setParam("admin_pwd_hash", simpleHash(pwd));
    await supa.setParam("admin_created", "true");
    onDone();
  };
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.forest} 0%,#091a10 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo','Tajawal',sans-serif",padding:24,direction:"rtl"}}>
      <div style={{width:"100%",maxWidth:480,zIndex:2}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#2e6b47,#4a9e68)",boxShadow:"0 12px 40px rgba(74,158,104,.45)",marginBottom:18,fontSize:40}}>🌿</div>
          <h1 style={{color:C.mist,fontSize:24,fontWeight:"normal",margin:"0 0 6px"}}>جمعية أساتذة علوم الحياة والأرض</h1>
          <p style={{color:"#4a7a60",fontSize:12,margin:0,letterSpacing:2,textTransform:"uppercase"}}>APSVT — الإعداد الأولي</p>
        </div>
        <div style={{background:"rgba(255,255,255,.04)",backdropFilter:"blur(24px)",border:"1px solid rgba(180,220,200,.15)",borderRadius:20,padding:"40px 44px",boxShadow:"0 40px 100px rgba(0,0,0,.5)"}}>
          <div style={{background:"rgba(74,158,104,.1)",border:"1px solid rgba(74,158,104,.25)",borderRadius:12,padding:"14px 18px",marginBottom:28,display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:20}}>🔐</span>
            <div>
              <div style={{color:C.moss,fontSize:14,marginBottom:4}}>إنشاء حساب مدير النظام</div>
              <div style={{color:"#4a7a60",fontSize:12,lineHeight:1.6}}>ستتمكن بواسطة هذه الكلمة السرية من إدارة الأعضاء وصلاحياتهم والخزينة. احتفظ بها في مكان آمن.</div>
            </div>
          </div>
          {[["كلمة سر المدير",pwd,setPwd],["تأكيد كلمة السر",pwd2,setPwd2]].map(([lbl,val,set],i)=>(
            <div key={i} style={{marginBottom:18}}>
              <label style={{display:"block",color:"#7aaa90",fontSize:12,letterSpacing:1,textTransform:"uppercase",marginBottom:8,fontFamily:"sans-serif"}}>{lbl}</label>
              <div style={{position:"relative"}}>
                <input type={vis?"text":"password"} value={val} onChange={e=>{set(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&i===1&&submit()}
                  style={{width:"100%",padding:"13px 44px 13px 16px",background:"rgba(255,255,255,.06)",border:`1.5px solid ${err?"#c05050":"rgba(180,220,200,.2)"}`,borderRadius:10,color:C.mist,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"sans-serif"}}/>
                {i===0&&<button onClick={()=>setVis(!vis)} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#5a8070",cursor:"pointer",fontSize:18}}>{vis?"🙈":"👁"}</button>}
              </div>
            </div>
          ))}
          {pwd&&<div style={{marginBottom:16}}>
            <div style={{height:5,background:"rgba(255,255,255,.1)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
              <div style={{height:"100%",width:pwd.length<8?"25%":pwd.length<12?"60%":"100%",background:pwd.length<8?"#e57373":pwd.length<12?"#ffb74d":"#4dbb6e",borderRadius:3,transition:"all .3s"}}/>
            </div>
            <div style={{fontSize:11,color:"#5a8070"}}>{pwd.length<8?"قصيرة جداً":pwd.length<12?"مقبولة":"كلمة سر قوية ✓"}</div>
          </div>}
          {err&&<p style={{color:"#e07070",fontSize:13,margin:"-4px 0 14px",fontFamily:"sans-serif"}}>⚠️ {err}</p>}
          <button onClick={submit} disabled={saving}
            style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#2e6b47,#4a9e68)",border:"none",borderRadius:12,color:"#e8f5ec",fontSize:16,cursor:"pointer",fontFamily:"'Cairo',sans-serif",boxShadow:"0 8px 24px rgba(46,107,71,.4)"}}>
            {saving?"جاري الحفظ...":"إنشاء حساب المدير"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE PUBLIQUE
// ════════════════════════════════════════════════════════════════
function PublicPage({onLogin}) {
  const [annonces,setAnnonces]=useState([]);
  useEffect(()=>{ supa.getAnnonces(true).then(setAnnonces); },[]);
  const published = annonces.filter(a=>new Date(a.date_evenement)>=new Date()).sort((a,b)=>new Date(a.date_evenement)-new Date(b.date_evenement));

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:"'Cairo','Tajawal',sans-serif",direction:"rtl"}}>
      <header style={{background:`linear-gradient(135deg,${C.forest} 0%,${C.canopy} 100%)`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 24px rgba(0,0,0,.2)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"18px 0"}}>
          <div style={{width:48,height:48,borderRadius:13,background:"linear-gradient(135deg,#2e6b47,#4a9e68)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🌿</div>
          <div>
            <div style={{color:C.mist,fontSize:16}}>جمعية أساتذة علوم الحياة والأرض</div>
            <div style={{color:"#4a7a60",fontSize:10,letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif"}}>APSVT</div>
          </div>
        </div>
        <button onClick={onLogin} style={{padding:"10px 20px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(180,220,200,.3)",borderRadius:10,color:C.mist,fontSize:14,cursor:"pointer",fontFamily:"'Cairo',sans-serif",display:"flex",alignItems:"center",gap:8}}>
          🔑 فضاء الأعضاء
        </button>
      </header>

      <section style={{background:`linear-gradient(160deg,${C.forest} 0%,${C.canopy} 60%,#2a7a4a 100%)`,padding:"60px 24px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <h1 style={{color:"#e8f5ec",fontSize:32,fontWeight:"normal",margin:"0 0 14px",lineHeight:1.4}}>أساتذة علوم الحياة والأرض</h1>
        <p style={{color:"#7dc495",fontSize:16,margin:"0 0 32px",fontStyle:"italic",maxWidth:500,marginLeft:"auto",marginRight:"auto"}}>مجتمع مهني مُلتزم بتطوير تدريس علوم الحياة والأرض</p>
        <button onClick={onLogin} style={{padding:"14px 32px",background:"linear-gradient(135deg,#3a8c56,#4a9e68)",border:"none",borderRadius:12,color:"#e8f5ec",fontSize:17,cursor:"pointer",fontFamily:"'Cairo',sans-serif",boxShadow:"0 8px 28px rgba(58,140,86,.5)"}}>
          انضم إلى الجمعية ←
        </button>
      </section>

      <section style={{maxWidth:1100,margin:"0 auto",padding:"48px 24px"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <h2 style={{fontSize:28,fontWeight:"normal",color:C.forest,margin:"0 0 10px"}}>الأجندة والإعلانات</h2>
          <p style={{color:C.muted,fontSize:15,fontFamily:"sans-serif",margin:0}}>اكتشف أنشطتنا وفعالياتنا القادمة</p>
        </div>
        {published.length===0
          ? <div style={{textAlign:"center",padding:"48px",color:C.muted,fontFamily:"sans-serif"}}><div style={{fontSize:48,marginBottom:16}}>📭</div><p>لا توجد إعلانات منشورة في الوقت الحالي.</p></div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:22}}>
            {published.map(a=>{
              const t=TYPES_ANNONCE[a.type]||TYPES_ANNONCE.actualite;
              return (
                <div key={a.id} style={{background:C.surface,borderRadius:18,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,.08)",border:`1px solid ${C.border}`,transition:"transform .2s,box-shadow .2s"}}
                  onMouseOver={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,.14)";}}
                  onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,.08)";}}>
                  <div style={{height:110,background:`linear-gradient(135deg,${t.color}22,${t.color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>{a.image_emoji}</div>
                  <div style={{padding:"18px 20px 22px"}}>
                    <Badge color={t.color} bg={t.bg} style={{marginBottom:10}}>{t.icon} {t.label}</Badge>
                    <h3 style={{margin:"0 0 8px",fontSize:17,fontWeight:"normal",color:C.forest,lineHeight:1.4}}>{a.titre}</h3>
                    <div style={{fontSize:12,color:C.muted,fontFamily:"sans-serif",marginBottom:10}}>📅 {fmtDate(a.date_evenement)}{a.lieu?` · 📍 ${a.lieu}`:""}</div>
                    <p style={{margin:0,fontSize:13,color:C.textSoft,fontFamily:"sans-serif",lineHeight:1.7}}>{a.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        }
      </section>
      <footer style={{background:C.forest,padding:"24px",textAlign:"center"}}>
        <p style={{color:"#3a6a50",fontSize:13,fontFamily:"sans-serif",margin:0}}>© {new Date().getFullYear()} جمعية أساتذة علوم الحياة والأرض APSVT · جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ÉCRAN LOGIN
// ════════════════════════════════════════════════════════════════
function LoginScreen({onLogin,onPublic,adminPwdHash}) {
  const [tab,setTab]=useState("member"); const [email,setEmail]=useState(""); const [pwd,setPwd]=useState(""); const [err,setErr]=useState(""); const [vis,setVis]=useState(false); const [loading,setLoading]=useState(false);

  const tryLogin = async () => {
    setLoading(true); setErr("");
    if(tab==="admin"){
      if(simpleHash(pwd)===adminPwdHash){ onLogin({id:"admin",nom:"المدير",prenom:"",role:"admin",actif:true}); }
      else setErr("كلمة السر غير صحيحة.");
      setLoading(false); return;
    }
    const u = await supa.getMembreByEmail(email);
    if(!u){ setErr("لم يُعثر على حساب بهذا البريد الإلكتروني."); setLoading(false); return; }
    if(!u.actif){ setErr("تم تعطيل هذا الحساب. تواصل مع المدير."); setLoading(false); return; }
    if(simpleHash(pwd)!==u.pwd_hash){ setErr("كلمة السر غير صحيحة."); setLoading(false); return; }
    if(u.statut_cotisation!=="à jour"){ setErr("اشتراكك غير مُسوَّى. الوصول مقيّد إلى حين التسوية. تواصل مع المدير."); setLoading(false); return; }
    onLogin(u); setLoading(false);
  };

  const tabSt = (active) => ({padding:"10px 22px",border:"none",cursor:"pointer",fontSize:14,fontFamily:"'Cairo',sans-serif",borderBottom:`3px solid ${active?C.leaf:"transparent"}`,color:active?C.leaf:"#5a8070",background:"transparent",transition:"all .2s"});

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.forest} 0%,#091a10 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cairo',sans-serif",padding:24,direction:"rtl"}}>
      <div style={{width:"100%",maxWidth:440,zIndex:2}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:68,height:68,borderRadius:"50%",background:"linear-gradient(135deg,#2e6b47,#4a9e68)",boxShadow:"0 8px 32px rgba(74,158,104,.4)",marginBottom:16,fontSize:34}}>🌿</div>
          <h1 style={{color:C.mist,fontSize:20,fontWeight:"normal",margin:"0 0 4px"}}>فضاء الأعضاء</h1>
          <p style={{color:"#4a6a58",fontSize:11,margin:0,letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif"}}>APSVT</p>
        </div>
        <div style={{background:"rgba(255,255,255,.04)",backdropFilter:"blur(24px)",border:"1px solid rgba(180,220,200,.15)",borderRadius:20,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,.5)"}}>
          <div style={{display:"flex",borderBottom:"1px solid rgba(180,220,200,.12)",padding:"0 24px"}}>
            <button style={tabSt(tab==="member")} onClick={()=>{setTab("member");setErr("");}}>🌱 عضو</button>
            <button style={tabSt(tab==="admin")}  onClick={()=>{setTab("admin"); setErr("");}}>🌳 مدير النظام</button>
          </div>
          <div style={{padding:"24px 28px 28px"}}>
            {tab==="member"&&(
              <div style={{marginBottom:14}}>
                <Field label="البريد الإلكتروني"><Input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="بريدك@مؤسستك.tn" style={{background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(180,220,200,.2)",color:C.mist,fontSize:15}}/></Field>
              </div>
            )}
            <div style={{marginBottom:err?6:0}}>
              <Field label="كلمة السر">
                <div style={{position:"relative"}}>
                  <Input type={vis?"text":"password"} value={pwd} onChange={e=>{setPwd(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="••••••••" style={{background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(180,220,200,.2)",color:C.mist,fontSize:15,paddingLeft:44}}/>
                  <button onClick={()=>setVis(!vis)} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#5a8070",cursor:"pointer",fontSize:18}}>{vis?"🙈":"👁"}</button>
                </div>
              </Field>
            </div>
            {err&&<div style={{background:"rgba(176,0,0,.12)",border:"1px solid rgba(176,0,0,.25)",borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#e07070",fontFamily:"sans-serif",lineHeight:1.6}}>⚠️ {err}</div>}
            <button onClick={tryLogin} disabled={loading}
              style={{width:"100%",marginTop:8,padding:"14px",background:"linear-gradient(135deg,#2e6b47,#4a9e68)",border:"none",borderRadius:11,color:"#e8f5ec",fontSize:16,cursor:"pointer",fontFamily:"'Cairo',sans-serif",boxShadow:"0 8px 24px rgba(46,107,71,.4)"}}>
              {loading?"جاري...":"تسجيل الدخول"}
            </button>
            <button onClick={onPublic} style={{width:"100%",marginTop:10,padding:"11px",background:"transparent",border:"1px solid rgba(180,220,200,.15)",borderRadius:11,color:"#5a8070",fontSize:14,cursor:"pointer",fontFamily:"'Cairo',sans-serif"}}>
              → العودة للموقع العام
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// APPLICATION PRINCIPALE
// ════════════════════════════════════════════════════════════════
function MainApp({session,onLogout,showToast,params,setParams}) {
  const [page,setPage]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  const [sidebarOpen,setSidebarOpen]=useState(false);

  // Data state
  const [transactions,setTransactions]=useState([]);
  const [membres,setMembres]=useState([]);
  const [dons,setDons]=useState([]);
  const [annonces,setAnnonces]=useState([]);
  const [loadingData,setLoadingData]=useState(true);

  const {role}=session;
  const isAdmin    = role==="admin";
  const isBureau   = ["admin","president","tresorier","secretaire"].includes(role);
  const can = { saisirTx:isAdmin||role==="tresorier", voirMembres:isBureau, voirDons:isBureau, gererAnnonces:isBureau, voirRapports:isBureau };

  // Load all data
  useEffect(()=>{
    Promise.all([
      supa.getTransactions().then(setTransactions),
      supa.getMembres().then(setMembres),
      supa.getDons().then(setDons),
      supa.getAnnonces().then(setAnnonces),
    ]).finally(()=>setLoadingData(false));
  },[]);

  useEffect(()=>{
    const check=()=>{const m=window.innerWidth<768;setIsMobile(m);if(!m)setSidebarOpen(false);};
    window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[]);

  const navigate=(id)=>{setPage(id);if(isMobile)setSidebarOpen(false);};

  // Computed
  const solde_initial = parseFloat(params.solde_initial||1250);
  const totalR = useMemo(()=>transactions.filter(t=>t.type==="recette").reduce((s,t)=>s+parseFloat(t.montant),0),[transactions]);
  const totalD = useMemo(()=>transactions.filter(t=>t.type==="depense").reduce((s,t)=>s+parseFloat(t.montant),0),[transactions]);
  const solde  = solde_initial+totalR-totalD;

  // Toast
  const [toast,setToast]=useState(null);
  const toast_ = useCallback((msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3200);},[]);

  // Forms
  const emptyTx  = {date:today(),libelle:"",categorie:"اشتراك",type:"recette",montant:""};
  const emptyAdh = {nom:"",prenom:"",email:"",pwd:"",role:"membre",etablissement:"",statut_cotisation:"à jour",annee_cotisation:params.annee_courante||"2025",actif:true};
  const emptyDon = {date:today(),donateur:"",type_donateur:"شخص طبيعي",montant:"",objet:"",statut:"مُستلم",recu_fiscal:false};
  const emptyAnn = {titre:"",type:"evenement",date_evenement:"",lieu:"",description:"",image_emoji:"📅",statut:"brouillon"};
  const [formTx, setFormTx]  = useState(emptyTx);
  const [formAdh,setFormAdh] = useState(emptyAdh);
  const [formDon,setFormDon] = useState(emptyDon);
  const [formAnn,setFormAnn] = useState(emptyAnn);

  if(loadingData) return <Loader/>;

  // ── DASHBOARD ──────────────────────────────────────────────────
  const PageDashboard = () => {
    const derniers=[...transactions].slice(0,6);
    const prochains=annonces.filter(a=>a.statut==="publié"&&new Date(a.date_evenement)>=new Date()).sort((a,b)=>new Date(a.date_evenement)-new Date(b.date_evenement)).slice(0,3);
    const parCat={};
    transactions.forEach(t=>{parCat[t.categorie]=(parCat[t.categorie]||0)+(t.type==="recette"?parseFloat(t.montant):-parseFloat(t.montant));});
    return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:22}}>
          {[{icon:"💰",val:fmt(solde),label:"الرصيد الحالي",accent:solde>=0?C.leaf:C.expense,sub:`رصيد أولي: ${fmt(solde_initial)}`},{icon:"📈",val:fmt(totalR),label:"المداخيل",accent:"#2196f3",sub:`${transactions.filter(t=>t.type==="recette").length} عملية`},{icon:"📉",val:fmt(totalD),label:"المصاريف",accent:C.expense,sub:`${transactions.filter(t=>t.type==="depense").length} عملية`},{icon:"👥",val:membres.filter(u=>u.actif&&u.statut_cotisation==="à jour").length,label:"الأعضاء النشطون",accent:"#ff9800",sub:`من أصل ${membres.length} مسجل`},{icon:"🎁",val:fmt(dons.filter(d=>d.statut==="مُستلم").reduce((s,d)=>s+parseFloat(d.montant),0)),label:"التبرعات المستلمة",accent:"#9c27b0",sub:`${dons.filter(d=>d.statut==="مُستلم").length} متبرع`}].map(({icon,val,label,accent,sub})=>(
            <Card key={label} style={{borderTop:`4px solid ${accent}`}}>
              <div style={{fontSize:24}}>{icon}</div>
              <div style={{fontSize:20,fontWeight:"bold",color:C.text,margin:"4px 0 4px",fontFamily:"'Cairo',sans-serif"}}>{val}</div>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"sans-serif"}}>{label}</div>
              {sub&&<div style={{fontSize:11,color:C.muted,fontFamily:"sans-serif",marginTop:2}}>{sub}</div>}
            </Card>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:18}}>
          <Card>
            <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:"normal",color:C.forest}}>📋 آخر العمليات</h3>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><TH>التاريخ</TH><TH>البيان</TH><TH>المبلغ</TH></tr></thead>
              <tbody>{derniers.map(t=>(
                <tr key={t.id}><TD style={{fontSize:13,whiteSpace:"nowrap"}}>{fmtDate(t.date)}</TD><TD style={{maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.libelle}</TD><TD style={{fontWeight:"bold",color:t.type==="recette"?C.income:C.expense}}>{t.type==="recette"?"+":"−"}{fmt(parseFloat(t.montant))}</TD></tr>
              ))}</tbody>
            </table>
          </Card>
          <Card>
            <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:"normal",color:C.forest}}>📅 الفعاليات القادمة</h3>
            {prochains.length===0?<p style={{color:C.muted,fontFamily:"sans-serif",fontSize:14}}>لا توجد فعاليات قادمة.</p>
              :prochains.map(a=>{const t=TYPES_ANNONCE[a.type]||TYPES_ANNONCE.actualite;return(
                <div key={a.id} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid #edf3ef`}}>
                  <div style={{fontSize:26,width:36,textAlign:"center"}}>{a.image_emoji}</div>
                  <div><div style={{fontSize:13,color:C.text,marginBottom:2}}>{a.titre}</div><div style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>📅 {fmtDate(a.date_evenement)}</div></div>
                </div>
              );})}
          </Card>
        </div>
        <Card style={{marginTop:18}}>
          <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:"normal",color:C.forest}}>📊 الرصيد حسب الفئة</h3>
          {Object.entries(parCat).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13,fontFamily:"sans-serif"}}><span style={{color:C.textSoft}}>{cat}</span><span style={{color:val>=0?C.income:C.expense,fontWeight:"bold"}}>{fmt(val)}</span></div>
              <div style={{height:6,background:"#edf3ef",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,(Math.abs(val)/Math.max(...Object.values(parCat).map(Math.abs),1))*100)}%`,background:val>=0?`linear-gradient(90deg,${C.leaf},${C.canopy})`:`linear-gradient(90deg,#e57373,${C.expense})`,borderRadius:3}}/></div>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // ── TRANSACTIONS ───────────────────────────────────────────────
  const PageTransactions = () => {
    const [fType,setFType]=useState("tous"); const [fCat,setFCat]=useState("toutes");
    const filtered=transactions.filter(t=>(fType==="tous"||t.type===fType)&&(fCat==="toutes"||t.categorie===fCat));
    const fR=filtered.filter(t=>t.type==="recette").reduce((s,t)=>s+parseFloat(t.montant),0);
    const fD=filtered.filter(t=>t.type==="depense").reduce((s,t)=>s+parseFloat(t.montant),0);
    return (
      <div>
        <div style={{display:"flex",gap:12,marginBottom:18,alignItems:"center",flexWrap:"wrap"}}>
          <Sel value={fType} onChange={e=>setFType(e.target.value)} style={{width:160}}><option value="tous">جميع الأنواع</option><option value="recette">مداخيل</option><option value="depense">مصاريف</option></Sel>
          <Sel value={fCat} onChange={e=>setFCat(e.target.value)} style={{width:180}}><option value="toutes">جميع الفئات</option>{[...CAT_R,...CAT_D].map(c=><option key={c}>{c}</option>)}</Sel>
          <span style={{color:C.muted,fontSize:13,fontFamily:"sans-serif"}}>{filtered.length} عملية</span>
          <span style={{flex:1}}/>
          {can.saisirTx&&<Btn onClick={()=>{setFormTx(emptyTx);setModal("tx");}}>＋ عملية جديدة</Btn>}
        </div>
        <Card>
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
            <colgroup><col style={{width:"16%"}}/><col style={{width:"30%"}}/><col style={{width:"16%"}}/><col style={{width:"14%"}}/><col style={{width:"14%"}}/>{can.saisirTx&&<col style={{width:"10%"}}/>}</colgroup>
            <thead><tr><TH>التاريخ</TH><TH>البيان</TH><TH>الفئة</TH><TH>النوع</TH><TH>المبلغ</TH>{can.saisirTx&&<TH></TH>}</tr></thead>
            <tbody>{filtered.map(t=>(
              <tr key={t.id} onMouseOver={e=>e.currentTarget.style.background="#f8fcf9"} onMouseOut={e=>e.currentTarget.style.background=""} style={{transition:"background .1s"}}>
                <TD style={{whiteSpace:"nowrap",fontSize:13}}>{fmtDate(t.date)}</TD>
                <TD style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.libelle}</TD>
                <TD><Badge style={{fontSize:11}}>{t.categorie}</Badge></TD>
                <TD><Badge color={t.type==="recette"?C.income:C.expense} bg={t.type==="recette"?C.incomeBg:C.expenseBg}>{t.type==="recette"?"↑ مدخول":"↓ مصروف"}</Badge></TD>
                <TD style={{fontWeight:"bold",color:t.type==="recette"?C.income:C.expense}}>{t.type==="recette"?"+":"−"}{fmt(parseFloat(t.montant))}</TD>
                {can.saisirTx&&<TD><Btn variant="danger" style={{padding:"5px 10px"}} onClick={async()=>{await supa.deleteTransaction(t.id);setTransactions(p=>p.filter(x=>x.id!==t.id));toast_("تم حذف العملية","warn");}}>🗑</Btn></TD>}
              </tr>
            ))}</tbody>
            <tfoot><tr><td colSpan={can.saisirTx?6:5} style={{padding:"12px 16px",borderTop:`2px solid ${C.border}`}}>
              <div style={{display:"flex",gap:24,justifyContent:"flex-start",fontFamily:"sans-serif",fontSize:14}}>
                <span>المداخيل: <strong style={{color:C.income}}>{fmt(fR)}</strong></span>
                <span>المصاريف: <strong style={{color:C.expense}}>{fmt(fD)}</strong></span>
                <span>الرصيد: <strong style={{color:fR-fD>=0?C.income:C.expense}}>{fmt(fR-fD)}</strong></span>
              </div>
            </td></tr></tfoot>
          </table>
        </Card>
      </div>
    );
  };

  // ── MEMBRES ────────────────────────────────────────────────────
  const PageMembres = () => {
    const [fSt,setFSt]=useState("tous");
    const filtered=membres.filter(u=>fSt==="tous"||(fSt==="actif"?u.actif&&u.statut_cotisation==="à jour":fSt==="inactif"?!u.actif:u.statut_cotisation!=="à jour"));
    return (
      <div>
        <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
          {[[`${membres.filter(u=>u.actif&&u.statut_cotisation==="à jour").length} نشط`,"👥",C.leaf],[`${membres.filter(u=>u.statut_cotisation!=="à jour").length} اشتراك متأخر`,"⚠️",C.warn],[`${membres.filter(u=>!u.actif).length} حسابات معطلة`,"🔒",C.expense]].map(([v,i,c])=>(
            <Card key={v} style={{flex:1,minWidth:140,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>{i}</span><div style={{fontSize:14,fontWeight:"bold",color:c,fontFamily:"'Cairo',sans-serif"}}>{v}</div></Card>
          ))}
        </div>
        <div style={{display:"flex",gap:12,marginBottom:14,alignItems:"center"}}>
          <Sel value={fSt} onChange={e=>setFSt(e.target.value)} style={{width:200}}><option value="tous">جميع الأعضاء</option><option value="actif">نشطون ومستوون</option><option value="retard">اشتراك متأخر</option><option value="inactif">حسابات معطلة</option></Sel>
          <span style={{flex:1}}/>{isAdmin&&<Btn onClick={()=>{setFormAdh(emptyAdh);setModal("adh");}}>＋ إضافة عضو</Btn>}
        </div>
        <Card style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",minWidth:650}}>
            <colgroup><col style={{width:"22%"}}/><col style={{width:"20%"}}/><col style={{width:"18%"}}/><col style={{width:"14%"}}/><col style={{width:"12%"}}/>{isAdmin&&<col style={{width:"14%"}}/>}</colgroup>
            <thead><tr><TH>العضو</TH><TH>المؤسسة</TH><TH>الدور</TH><TH>الاشتراك</TH><TH>الوصول</TH>{isAdmin&&<TH>إجراءات</TH>}</tr></thead>
            <tbody>{filtered.map(u=>{
              const r=ROLES[u.role]||ROLES.membre;
              return (
                <tr key={u.id} onMouseOver={e=>e.currentTarget.style.background="#f8fcf9"} onMouseOut={e=>e.currentTarget.style.background=""} style={{transition:"background .1s"}}>
                  <TD><div style={{fontWeight:"bold",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.prenom} {u.nom}</div><div style={{fontSize:11,color:C.muted,fontFamily:"sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div></TD>
                  <TD style={{color:C.textSoft,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={u.etablissement||""}>{u.etablissement||"–"}</TD>
                  <TD>{isAdmin
                    ?<select value={u.role} onChange={async e=>{await supa.updateMembre(u.id,{role:e.target.value});setMembres(p=>p.map(x=>x.id===u.id?{...x,role:e.target.value}:x));toast_(`تم تحديث الدور`);}} style={{padding:"4px 8px",borderRadius:7,border:`1px solid ${C.border}`,fontSize:12,fontFamily:"sans-serif",cursor:"pointer",background:r.bg,color:r.color,width:"100%"}}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select>
                    :<Badge color={r.color} bg={r.bg}>{r.icon} {r.label}</Badge>}</TD>
                  <TD>{isAdmin
                    ?<button onClick={async()=>{const nv=u.statut_cotisation==="à jour"?"en retard":"à jour";await supa.updateMembre(u.id,{statut_cotisation:nv});setMembres(p=>p.map(x=>x.id===u.id?{...x,statut_cotisation:nv}:x));toast_(`اشتراك ${u.prenom}: ${nv==="à jour"?"مُسوَّى":"متأخر"}`);}} style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontFamily:"sans-serif",background:u.statut_cotisation==="à jour"?C.incomeBg:C.expenseBg,color:u.statut_cotisation==="à jour"?C.income:C.expense,width:"100%"}}>{u.statut_cotisation==="à jour"?"✓ مُسوَّى":"⚠ متأخر"}</button>
                    :<Badge color={u.statut_cotisation==="à jour"?C.income:C.expense} bg={u.statut_cotisation==="à jour"?C.incomeBg:C.expenseBg}>{u.statut_cotisation==="à jour"?"✓ مُسوَّى":"⚠ متأخر"}</Badge>}</TD>
                  <TD><Badge color={u.actif?C.income:C.expense} bg={u.actif?C.incomeBg:C.expenseBg}>{u.actif?"🟢 نشط":"🔴 معطل"}</Badge></TD>
                  {isAdmin&&<TD><div style={{display:"flex",gap:5}}>
                    <Btn variant={u.actif?"danger":"ghost"} style={{padding:"4px 8px",fontSize:11}} onClick={async()=>{await supa.updateMembre(u.id,{actif:!u.actif});setMembres(p=>p.map(x=>x.id===u.id?{...x,actif:!x.actif}:x));toast_(u.actif?"تم تعطيل الحساب":"تم إعادة تفعيله",u.actif?"warn":"ok");}}>{u.actif?"🔒":"🔓"}</Btn>
                    <Btn variant="danger" style={{padding:"4px 8px"}} onClick={async()=>{await supa.deleteMembre(u.id);setMembres(p=>p.filter(x=>x.id!==u.id));toast_("تم حذف العضو","warn");}}>🗑</Btn>
                  </div></TD>}
                </tr>
              );
            })}
            {filtered.length===0&&<tr><td colSpan={6} style={{padding:"28px",textAlign:"center",color:C.muted,fontFamily:"sans-serif"}}>لا يوجد عضو في هذه الفئة.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── DONS ───────────────────────────────────────────────────────
  const PageDons = () => {
    const totalRec=dons.filter(d=>d.statut==="مُستلم").reduce((s,d)=>s+parseFloat(d.montant),0);
    const totalProm=dons.filter(d=>d.statut==="تعهد").reduce((s,d)=>s+parseFloat(d.montant),0);
    return (
      <div>
        <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
          {[["🎁",fmt(totalRec),"التبرعات المستلمة","#9c27b0"],["🤝",fmt(totalProm),"التعهدات",C.warn],["🧾",dons.filter(d=>d.recu_fiscal).length+" وصولات","وصولات جبائية",C.canopy]].map(([i,v,l,c])=>(
            <Card key={l} style={{flex:1}}><div style={{fontSize:24}}>{i}</div><div style={{fontSize:20,fontWeight:"bold",color:c,margin:"4px 0",fontFamily:"'Cairo',sans-serif"}}>{v}</div><div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"sans-serif"}}>{l}</div></Card>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>{can.saisirTx&&<Btn onClick={()=>{setFormDon(emptyDon);setModal("don");}}>＋ تسجيل تبرع</Btn>}</div>
        <Card>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>التاريخ</TH><TH>المتبرع</TH><TH>النوع</TH><TH>الغرض</TH><TH>الحالة</TH><TH>المبلغ</TH><TH>وصل</TH>{can.saisirTx&&<TH></TH>}</tr></thead>
            <tbody>{dons.map(d=>(
              <tr key={d.id} onMouseOver={e=>e.currentTarget.style.background="#f8fcf9"} onMouseOut={e=>e.currentTarget.style.background=""} style={{transition:"background .1s"}}>
                <TD style={{whiteSpace:"nowrap",fontSize:13}}>{fmtDate(d.date)}</TD><TD style={{fontWeight:"bold"}}>{d.donateur}</TD><TD><Badge>{d.type_donateur}</Badge></TD><TD style={{color:C.textSoft,fontSize:13}}>{d.objet}</TD>
                <TD><Badge color={d.statut==="مُستلم"?C.income:C.warn} bg={d.statut==="مُستلم"?C.incomeBg:C.warnBg}>{d.statut}</Badge></TD>
                <TD style={{fontWeight:"bold",color:"#9c27b0"}}>{fmt(parseFloat(d.montant))}</TD><TD style={{textAlign:"center"}}>{d.recu_fiscal?"✅":"–"}</TD>
                {can.saisirTx&&<TD><Btn variant="danger" style={{padding:"5px 10px"}} onClick={async()=>{await supa.deleteDon(d.id);setDons(p=>p.filter(x=>x.id!==d.id));toast_("تم حذف التبرع","warn");}}>🗑</Btn></TD>}
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── ANNONCES ───────────────────────────────────────────────────
  const PageAnnonces = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:18,alignItems:"center"}}>
        <div style={{fontFamily:"sans-serif",fontSize:14,color:C.muted}}><strong style={{color:C.text}}>{annonces.filter(a=>a.statut==="publié").length}</strong> منشورة · <strong style={{color:C.text}}>{annonces.filter(a=>a.statut==="brouillon").length}</strong> مسودة</div>
        <Btn onClick={()=>{setFormAnn(emptyAnn);setModal("ann");}}>＋ إعلان جديد</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
        {annonces.map(a=>{
          const t=TYPES_ANNONCE[a.type]||TYPES_ANNONCE.actualite;
          return (
            <Card key={a.id} style={{padding:0,overflow:"hidden",opacity:a.statut==="brouillon"?.75:1}}>
              <div style={{height:88,background:`linear-gradient(135deg,${t.color}18,${t.color}30)`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px"}}>
                <span style={{fontSize:42}}>{a.image_emoji}</span>
                <Badge color={a.statut==="publié"?C.income:C.warn} bg={a.statut==="publié"?C.incomeBg:C.warnBg}>{a.statut==="publié"?"✓ منشور":"○ مسودة"}</Badge>
              </div>
              <div style={{padding:"14px 18px 18px"}}>
                <Badge color={t.color} bg={t.bg} style={{marginBottom:8}}>{t.icon} {t.label}</Badge>
                <h3 style={{margin:"0 0 6px",fontSize:15,fontWeight:"normal",color:C.forest,lineHeight:1.4}}>{a.titre}</h3>
                <div style={{fontSize:12,color:C.muted,fontFamily:"sans-serif",marginBottom:8}}>📅 {fmtDate(a.date_evenement)}{a.lieu?` · 📍 ${a.lieu}`:""}</div>
                <p style={{margin:"0 0 14px",fontSize:12,color:C.textSoft,fontFamily:"sans-serif",lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{a.description}</p>
                <div style={{display:"flex",gap:8}}>
                  <Btn variant={a.statut==="publié"?"warn":"primary"} style={{flex:1,justifyContent:"center",fontSize:12,padding:"7px 10px"}} onClick={async()=>{const nv=a.statut==="publié"?"brouillon":"publié";await supa.updateAnnonce(a.id,{statut:nv});setAnnonces(p=>p.map(x=>x.id===a.id?{...x,statut:nv}:x));toast_(nv==="publié"?"تم نشر الإعلان ✓":"تم إلغاء النشر");}}>
                    {a.statut==="publié"?"⬇ إلغاء النشر":"↑ نشر"}
                  </Btn>
                  <Btn variant="danger" style={{padding:"7px 10px"}} onClick={async()=>{await supa.deleteAnnonce(a.id);setAnnonces(p=>p.filter(x=>x.id!==a.id));toast_("تم حذف الإعلان","warn");}}>🗑</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ── RAPPORTS ───────────────────────────────────────────────────
  const PageRapports = () => {
    const byMonth={};
    transactions.forEach(t=>{const m=t.date.slice(0,7);if(!byMonth[m])byMonth[m]={r:0,d:0};byMonth[m][t.type==="recette"?"r":"d"]+=parseFloat(t.montant);});
    const months=Object.keys(byMonth).sort(); const maxM=Math.max(...months.map(m=>Math.max(byMonth[m].r,byMonth[m].d)),1);
    const recCat={}; const depCat={};
    transactions.forEach(t=>{const o=t.type==="recette"?recCat:depCat;o[t.categorie]=(o[t.categorie]||0)+parseFloat(t.montant);});
    return (
      <div style={{display:"grid",gap:18}}>
        <Card>
          <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:"normal",color:C.forest}}>📑 الملخص المالي للسنة المالية {params.annee_courante}</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
            {[["الرصيد الافتتاحي",solde_initial,C.muted],["إجمالي المداخيل",totalR,C.income],["إجمالي المصاريف",totalD,C.expense],["الرصيد الختامي",solde,solde>=0?C.income:C.expense],["التبرعات المحصلة",dons.filter(d=>d.statut==="مُستلم").reduce((s,d)=>s+parseFloat(d.montant),0),"#9c27b0"],["الاشتراكات",transactions.filter(t=>t.categorie==="اشتراك").reduce((s,t)=>s+parseFloat(t.montant),0),C.canopy]].map(([l,v,c])=>(
              <div key={l} style={{padding:"12px 16px",background:"#fafcfb",borderRadius:10,borderRight:`4px solid ${c}`}}>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:1,fontFamily:"sans-serif",marginBottom:4}}>{l}</div>
                <div style={{fontSize:18,fontWeight:"bold",color:c,fontFamily:"'Cairo',sans-serif"}}>{fmt(v)}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:"normal",color:C.forest}}>📅 التطور الشهري</h3>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:140,padding:"0 4px"}}>
            {months.map(m=>(
              <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:110}}>
                  <div title={fmt(byMonth[m].r)} style={{flex:1,background:`linear-gradient(180deg,${C.leaf},${C.canopy})`,borderRadius:"3px 3px 0 0",height:`${(byMonth[m].r/maxM)*100}%`,minHeight:3,cursor:"help"}}/>
                  <div title={fmt(byMonth[m].d)} style={{flex:1,background:`linear-gradient(180deg,#e57373,${C.expense})`,borderRadius:"3px 3px 0 0",height:`${(byMonth[m].d/maxM)*100}%`,minHeight:3,cursor:"help"}}/>
                </div>
                <div style={{fontSize:9,color:C.muted,fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{m.slice(5)}/{m.slice(2,4)}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:14,marginTop:8,fontSize:12,fontFamily:"sans-serif",color:C.muted}}>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{display:"inline-block",width:10,height:10,background:C.leaf,borderRadius:2}}/> مداخيل</span>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{display:"inline-block",width:10,height:10,background:C.expense,borderRadius:2}}/> مصاريف</span>
          </div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          {[[recCat,"📥 المداخيل حسب الفئة",C.income,C.leaf,C.canopy],[depCat,"📤 المصاريف حسب الفئة",C.expense,"#e57373",C.expense]].map(([data,title,color,g1,g2])=>(
            <Card key={title}>
              <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:"normal",color:C.forest}}>{title}</h3>
              {Object.entries(data).sort((a,b)=>b[1]-a[1]).map(([c,v])=>{const max=Math.max(...Object.values(data));return(
                <div key={c} style={{marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:12,fontFamily:"sans-serif"}}><span style={{color:C.textSoft}}>{c}</span><strong style={{color}}>{fmt(v)}</strong></div>
                  <div style={{height:6,background:"#edf3ef",borderRadius:4}}><div style={{height:"100%",width:`${(v/max)*100}%`,background:`linear-gradient(90deg,${g1},${g2})`,borderRadius:4}}/></div>
                </div>
              );})}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ── PARAMÈTRES ─────────────────────────────────────────────────
  const PageParametres = () => {
    const [pwdForm,setPwdForm]=useState({old:"",n1:"",n2:""}); const [pwdErr,setPwdErr]=useState(""); const [settForm,setSettForm]=useState({annee:params.annee_courante,solde:params.solde_initial,cot:params.montant_cotisation});
    const savePwd=async()=>{
      if(simpleHash(pwdForm.old)!==await supa.getParam("admin_pwd_hash")){setPwdErr("كلمة السر القديمة غير صحيحة");return;}
      if(pwdForm.n1.length<8){setPwdErr("8 أحرف على الأقل");return;}
      if(pwdForm.n1!==pwdForm.n2){setPwdErr("كلمتا السر غير متطابقتين");return;}
      await supa.setParam("admin_pwd_hash",simpleHash(pwdForm.n1));
      setPwdForm({old:"",n1:"",n2:""});setPwdErr("");toast_("تم تحديث كلمة السر بنجاح ✓");
    };
    const saveSett=async()=>{
      await supa.setParam("annee_courante",settForm.annee);
      await supa.setParam("solde_initial",settForm.solde);
      await supa.setParam("montant_cotisation",settForm.cot);
      setParams({...params,annee_courante:settForm.annee,solde_initial:settForm.solde,montant_cotisation:settForm.cot});
      toast_("تم حفظ الإعدادات ✓");
    };
    return (
      <div style={{display:"grid",gap:18,maxWidth:680}}>
        <Card>
          <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:"normal",color:C.forest}}>🔐 كلمة سر مدير النظام</h3>
          <div style={{display:"grid",gap:12}}>
            {[["كلمة السر القديمة","old"],["كلمة السر الجديدة","n1"],["تأكيد الجديدة","n2"]].map(([l,k])=>(
              <Field label={l} key={k}><Input type="password" value={pwdForm[k]} onChange={e=>{setPwdForm({...pwdForm,[k]:e.target.value});setPwdErr("");}}/></Field>
            ))}
            {pwdErr&&<div style={{padding:"10px 14px",background:C.expenseBg,borderRadius:8,fontSize:13,color:C.expense,fontFamily:"sans-serif"}}>⚠️ {pwdErr}</div>}
            <Btn onClick={savePwd} style={{justifyContent:"center"}}>تحديث كلمة السر</Btn>
          </div>
        </Card>
        <Card>
          <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:"normal",color:C.forest}}>⚙️ الإعدادات العامة</h3>
          <div style={{display:"grid",gap:12}}>
            <Field label="السنة المالية"><Input value={settForm.annee} onChange={e=>setSettForm({...settForm,annee:e.target.value})}/></Field>
            <Field label="الرصيد الأولي (د.ت)"><Input type="number" value={settForm.solde} onChange={e=>setSettForm({...settForm,solde:e.target.value})}/></Field>
            <Field label="مبلغ الاشتراك السنوي (د.ت)"><Input type="number" value={settForm.cot} onChange={e=>setSettForm({...settForm,cot:e.target.value})}/></Field>
            <Btn onClick={saveSett} style={{justifyContent:"center"}}>حفظ الإعدادات</Btn>
          </div>
        </Card>
        <Card>
          <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:"normal",color:C.forest}}>📜 الصلاحيات حسب الدور</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:"sans-serif"}}>
            <thead><tr><TH>الدور</TH><TH>إدخال عمليات</TH><TH>إدارة الأعضاء</TH><TH>نشر الإعلانات</TH><TH>التقارير</TH></tr></thead>
            <tbody>{Object.entries(ROLES).map(([k,r])=>(
              <tr key={k}><TD><Badge color={r.color} bg={r.bg}>{r.icon} {r.label}</Badge></TD>
                {[k==="admin"||k==="tresorier",k==="admin",k!=="membre",k!=="membre"].map((v,i)=>(
                  <TD key={i} style={{textAlign:"center",color:v?C.income:"#ccc",fontSize:18}}>{v?"✓":"–"}</TD>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── NAVIGATION ─────────────────────────────────────────────────
  const navItems=[
    {id:"dashboard",label:"لوحة القيادة",icon:"🏠",show:true},
    {id:"transactions",label:"المعاملات",icon:"📒",show:true},
    {id:"dons",label:"التبرعات",icon:"🎁",show:can.voirDons},
    {id:"membres",label:"الأعضاء",icon:"👥",show:can.voirMembres},
    {id:"annonces",label:"الإعلانات",icon:"📢",show:can.gererAnnonces},
    {id:"rapports",label:"التقارير",icon:"📊",show:can.voirRapports},
    {id:"parametres",label:"الإعدادات",icon:"⚙️",show:isAdmin},
  ].filter(n=>n.show);
  const PAGES={dashboard:<PageDashboard/>,transactions:<PageTransactions/>,dons:<PageDons/>,membres:<PageMembres/>,annonces:<PageAnnonces/>,rapports:<PageRapports/>,parametres:<PageParametres/>};
  const TITLES={dashboard:"لوحة القيادة",transactions:"سجل المعاملات",dons:"متابعة التبرعات",membres:"إدارة الأعضاء",annonces:"الإعلانات والفعاليات",rapports:"التقارير والتحليلات",parametres:"الإعدادات"};

  return (
    <div style={{minHeight:"100vh",background:C.parchment,fontFamily:"'Cairo','Tajawal',sans-serif",display:"flex",direction:"rtl"}}>
      {/* Sidebar */}
      <aside style={{width:248,background:`linear-gradient(180deg,${C.forest} 0%,#091a10 100%)`,display:"flex",flexDirection:"column",position:"fixed",right:0,height:"100vh",zIndex:200,boxShadow:"-4px 0 28px rgba(0,0,0,.25)",transform:isMobile?(sidebarOpen?"translateX(0)":"translateX(110%)"):"translateX(0)",transition:"transform .3s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{padding:"18px 16px 14px",borderBottom:"1px solid rgba(120,200,140,.1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:11,background:"linear-gradient(135deg,#2e6b47,#4a9e68)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>🌿</div>
            <div><div style={{color:C.mist,fontSize:13}}>جمعية علوم الحياة والأرض</div><div style={{color:"#3a6a50",fontSize:9,letterSpacing:2,textTransform:"uppercase",fontFamily:"sans-serif"}}>APSVT</div></div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(180,220,200,.15)",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.moss,fontSize:17,flexShrink:0}}>✕</button>
        </div>
        <div style={{padding:"10px 14px 8px",borderBottom:"1px solid rgba(120,200,140,.07)"}}>
          <div style={{padding:"8px 10px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(180,220,200,.1)",borderRadius:9}}>
            <div style={{color:C.mist,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.prenom} {session.nom}</div>
            {session.role!=="admin"&&<div style={{fontSize:11,color:"#4a6a58",fontFamily:"sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.etablissement||"–"}</div>}
            <div style={{marginTop:5}}>{(()=>{const r=ROLES[session.role]||ROLES.membre;return <Badge color={r.color} bg="rgba(255,255,255,.06)" style={{color:r.color,border:`1px solid ${r.color}44`,fontSize:10}}>{r.icon} {r.label}</Badge>;})()}</div>
          </div>
        </div>
        <nav style={{flex:1,paddingTop:8,overflowY:"auto"}}>
          {navItems.map(n=>(
            <div key={n.id} onClick={()=>navigate(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px",cursor:"pointer",color:page===n.id?C.moss:"#4a6a58",background:page===n.id?"rgba(107,184,130,.1)":"transparent",borderRight:`3px solid ${page===n.id?C.leaf:"transparent"}`,borderLeft:"none",transition:"all .2s",fontSize:14}}>
              <span style={{fontSize:17}}>{n.icon}</span>{n.label}
            </div>
          ))}
        </nav>
        <div style={{padding:"8px 10px 14px"}}>
          <div onClick={onLogout} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,cursor:"pointer",color:"#3a5a48",fontSize:13,transition:"all .2s"}} onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"} onMouseOut={e=>e.currentTarget.style.background=""}>
            🚪 تسجيل الخروج
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:199}}/>}

      {/* Main */}
      <main style={{marginRight:isMobile?0:248,marginLeft:0,flex:1,overflowY:"auto",minWidth:0,transition:"margin-right .3s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px 0",marginBottom:-4}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:C.forest,border:"none",borderRadius:10,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.moss,fontSize:22,flexShrink:0,boxShadow:"0 2px 10px rgba(0,0,0,.15)"}}>☰</button>
          <div><div style={{fontSize:18,fontWeight:"normal",color:C.forest}}>{TITLES[page]}</div><div style={{fontSize:12,color:C.muted,fontFamily:"sans-serif"}}>السنة المالية {params.annee_courante} · الرصيد : <strong style={{color:solde>=0?C.income:C.expense}}>{fmt(solde)}</strong></div></div>
        </div>
        <div style={{padding:"20px 18px 32px"}}>{PAGES[page]||<PageDashboard/>}</div>
      </main>

      {/* Modals */}
      {modal==="tx"&&<Modal title="📒 عملية جديدة" onClose={()=>setModal(null)} onSave={async()=>{
        if(!formTx.date||!formTx.libelle||!formTx.montant)return;
        const {data,error}=await supa.addTransaction({...formTx,montant:parseFloat(formTx.montant)});
        if(!error&&data){setTransactions(p=>[data,...p]);setModal(null);toast_("تم تسجيل العملية ✓");}
        else toast_("خطأ في التسجيل","error");
      }}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="التاريخ *"><Input type="date" value={formTx.date} onChange={e=>setFormTx({...formTx,date:e.target.value})}/></Field>
          <Field label="النوع *"><Sel value={formTx.type} onChange={e=>setFormTx({...formTx,type:e.target.value,categorie:e.target.value==="recette"?"اشتراك":"معدات"})}><option value="recette">↑ مدخول</option><option value="depense">↓ مصروف</option></Sel></Field>
          <Field label="البيان *" col="1 / -1"><Input value={formTx.libelle} onChange={e=>setFormTx({...formTx,libelle:e.target.value})} placeholder="وصف العملية..."/></Field>
          <Field label="الفئة"><Sel value={formTx.categorie} onChange={e=>setFormTx({...formTx,categorie:e.target.value})}>{(formTx.type==="recette"?CAT_R:CAT_D).map(c=><option key={c}>{c}</option>)}</Sel></Field>
          <Field label="المبلغ (د.ت) *"><Input type="number" min="0" step="0.001" value={formTx.montant} onChange={e=>setFormTx({...formTx,montant:e.target.value})} placeholder="0.000"/></Field>
        </div>
      </Modal>}

      {modal==="adh"&&<Modal title="➕ إضافة عضو جديد" onClose={()=>setModal(null)} onSave={async()=>{
        if(!formAdh.nom||!formAdh.prenom||!formAdh.email||!formAdh.pwd)return;
        const {data,error}=await supa.addMembre({...formAdh,pwd_hash:simpleHash(formAdh.pwd)});
        if(!error&&data){setMembres(p=>[...p,data]);setModal(null);toast_("تمت إضافة العضو ✓");}
        else toast_(error?.message||"خطأ في الإضافة","error");
      }}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="اللقب *"><Input value={formAdh.nom} onChange={e=>setFormAdh({...formAdh,nom:e.target.value})}/></Field>
          <Field label="الاسم *"><Input value={formAdh.prenom} onChange={e=>setFormAdh({...formAdh,prenom:e.target.value})}/></Field>
          <Field label="البريد الإلكتروني *" col="1 / -1"><Input type="email" value={formAdh.email} onChange={e=>setFormAdh({...formAdh,email:e.target.value})} placeholder="الاسم.اللقب@مؤسستك.tn"/></Field>
          <Field label="كلمة السر الأولية *" col="1 / -1">
            <Input type="password" value={formAdh.pwd} onChange={e=>setFormAdh({...formAdh,pwd:e.target.value})} placeholder="8 أحرف على الأقل"/>
            <div style={{fontSize:11,color:C.muted,marginTop:4,fontFamily:"sans-serif"}}>يمكن للعضو تغييرها بعد تسجيل الدخول.</div>
          </Field>
          <Field label="المؤسسة" col="1 / -1"><Input value={formAdh.etablissement} onChange={e=>setFormAdh({...formAdh,etablissement:e.target.value})} placeholder="المعهد / الإعدادية..."/></Field>
          <Field label="الدور (حسب قرار الجمع العام)"><Sel value={formAdh.role} onChange={e=>setFormAdh({...formAdh,role:e.target.value})}>{Object.entries(ROLES).filter(([k])=>k!=="admin").map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</Sel></Field>
          <Field label="الاشتراك"><Sel value={formAdh.statut_cotisation} onChange={e=>setFormAdh({...formAdh,statut_cotisation:e.target.value})}><option value="à jour">✓ مُسوَّى</option><option value="en retard">⚠ متأخر</option></Sel></Field>
        </div>
        <div style={{marginTop:12,padding:"10px 14px",background:"#f0f8f2",border:`1px solid ${C.mist}`,borderRadius:9,fontSize:12,color:C.textSoft,fontFamily:"sans-serif"}}>
          ℹ️ <strong>تنبيه:</strong> لا يمكن للعضو تسجيل الدخول إلا إذا كان اشتراكه مُسوَّى.
        </div>
      </Modal>}

      {modal==="don"&&<Modal title="🎁 تسجيل تبرع" onClose={()=>setModal(null)} onSave={async()=>{
        if(!formDon.date||!formDon.donateur||!formDon.montant)return;
        const d={...formDon,montant:parseFloat(formDon.montant)};
        const {data,error}=await supa.addDon(d);
        if(!error&&data){
          setDons(p=>[data,...p]);
          if(d.statut==="مُستلم"){
            const tx={date:d.date,libelle:`تبرع – ${d.donateur}`,categorie:"تبرع",type:"recette",montant:d.montant};
            const {data:txData}=await supa.addTransaction(tx);
            if(txData)setTransactions(p=>[txData,...p]);
          }
          setModal(null);toast_("تم تسجيل التبرع ✓");
        } else toast_("خطأ في التسجيل","error");
      }}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="التاريخ *"><Input type="date" value={formDon.date} onChange={e=>setFormDon({...formDon,date:e.target.value})}/></Field>
          <Field label="المبلغ (د.ت) *"><Input type="number" min="0" step="0.001" value={formDon.montant} onChange={e=>setFormDon({...formDon,montant:e.target.value})} placeholder="0.000"/></Field>
          <Field label="اسم المتبرع *" col="1 / -1"><Input value={formDon.donateur} onChange={e=>setFormDon({...formDon,donateur:e.target.value})}/></Field>
          <Field label="نوع المتبرع"><Sel value={formDon.type_donateur} onChange={e=>setFormDon({...formDon,type_donateur:e.target.value})}>{["شخص طبيعي","مؤسسة","شركة","مؤسسة خيرية"].map(t=><option key={t}>{t}</option>)}</Sel></Field>
          <Field label="الحالة"><Sel value={formDon.statut} onChange={e=>setFormDon({...formDon,statut:e.target.value})}><option value="تعهد">تعهد</option><option value="مُستلم">مُستلم</option></Sel></Field>
          <Field label="الغرض / التخصيص" col="1 / -1"><Input value={formDon.objet} onChange={e=>setFormDon({...formDon,objet:e.target.value})} placeholder="مثال: تبرع موجَّه للمعدات التربوية"/></Field>
          <Field label="وصل جبائي" col="1 / -1">
            <div onClick={()=>setFormDon({...formDon,recu_fiscal:!formDon.recu_fiscal})} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:"#fafcfb",border:`1.5px solid ${C.border}`,borderRadius:9}}>
              <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${formDon.recu_fiscal?C.leaf:C.border}`,background:formDon.recu_fiscal?C.leaf:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>{formDon.recu_fiscal&&<span style={{color:"#fff",fontSize:12}}>✓</span>}</div>
              <span style={{fontSize:14,color:C.textSoft,fontFamily:"sans-serif"}}>إصدار وصل جبائي (تبرعات قابلة للطرح)</span>
            </div>
          </Field>
        </div>
        {formDon.statut==="مُستلم"&&<div style={{marginTop:10,padding:"10px 14px",background:C.incomeBg,borderRadius:8,fontSize:13,color:C.income,fontFamily:"sans-serif"}}>ℹ️ سيُضاف هذا التبرع تلقائياً كمدخول في السجل.</div>}
      </Modal>}

      {modal==="ann"&&<Modal title="📢 إعلان جديد" onClose={()=>setModal(null)} onSave={async()=>{
        if(!formAnn.titre||!formAnn.date_evenement)return;
        const {data,error}=await supa.addAnnonce({...formAnn,date_publication:today()});
        if(!error&&data){setAnnonces(p=>[...p,data]);setModal(null);toast_("تم إنشاء الإعلان ✓");}
        else toast_("خطأ في الإنشاء","error");
      }}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="العنوان *" col="1 / -1"><Input value={formAnn.titre} onChange={e=>setFormAnn({...formAnn,titre:e.target.value})} placeholder="عنوان الإعلان..."/></Field>
          <Field label="النوع"><Sel value={formAnn.type} onChange={e=>setFormAnn({...formAnn,type:e.target.value})}>{Object.entries(TYPES_ANNONCE).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</Sel></Field>
          <Field label="الرمز التعبيري"><Sel value={formAnn.image_emoji} onChange={e=>setFormAnn({...formAnn,image_emoji:e.target.value})}>{["📅","🌋","🔬","🌍","🦋","🌿","🐠","🌱","🦎","🧬","🏔️","🌊","🌻","🦅","🔭","🌈"].map(e=><option key={e} value={e}>{e}</option>)}</Sel></Field>
          <Field label="تاريخ الفعالية *"><Input type="date" value={formAnn.date_evenement} onChange={e=>setFormAnn({...formAnn,date_evenement:e.target.value})}/></Field>
          <Field label="المكان" col="1 / -1"><Input value={formAnn.lieu} onChange={e=>setFormAnn({...formAnn,lieu:e.target.value})} placeholder="المدينة، القاعة، العنوان..."/></Field>
          <Field label="الوصف" col="1 / -1"><textarea value={formAnn.description} onChange={e=>setFormAnn({...formAnn,description:e.target.value})} placeholder="وصف مفصل للفعالية..." rows={3} style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:14,color:C.text,background:"#fafcfb",outline:"none",boxSizing:"border-box",fontFamily:"sans-serif",resize:"vertical"}}/></Field>
          <Field label="الحالة"><Sel value={formAnn.statut} onChange={e=>setFormAnn({...formAnn,statut:e.target.value})}><option value="brouillon">○ مسودة</option><option value="publié">✓ نشر فوري</option></Sel></Field>
        </div>
      </Modal>}

      {toast&&<Toast {...toast}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// RACINE
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,setScreen]=useState("loading"); // loading|public|login|app
  const [session,setSession]=useState(null);
  const [params,setParams]=useState({});
  const [adminPwdHash,setAdminPwdHash]=useState("");

  useEffect(()=>{
    (async()=>{
      const created=await supa.getParam("admin_created");
      const hash=await supa.getParam("admin_pwd_hash")||"";
      const annee=await supa.getParam("annee_courante")||"2025";
      const solde=await supa.getParam("solde_initial")||"1250";
      const cot=await supa.getParam("montant_cotisation")||"40";
      setAdminPwdHash(hash);
      setParams({annee_courante:annee,solde_initial:solde,montant_cotisation:cot});
      setScreen(created==="true"?"public":"setup");
    })();
  },[]);

  if(screen==="loading") return <Loader/>;
  if(screen==="setup")   return <SetupAdmin onDone={()=>{setScreen("public");}}/>;
  if(screen==="public")  return <PublicPage onLogin={()=>setScreen("login")}/>;
  if(screen==="login")   return <LoginScreen onLogin={u=>{setSession(u);setScreen("app");}} onPublic={()=>setScreen("public")} adminPwdHash={adminPwdHash}/>;
  return <MainApp session={session} onLogout={()=>{setSession(null);setScreen("public");}} params={params} setParams={setParams}/>;
}
