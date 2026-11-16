// pulls pure model functions out of the shipped app so the backtest tests the real code
const fs=require("fs");
const src=fs.readFileSync(process.env.APP||require("path").join(__dirname,"..","www","index.html"),"utf8");
function grab(name){const i=src.indexOf("function "+name+"(");if(i<0)throw new Error(name);let d=0,j=src.indexOf("{",i);for(let k=j;k<src.length;k++){if(src[k]==="{")d++;else if(src[k]==="}"){d--;if(!d)return src.slice(i,k+1)}}}
const rt=src.match(/const RT=\{[^}]+\};/)[0];
const code=["const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));",rt,grab("pmf"),grab("scoreGrid"),grab("markets"),grab("eloRatings"),grab("fitRatings"),grab("fitSupremacy"),"return{RT,pmf,scoreGrid,markets,fitRatings,clamp,fitSupremacy};"].join("\n");
module.exports=new Function(code)();
