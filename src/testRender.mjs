import fs from "fs";
async function run() {
    const r = await fetch('http://localhost:4321/rivales/barcelona');
    const text = await r.text();
    const idx = text.indexOf('id="cards-chart"');
    fs.writeFileSync('C:/Users/PC/madridfemeninoxtra/out.txt', text.substring(idx, idx + 1500));
}
run();
