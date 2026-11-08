// Walk-forward backtest: old Touchline model (standings-based) vs new TLM model.
// usage: node backtest.js [paramsJSON] [seasons]
const fs=require("fs"),path=require("path"),TLM=require("./tlmodel.js");
const D=path.join(__dirname,"data");
const LG=["en.1","es.1","de.1","it.1","fr.1"],ALL=["2021-22","2022-23","2023-24","2024-25","2025-26"];
function load(s,l){const j=JSON.parse(fs.readFileSync(`${D}/${s}-${l}.json`));
  return j.matches.filter(m=>m.score&&Array.isArray(m.score.ft)).map(m=>({h:m.team1,a:m.team2,hg:m.score.ft[0],ag:m.score.ft[1],t:Date.parse(m.date+"T"+(m.time||"15:00")+":00Z"),day:m.date}))
    .sort((x,y)=>x.t-y.t)}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---------- old model (copied from the app) ---------- */
function oldScoreGrid(lh,la,N){N=N||10;const g=[];let tot=0;const rho=-.06;
  for(let i=0;i<N;i++){g[i]=[];for(let j=0;j<N;j++){let p=TLM.pmf(i,lh)*TLM.pmf(j,la);
    if(i===0&&j===0)p*=1-lh*la*rho;else if(i===0&&j===1)p*=1+lh*rho;else if(i===1&&j===0)p*=1+la*rho;else if(i===1&&j===1)p*=1-rho;g[i][j]=p;tot+=p}}
  for(let i=0;i<N;i++)for(let j=0;j<N;j++)g[i][j]/=tot;return g}
function formPts(a){if(!a.length)return null;return a.reduce((t,x)=>t+(x==="W"?3:x==="D"?1:0),0)/a.length}
function oldPredict(prior,hId,aId){
  const tab={};const g=id=>tab[id]||(tab[id]={H:{p:0,gf:0,ga:0},A:{p:0,gf:0,ga:0},p:0,pts:0,form:[]});
  prior.forEach(m=>{const h=g(m.h),a=g(m.a);h.H.p++;h.H.gf+=m.hg;h.H.ga+=m.ag;a.A.p++;a.A.gf+=m.ag;a.A.ga+=m.hg;h.p++;a.p++;
    const r=m.hg>m.ag?["W","L"]:m.hg<m.ag?["L","W"]:["D","D"];h.pts+=r[0]==="W"?3:r[0]==="D"?1:0;a.pts+=r[1]==="W"?3:r[1]==="D"?1:0;h.form.push(r[0]);a.form.push(r[1])});
  const rows=Object.values(tab);const sum=(k,f)=>rows.reduce((s,r)=>s+r[k][f],0);
  const hp=sum("H","p")||1,ap=sum("A","p")||1;const avgH=sum("H","gf")/hp||1.45,avgA=sum("A","gf")/ap||1.15;
  const K=4,sh=(x,n)=>(x*n+K)/(n+K);
  const R=id=>{const r=tab[id];if(!r)return null;const H=r.H,A=r.A;return{attH:sh(H.p?(H.gf/H.p)/avgH:1,H.p),defH:sh(H.p?(H.ga/H.p)/avgA:1,H.p),attA:sh(A.p?(A.gf/A.p)/avgA:1,A.p),defA:sh(A.p?(A.ga/A.p)/avgH:1,A.p),ppg:r.p?r.pts/r.p:null,form:r.form.slice(-5)}};
  const rh=R(hId),ra=R(aId);
  let lh=avgH*(rh?rh.attH:1)*(ra?ra.defA:1),la=avgA*(ra?ra.attA:1)*(rh?rh.defH:1);
  if(rh&&ra&&rh.form.length&&ra.form.length){const mf=(fp,ppg)=>1+clamp((fp-(ppg||1.4))*.05,-.09,.09)*.5*2;lh*=mf(formPts(rh.form),rh.ppg);la*=mf(formPts(ra.form),ra.ppg)}
  lh=clamp(lh,.15,5);la=clamp(la,.15,5);return TLM.markets(oldScoreGrid(lh,la))}

/* ---------- scoring ---------- */
function newAcc(){return{n:0,rps:0,ll:0,brier:0,hit:0,ou:0,oubr:0,cal:Array.from({length:10},()=>({p:0,y:0,n:0})),draws:{p:0,y:0}}}
function score(A,mk,m){const y=m.hg>m.ag?0:m.hg===m.ag?1:2,p=[mk.p1,mk.px,mk.p2].map(x=>clamp(x,1e-6,1));
  const c1=p[0]-(y===0),c2=p[0]+p[1]-(y<=1);A.rps+=(c1*c1+c2*c2)/2;A.ll+=-Math.log(p[y]);A.brier+=p.reduce((s,q,i)=>s+(q-(i===y))**2,0);
  A.hit+=p.indexOf(Math.max(...p))===y;const o=clamp(mk.ou[2.5],1e-6,1-1e-6),oy=m.hg+m.ag>2.5;A.ou+=-Math.log(oy?o:1-o);A.oubr+=(o-oy)**2;
  p.forEach((q,i)=>{const b=Math.min(9,Math.floor(q*10));A.cal[b].p+=q;A.cal[b].y+=(i===y);A.cal[b].n++});A.draws.p+=p[1];A.draws.y+=y===1;A.n++}
function fmt(A){const n=A.n;return{n,RPS:+(A.rps/n).toFixed(4),LogLoss:+(A.ll/n).toFixed(4),Brier:+(A.brier/n).toFixed(4),Acc:+(A.hit/n*100).toFixed(1),OU25_LL:+(A.ou/n).toFixed(4),DrawPred:+(A.draws.p/n*100).toFixed(1),DrawReal:+(A.draws.y/n*100).toFixed(1)}}

function run(params,seasons,opts){opts=opts||{};const R={old:newAcc(),new:newAcc(),base:newAcc()};const byWeek={old:{},new:{}};
  for(const s of seasons){const si=ALL.indexOf(s);for(const l of LG){
    const cur=load(s,l),prev=si>0?load(ALL[si-1],l):[];const prevTeams=new Set(prev.flatMap(m=>[m.h,m.a]));
    const prevM=opts.noPrev?[]:prev.map(m=>Object.assign({prev:true},m));
    // base rates from previous season
    const bp=prev.length?[prev.filter(m=>m.hg>m.ag).length,prev.filter(m=>m.hg===m.ag).length,prev.filter(m=>m.hg<m.ag).length].map(x=>x/prev.length):[.45,.26,.29];
    const bo=prev.length?prev.filter(m=>m.hg+m.ag>2.5).length/prev.length:.5;
    const days=[...new Set(cur.map(m=>m.day))];
    for(const d of days){const now=Date.parse(d+"T00:00:00Z"),todays=cur.filter(m=>m.day===d),prior=cur.filter(m=>m.t<now);
      if(opts.skipEarly&&prior.length<opts.skipEarly)continue;
      const md=TLM.fit(prevM.concat(prior),Object.assign({now,prevTeams:opts.noPrev?null:prevTeams},params));
      const wk=Math.min(5,Math.floor(prior.length/(cur.length/38)/8)); // season phase bucket (0-7,8-15,...)
      for(const m of todays){
        const e=TLM.expect(md,m.h,m.a);const mk=TLM.markets(TLM.scoreGrid(e.lh,e.la,md.rho));score(R.new,mk,m);
        const om=oldPredict(prior,m.h,m.a);score(R.old,om,m);
        score(R.base,{p1:bp[0],px:bp[1],p2:bp[2],ou:{2.5:bo}},m);
        for(const [k,v] of [["old",om],["new",mk]]){(byWeek[k][wk]=byWeek[k][wk]||newAcc());score(byWeek[k][wk],v,m)}
      }}}}
  return{R,byWeek}}
module.exports={run,fmt,load};
if(require.main===module){const params=JSON.parse(process.argv[2]||"{}"),seasons=(process.argv[3]||"2022-23,2023-24,2024-25").split(",");
  const {R,byWeek}=run(params,seasons,{noPrev:process.argv[4]==="noprev"});
  console.table({baseline:fmt(R.base),old_model:fmt(R.old),new_model:fmt(R.new)});
  const ph=["MD1-8","MD9-16","MD17-24","MD25-32","MD33+","MD33+"];
  console.log("RPS by season phase (lower is better):");Object.keys(byWeek.old).sort().forEach(k=>console.log(ph[k].padEnd(8),"old",fmt(byWeek.old[k]).RPS,"new",fmt(byWeek.new[k]).RPS,"n",byWeek.old[k].n));
  console.log("Calibration new (home/draw/away pooled): bucket predicted% real% n");R.new.cal.forEach((c,i)=>c.n&&console.log(`${i*10}-${i*10+10}%`.padEnd(9),(c.p/c.n*100).toFixed(1).padStart(5),(c.y/c.n*100).toFixed(1).padStart(5),c.n));
  console.log("Calibration old:");R.old.cal.forEach((c,i)=>c.n&&console.log(`${i*10}-${i*10+10}%`.padEnd(9),(c.p/c.n*100).toFixed(1).padStart(5),(c.y/c.n*100).toFixed(1).padStart(5),c.n));
}
