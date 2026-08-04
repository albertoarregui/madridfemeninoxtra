import puppeteer from 'puppeteer';
const b=await puppeteer.launch({headless:'new',executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
const casos=[['1 tarjeta','janou-levels-nueva-jugadora-real-madrid-hasta-2030'],['3 tarjetas','linda-caicedo-capitana-real-madrid']];
for(const [et,slug] of casos){
  console.log('== '+et);
  for(const w of [390,768,1440]){
    const p=await b.newPage(); await p.setViewport({width:w,height:1200});
    await p.goto('http://localhost:4510/noticias/'+slug,{waitUntil:'networkidle2',timeout:70000});
    const r=await p.evaluate(()=>{
      const res=[];
      document.querySelectorAll('.dashboard-widget-card-refined').forEach(c=>{
        const t=c.querySelector('.widget-title-small').getBoundingClientRect();
        const f=c.querySelector('.widget-flag')?.getBoundingClientRect();
        const pos=c.querySelector('.widget-subtitle-pos').getBoundingClientRect();
        if(!f){res.push('sin bandera');return;}
        res.push({izq: Math.round(f.right)<=Math.round(t.left)+2, mismaLinea: Math.abs(f.top-t.top)<14, posDebajo: pos.top>=t.bottom-2});
      });
      let over=0; document.querySelectorAll('.dashboard-widget-card-refined *').forEach(el=>{ if(el.scrollWidth>el.clientWidth+1 && getComputedStyle(el).overflow!=='hidden') over++; });
      return {res, over, desborde:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    const ok=r.res.every(x=>x==='sin bandera'||(x.izq&&x.mismaLinea&&x.posDebajo));
    console.log(`  ${String(w).padStart(4)}px | bandera a la izquierda del nombre: ${ok?'sí':'NO '+JSON.stringify(r.res)} · cortado ${r.over} · desborde ${r.desborde}px`);
    await p.close();
  }
}
await b.close();
