// Loads the prediction model straight out of www/index.html so the backtest always tests the shipped code.
const fs=require("fs"),path=require("path");
const src=fs.readFileSync(path.join(__dirname,"..","www","index.html"),"utf8");
const a=src.indexOf("const TLM=(function(){"),b=src.indexOf("})();",a)+5;
module.exports=new Function(src.slice(a,b)+"\nreturn TLM;")();
