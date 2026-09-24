import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const STATUSES = ["Requested","Pre-op Assessment","Scheduled","Pre-op Ready","In Operation","Recovery","Completed","Cancelled"];

export default function OR({ section = "Major OR", subsection = "OR", user }) {
  const [rows,setRows] = useState([]);
  const [search,setSearch] = useState("");
  const [manage,setManage] = useState(null);
  const [loading,setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const {data,error} = await supabase.from("or_requests").select("*")
      .eq("or_module",section).order("created_at",{ascending:false});
    if(error){ console.error(error); alert(error.message); setRows([]); }
    else setRows(data || []);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[section]);

  const filtered = useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q) return rows;
    return rows.filter(x => [
      x.patient_number,x.patient_name,x.source_module,x.request_type,
      x.procedure_name,x.status,x.payment_status
    ].filter(Boolean).join(" ").toLowerCase().includes(q));
  },[rows,search]);

  const paid = (x) => ["paid","partial"].includes(String(x.payment_status||"unpaid").toLowerCase());

  async function save(id, patch) {
    const {error}=await supabase.from("or_requests").update({
      ...patch,updated_by:user?.id||null,updated_at:new Date().toISOString()
    }).eq("id",id);
    if(error){alert(error.message);return;}
    await load();
    setManage(null);
  }

  return <div style={{padding:24,fontFamily:"Times New Roman, Times, serif"}}>
    <div style={{background:"white",border:"1px solid #cbd5e1",borderRadius:16,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:30}}>🏥 Major OR</h2>
          <p style={{fontSize:20,fontWeight:700,margin:"8px 0 4px"}}>Current Unit: {subsection}</p>
          <p>Elective and emergency operation requests from IPD and Emergency.</p>
        </div>
        <button onClick={load} style={{padding:"10px 16px",fontWeight:700}}>🔄 Refresh</button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Search patient, source, request type or procedure..."
        style={{width:"100%",padding:14,margin:"18px 0",border:"1px solid #cbd5e1",borderRadius:10,fontSize:18}} />

      {loading ? <p>Loading OR requests...</p> : filtered.length===0 ?
        <div style={{padding:30,textAlign:"center",border:"1px dashed #94a3b8",borderRadius:12}}>
          No OR requests have arrived from IPD/Emergency yet.
        </div> :
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Patient","Source","Type","Procedure","Payment","Status","Action"].map(h=>
              <th key={h} style={{padding:12,borderBottom:"2px solid #cbd5e1",textAlign:"left"}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(x=>{
              const ok=paid(x);
              return <tr key={x.id} style={{background:ok?"white":"#ffe5e5"}}>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0"}}><strong>{x.patient_number}</strong><br/>{x.patient_name||"-"}</td>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0"}}>{x.source_module}</td>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0"}}>{x.request_type}</td>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0"}}>{x.procedure_name}</td>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0",color:ok?"#15803d":"#dc2626",fontWeight:700}}>{x.payment_status||"Unpaid"}</td>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0"}}>{x.status}</td>
                <td style={{padding:12,borderBottom:"1px solid #e2e8f0"}}>
                  <button disabled={!ok} onClick={()=>ok&&setManage(x)}
                    style={{padding:"10px 15px",border:0,borderRadius:8,fontWeight:700,
                      cursor:ok?"pointer":"not-allowed",background:ok?"#2563eb":"#94a3b8",color:"white"}}>
                    ⚙️ Manage
                  </button>
                  {!ok && <div style={{color:"#b91c1c",fontSize:14}}>Payment required</div>}
                </td>
              </tr>
            })}</tbody>
          </table>
        </div>
      }
    </div>

    {manage && <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.45)",
      display:"flex",justifyContent:"center",alignItems:"center",padding:20,zIndex:20000}}>
      <div style={{width:"min(850px,96vw)",background:"white",borderRadius:16,padding:24,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <h2>⚙️ Manage OR Request</h2>
          <button onClick={()=>setManage(null)}>✕</button>
        </div>
        <p><strong>Patient:</strong> {manage.patient_number} — {manage.patient_name||"-"}</p>
        <p><strong>Source:</strong> {manage.source_module} | <strong>Type:</strong> {manage.request_type}</p>
        <p><strong>Procedure:</strong> {manage.procedure_name}</p>
        <p><strong>Payment:</strong> {manage.payment_status}</p>

        <label><strong>Status</strong>
          <select value={manage.status||"Requested"} onChange={e=>setManage({...manage,status:e.target.value})}
            style={{display:"block",width:"100%",padding:12,marginTop:6,fontSize:18}}>
            {STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
        </label>

        <label style={{display:"block",marginTop:16}}><strong>Notes</strong>
          <textarea value={manage.notes||""} onChange={e=>setManage({...manage,notes:e.target.value})}
            style={{display:"block",width:"100%",minHeight:120,padding:12,marginTop:6,fontSize:18}} />
        </label>

        <button onClick={()=>save(manage.id,{status:manage.status||"Requested",notes:manage.notes||null})}
          style={{marginTop:16,padding:"12px 18px",background:"#2563eb",color:"white",border:0,borderRadius:9,fontWeight:700}}>
          💾 Save
        </button>
      </div>
    </div>}
  </div>;
}
