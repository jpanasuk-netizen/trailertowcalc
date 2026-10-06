(function(){
"use strict";
function id(x){return document.getElementById(x)}
function pairs(s){return s.split(",").map(function(p){return p.split(":")})}
var M={
tow:{p:"tab-tow",r:"checkTow",b:"towResult",go:function(){return +id("twTrailer").value>0},f:pairs("tow:twRating,gcwr:twGcwr,curb:twCurb,payload:twPayload,hitch:twHitchMax,trailer:twTrailer,cargo:twCargo,pax:twPax")},
tg:{p:"tab-tg",r:"checkTongue",b:"tgResult",go:function(){return +id("tgTrailer").value>0&&(+id("tgPct").value>0||id("tgScale").value!=="")},f:pairs("tg:tgTrailer,scale:tgScale,lever:tgLever,pct:tgPct")},
pl:{p:"tab-pl",r:"checkPayload",b:"plResult",go:function(){return +id("plRating").value>0},f:pairs("pl:plRating,tongue:plTongue,hardware:plHitch,riders:plPax,bed:plCargo")},
br:{p:"tab-br",r:"checkBrakes",b:"brResult",go:function(){return +id("brTrailer").value>0&&+id("brTV").value>0},f:pairs("bt:brTrailer,bv:brTV,brake:brType")}
};
function ok(node,raw){
if(!node||raw===""||raw==null)return 0;
if(node.tagName==="SELECT"){for(var i=0;i<node.options.length;i++)if(node.options[i].value===raw)return 1;return 0}
var n=+raw;if(!isFinite(n))return 0;
if((node.min!==""&&n<+node.min)||(node.max!==""&&n>+node.max))return 0;
return 1}
function share(tab){
var q=new URLSearchParams();q.set("tab",tab);
M[tab].f.forEach(function(pair){var node=id(pair[1]);if(node&&node.value!==""&&ok(node,node.value))q.set(pair[0],node.value)});
history.replaceState(null,"",location.pathname+"?"+q)}
function plain(box){
var copy=box.cloneNode(true),act=copy.querySelector("p.ra");if(act)act.remove();
return (copy.innerText||copy.textContent||"").trim()+"\n\nPlanning estimate — check the nameplate.\n"+location.href}
function clip(str,status){
function done(){status.textContent="Copied"}
function fb(){var t=document.createElement("textarea");t.value=str;t.style.cssText="position:fixed;left:-9999px";document.body.appendChild(t);t.select();try{document.execCommand("copy")}catch(e){}t.remove();done()}
var c=navigator.clipboard;if(c&&c.writeText)c.writeText(str).then(done,fb);else fb()}
function buttons(box){
box.insertAdjacentHTML("beforeend","<p class=ra><button type=button>Copy link to this result</button> <button type=button>Copy as text</button> <span class=small></span></p>");
var bs=box.lastChild.children,st=bs[2];
bs[0].onclick=function(){clip(location.href,st)};
bs[1].onclick=function(){clip(plain(box),st)}}
function after(tab){var box=id(M[tab].b);if(!box||box.hidden||!box.querySelector(".big"))return;share(tab);buttons(box)}
Object.keys(M).forEach(function(tab){
var orig=window[M[tab].r];if(typeof orig!="function"||orig._p)return;
window[M[tab].r]=function(){orig();after(tab)};window[M[tab].r]._p=1});
var q=new URLSearchParams(location.search),tab=q.get("tab"),spec=M[tab];if(!spec)return;
spec.f.forEach(function(pair){if(!q.has(pair[0]))return;var node=id(pair[1]);if(ok(node,q.get(pair[0])))node.value=q.get(pair[0])});
showTab(spec.p,document.querySelector(".tabs button[onclick*='"+spec.p+"']"));
if(spec.go())window[spec.r]()
})();
