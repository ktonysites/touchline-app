const {run,fmt}=require("./backtest.js");
let best={halfLife:180,reg:6,prevW:0.6,rho:-0.05,promA:-0.18,promD:0.16};
const ev=p=>fmt(run(p,["2022-23"]).R.new).RPS;
let bs=ev(best);console.log("start",bs);
const grid={halfLife:[90,120,240,365],reg:[3,10,15],prevW:[0.3,0.8,1],rho:[-0.1,-0.02,0],promA:[-0.1,-0.25],promD:[0.1,0.22]};
for(let pass=0;pass<2;pass++)for(const k in grid)for(const v of grid[k]){const p=Object.assign({},best,{[k]:v});const s=ev(p);if(s<bs-1e-5){bs=s;best=p;console.log("better",k,v,s)}}
console.log(JSON.stringify(best),bs);
