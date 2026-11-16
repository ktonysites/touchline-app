const fs=require("fs");const M=require("./model.js");const {scoreGrid,markets,fitRatings,clamp}=M;
const LG=["en.1","es.1","de.1","it.1","fr.1"],SE=["2022-23","2023-24","2024-25","2025-26","2026-27"];
function load(l){let out=[];for(const s of SE){try{const j=JSON.parse(fs.readFileSync(`${__dirname}/data/${l}_${s}.json`));
  j.matches.forEach(m=>{const ft=Array.isArray(m.score)?m.score:(m.score||{}).ft;if(!ft)return;out.push({h:m.team1,a:m.team2,hg:ft[0],ag:ft[1],t:Date.parse(m.date+"T"+(m.time||"15:00")+":00Z"),s})})}catch(e){}}
  return out.sort((x,y)=>x.t-y.t)}
const DATA={};LG.forEach(l=>DATA[l]=load(l));
// Elo (as in model v3)
function elo(rows,now,P){const r={};const K=P.eloK||20,HA=P.eloHA||60;rows.forEach(m=>{if(m.t>=now)return;const rh=r[m.h]??(1500-P.eloNew),ra=r[m.a]??(1500-P.eloNew);
  const e=1/(1+Math.pow(10,(ra-rh-HA)/400)),s=m.hg>m.ag?1:m.hg===m.ag?.5:0,gd=Math.abs(m.hg-m.ag),mult=gd<=1?1:gd===2?1.5:(11+gd)/8;
  r[m.h]=rh+K*mult*(s-e);r[m.a]=ra-K*mult*(s-e)});return r}
function eloProbs(dr,P){ // map rating diff to 1X2 via ordered logit-ish: draw share from diff
  const pH=1/(1+Math.pow(10,-(dr)/400));const draw=P.eloDraw*Math.exp(-Math.pow(dr/P.eloDrawW,2));return{p1:Math.max(pH-draw/2,.01),px:draw,p2:Math.max(1-pH-draw/2,.01)}}
function sg(lh,la,rho){const N=10,g=[];let tot=0;for(let i=0;i<N;i++){g[i]=[];for(let j=0;j<N;j++){let p=M.pmf(i,lh)*M.pmf(j,la);if(i===0&&j===0)p*=1-lh*la*rho;else if(i===0&&j===1)p*=1+lh*rho;else if(i===1&&j===0)p*=1+la*rho;else if(i===1&&j===1)p*=1-rho;g[i][j]=Math.max(p,0);tot+=g[i][j]}}for(let i=0;i<N;i++)for(let j=0;j<N;j++)g[i][j]/=tot;return g}
function run(P,tag){const A={n:0,rps:0,ll:0,hit:0,ou:0,exact:0,draws:0,dpred:0,early:{n:0,rps:0}};
  for(const l of LG){const all=DATA[l];const days=[...new Set(all.filter(m=>m.s>=(P.from||"2023-24")&&m.s<=(P.to||"2026-27")).map(m=>m.t-(m.t%864e5)))];
    for(const d of days){const ms=all.filter(m=>m.t-(m.t%864e5)===d);const win=P.months*30.4*864e5;
      const hist=all.filter(m=>m.t<d&&m.t>=d-win).map(m=>[m.t,m.h,m.a,m.hg,m.ag]);
      const R=fitRatings(hist,d);if(!R)continue;
      const E=P.elo?elo(all.filter(m=>m.t>=d-P.eloMonths*30.4*864e5),d,P):null;
      for(const m of ms){const h=R.t[m.h]||{att:M.RT.newAtt,def:M.RT.newDef,n:0},a=R.t[m.a]||{att:M.RT.newAtt,def:M.RT.newDef,n:0};
        let lh=clamp(R.muh*h.att*a.def,.15,4.5),la=clamp(R.mua*a.att*h.def,.12,4);
        if(P.shrink){const avg=R.muh+R.mua,tot=lh+la,nt=avg+(tot-avg)*(1-P.shrink);lh*=nt/tot;la*=nt/tot}
        let g=P.rho!=null?sg(lh,la,P.rho):scoreGrid(lh,la),mk=markets(g);A.pdraw=(A.pdraw||0)+mk.px;
        if(E){const dr=(E[m.h]??(1500-P.eloNew))-(E[m.a]??(1500-P.eloNew))+P.eloHA;const ep=eloProbs(dr,P);
          const w=P.elo;const t={p1:(1-w)*mk.p1+w*ep.p1,px:(1-w)*mk.px+w*ep.px,p2:(1-w)*mk.p2+w*ep.p2};if(P.refit){const f=M.fitSupremacy(lh+la,t);g=P.rho!=null?sg(f.lh,f.la,P.rho):scoreGrid(f.lh,f.la);mk=markets(g)}else mk=Object.assign({},mk,t)}
        const y=m.hg>m.ag?0:m.hg===m.ag?1:2,p=[mk.p1,mk.px,mk.p2].map(x=>clamp(x,1e-6,1));const s=p[0]+p[1]+p[2];p.forEach((x,i)=>p[i]=x/s);
        const c1=p[0]-(y===0),c2=p[0]+p[1]-(y<=1),rps=(c1*c1+c2*c2)/2;A.rps+=rps;A.ll+=-Math.log(p[y]);A.hit+=p.indexOf(Math.max(...p))===y;
        const o=clamp(mk.ou[2.5],1e-6,1-1e-6),oy=m.hg+m.ag>2.5;A.ou+=-Math.log(oy?o:1-o);
        // headline: likeliest score within likeliest result (draw picked only if it's the likeliest result)
        const res=p.indexOf(Math.max(...p));let best=null;g.forEach((r,i)=>r.forEach((q,j)=>{const ok=res===0?i>j:res===2?j>i:i===j;if(ok&&(!best||q>best.q))best={i,j,q}}));
        A.exact+=best.i===m.hg&&best.j===m.ag;A.draws+=y===1;A.dpred+=res===1;A.n++;
        if(new Date(m.t).getUTCMonth()>=7&&new Date(m.t).getUTCMonth()<=9){A.early.n++;A.early.rps+=rps}}}}
  const n=A.n;console.log(tag.padEnd(26),"n",n,"RPS",(A.rps/n).toFixed(4),"LL",(A.ll/n).toFixed(4),"Hit",(A.hit/n*100).toFixed(1)+"%","OU",(A.ou/n).toFixed(4),"Exact",(A.exact/n*100).toFixed(1)+"%","draws",(A.draws/n*100).toFixed(0)+"%","drawPicks",(A.dpred/n*100).toFixed(1)+"%","earlyRPS",(A.early.rps/A.early.n).toFixed(4),"meanPdraw",(A.pdraw/n*100).toFixed(1)+"%");return A.rps/n}
module.exports={run,M};
if(require.main===module){M.RT.K=10;run({months:12,rho:-.06},"v2.1 (12 months, K 10)");M.RT.K=6;
  run({months:24,shrink:.2,elo:.3,eloK:20,eloHA:60,eloNew:60,eloDraw:.28,eloDrawW:280,eloMonths:24,rho:-.1,refit:1},"v2.2 (current app)");
}
// Current app settings: node backtest.js
//   run({months:24,shrink:.2,elo:.3,eloK:20,eloHA:60,eloNew:60,eloDraw:.28,eloDrawW:280,eloMonths:24,rho:-.1,refit:1},"app v2.2")
