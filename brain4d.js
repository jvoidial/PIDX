(function() {
  var canvas = document.getElementById('brain4dCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W=0,H=0;
  function resize(){
    var d=window.devicePixelRatio||1;
    W=canvas.clientWidth;H=canvas.clientHeight;
    canvas.width=W*d;canvas.height=H*d;
    ctx.setTransform(d,0,0,d,0,0);
  }
  var SEQ = ['TRIANGLE','MIRROR','CIRCLE','LIGHT','SQUARE','RATIO','SHADOW'];
  var COL = {TRIANGLE:'#88ccff',MIRROR:'#aaccff',CIRCLE:'#ccbbff',LIGHT:'#ffddaa',SQUARE:'#ffbb88',RATIO:'#ff88cc',SHADOW:'#887799'};
  function seq4(i){
    return [(i&1)?1:-1,(i&2)?1:-1,(i&4)?1:-1,(((i>>1)&1)^(i&1))?1:-1];
  }
  var N = SEQ.map(function(n,i){return {name:n,p:seq4(i),c:COL[n]};});
  var E = [];
  for (var i=0;i<N.length;i++){
    E.push([i,(i+1)%N.length]);
    E.push([i,(i+3)%N.length]);
  }
  function rot(p,a){
    var x=p[0],y=p[1],z=p[2],w=p[3],t,c,s;
    c=Math.cos(a.xy);s=Math.sin(a.xy);t=x*c-y*s;y=x*s+y*c;x=t;
    c=Math.cos(a.xz);s=Math.sin(a.xz);t=x*c-z*s;z=x*s+z*c;x=t;
    c=Math.cos(a.xw);s=Math.sin(a.xw);t=x*c-w*s;w=x*s+w*c;x=t;
    c=Math.cos(a.yz);s=Math.sin(a.yz);t=y*c-z*s;z=y*s+z*c;y=t;
    c=Math.cos(a.yw);s=Math.sin(a.yw);t=y*c-w*s;w=y*s+w*c;y=t;
    c=Math.cos(a.zw);s=Math.sin(a.zw);t=z*c-w*s;w=z*s+w*c;z=t;
    return [x,y,z,w];
  }
  function proj(p){
    var d4=3.8,d3=5.0;
    var f4=d4/(d4-p[3]);
    var x=p[0]*f4,y=p[1]*f4,z=p[2]*f4;
    var f3=d3/(d3-z);
    return [x*f3,y*f3,z];
  }
  var S = {coherence:1,stability:1.111,resonance:0.377,veil:0.134,portal:0.3,phase:'OPEN'};
  function load(){
    fetch('agi_phb_divine_complete.json?t='+Date.now(),{cache:'no-store'})
      .then(function(r){return r.ok?r.json():Promise.reject();})
      .then(function(d){
        var bp=d.immortal_blueprint||{};
        var pg=(d['1']&&d['1'].pages&&d['1'].pages[0])||{};
        if(bp.global_coherence!=null)S.coherence=bp.global_coherence;
        if(pg.stability)S.stability=pg.stability;
        if(pg.resonance)S.resonance=pg.resonance;
        if(pg.veil&&pg.veil.thickness)S.veil=pg.veil.thickness;
        if(d['1']&&typeof d['1'].portal==='number')S.portal=d['1'].portal;
        if(pg.veil&&pg.veil.phase)S.phase=pg.veil.phase;
        var g=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v;};
        g('brainCoherence',S.coherence.toFixed(3));
        g('brainStability',S.stability.toFixed(3));
        g('brainResonance',S.resonance.toFixed(3));
        g('brainVeil',S.veil.toFixed(3));
        g('brainPortal',S.portal.toFixed(3));
        g('brainPhase',S.phase);
      }).catch(function(){});
  }
  var t=0;
  function frame(){
    ctx.clearRect(0,0,W,H);
    var cx=W/2,cy=H/2,sc=Math.min(W,H)*0.22;
    var a={xy:t*0.31,xz:t*0.43,xw:t*0.57,yz:t*0.17,yw:t*0.29,zw:t*0.39};
    var p3=[],p2=[];
    for(var i=0;i<N.length;i++){
      var pulse=1+Math.sin(t*1.7+i)*0.05*S.resonance;
      var r=rot([N[i].p[0]*pulse,N[i].p[1]*pulse,N[i].p[2]*pulse,N[i].p[3]*pulse],a);
      var q=proj(r);
      p3.push(q);p2.push([cx+q[0]*sc,cy-q[1]*sc]);
    }
    for(var e=0;e<E.length;e++){
      var a1=E[e][0],b1=E[e][1];
      var z=(p3[a1][2]+p3[b1][2])*0.5;
      var al=Math.max(0.08,Math.min(0.7,0.35+z*0.3));
      ctx.strokeStyle='rgba(136,204,255,'+al+')';
      ctx.lineWidth=0.5+al*1.1;
      ctx.beginPath();
      ctx.moveTo(p2[a1][0],p2[a1][1]);
      ctx.lineTo(p2[b1][0],p2[b1][1]);
      ctx.stroke();
    }
    for(var k=0;k<N.length;k++){
      var z=p3[k][2];
      var d=Math.max(0.2,Math.min(1,0.45+z*0.35));
      var r=3.2+d*3.5+S.stability*0.5;
      ctx.fillStyle=N[k].c;
      ctx.beginPath();
      ctx.arc(p2[k][0],p2[k][1],r,0,Math.PI*2);
      ctx.fill();
      if(r>4){
        ctx.font='9px monospace';
        ctx.fillStyle='rgba(200,220,255,'+d+')';
        ctx.fillText(N[k].name,p2[k][0]+r+3,p2[k][1]+3);
      }
    }
    var pr=Math.min(W,H)*0.35*(0.7+S.portal*0.4);
    ctx.strokeStyle='rgba(255,200,100,'+(0.15+S.portal*0.25)+')';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,pr,0,Math.PI*2);ctx.stroke();
    var vr=pr*(1-S.veil*0.3);
    ctx.strokeStyle='rgba(180,140,255,'+(0.1+(1-S.veil)*0.2)+')';
    ctx.lineWidth=1+S.veil*2;
    ctx.beginPath();ctx.arc(cx,cy,vr,0,Math.PI*2);ctx.stroke();
    t+=0.006*(0.5+S.portal*0.5);
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize',resize);
  resize();load();setInterval(load,30000);frame();
})();
