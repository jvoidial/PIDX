(function() {
  var canvas = document.getElementById('topology4dCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  var V = [];
  for (var i = 0; i < 16; i++) V.push([(i&1)?1:-1,(i&2)?1:-1,(i&4)?1:-1,(i&8)?1:-1]);
  var E = [];
  for (var a = 0; a < 16; a++) for (var b = a+1; b < 16; b++) {
    var d = a ^ b;
    if (d && !(d & (d-1))) E.push([a,b]);
  }
  function rot(p, ang) {
    var x=p[0],y=p[1],z=p[2],w=p[3],t,c,s;
    c=Math.cos(ang.xy);s=Math.sin(ang.xy);t=x*c-y*s;y=x*s+y*c;x=t;
    c=Math.cos(ang.xz);s=Math.sin(ang.xz);t=x*c-z*s;z=x*s+z*c;x=t;
    c=Math.cos(ang.xw);s=Math.sin(ang.xw);t=x*c-w*s;w=x*s+w*c;x=t;
    c=Math.cos(ang.yz);s=Math.sin(ang.yz);t=y*c-z*s;z=y*s+z*c;y=t;
    c=Math.cos(ang.yw);s=Math.sin(ang.yw);t=y*c-w*s;w=y*s+w*c;y=t;
    c=Math.cos(ang.zw);s=Math.sin(ang.zw);t=z*c-w*s;w=z*s+w*c;z=t;
    return [x,y,z,w];
  }
  function proj(p) {
    var d4=3.8,d3=5.0;
    var f4=d4/(d4-p[3]);
    var x=p[0]*f4,y=p[1]*f4,z=p[2]*f4;
    var f3=d3/(d3-z);
    return [x*f3,y*f3,z];
  }
  var t = 0;
  function frame() {
    ctx.clearRect(0,0,W,H);
    var cx=W/2, cy=H/2;
    var sc=Math.min(W,H)*0.22;
    var ang = {xy:t*0.31,xz:t*0.43,xw:t*0.57,yz:t*0.17,yw:t*0.29,zw:t*0.39};
    var p3=[],p2=[];
    for (var i=0;i<16;i++){
      var r=rot(V[i],ang);
      var q=proj(r);
      p3.push(q);
      p2.push([cx+q[0]*sc,cy-q[1]*sc]);
    }
    for (var e=0;e<E.length;e++){
      var i0=E[e][0],i1=E[e][1];
      var zA=(p3[i0][2]+p3[i1][2])*0.5;
      var al=Math.max(0.08,Math.min(0.85,0.4+zA*0.35));
      ctx.strokeStyle='rgba(136,204,255,'+al+')';
      ctx.lineWidth=0.5+al*1.3;
      ctx.beginPath();
      ctx.moveTo(p2[i0][0],p2[i0][1]);
      ctx.lineTo(p2[i1][0],p2[i1][1]);
      ctx.stroke();
    }
    for (var k=0;k<16;k++){
      var z=p3[k][2];
      var al=Math.max(0.3,Math.min(1,0.55+z*0.35));
      ctx.fillStyle='rgba(255,220,150,'+al+')';
      ctx.beginPath();
      ctx.arc(p2[k][0],p2[k][1],1.5+al*1.8,0,Math.PI*2);
      ctx.fill();
    }
    t += 0.008;
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  resize();
  frame();
})();
