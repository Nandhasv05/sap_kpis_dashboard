const fs = require('fs');
const path = require('path');

const js = (...p) => path.join('c:/MAMP/htdocs/KPIS/public/js', ...p);

function extractWithBody(file) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const start = lines.findIndex((l) => l.includes('with (env) {'));
    const end = lines.findIndex((l, i) => i > start && /^\s+env\.\w+ = /.test(l));
    if (start < 0 || end < 0) throw new Error('unwrap failed ' + file);
    return lines.slice(start + 1, end).join('\n');
}

const qPath = js('quotation', 'quotation.js');
let q = fs.readFileSync(qPath, 'utf8');

const saleorder = extractWithBody(js('saleorder', 'saleorder.js'));
const bom = extractWithBody(js('bom', 'bom.js'));
const material = extractWithBody(js('material', 'material-drawer.js'));
const procurement = extractWithBody(js('procurement', 'procurement.js'));

const startMarker = '\n    window.KapisSales = window.KapisSales || {};';
const endMarker = '\n    function updateKpis(summary) {';
const startAt = q.indexOf(startMarker);
const endAt = q.indexOf(endMarker);
if (startAt < 0 || endAt < 0) throw new Error('markers not found');

const restored = [
    q.slice(0, startAt),
    '\n',
    saleorder,
    '\n',
    bom,
    '\n',
    material,
    '\n',
    procurement,
    '\n',
    q.slice(endAt),
].join('\n');

const cleaned = restored
    .replace(/\n    bindSalesEnv\(\);[\s\S]*?    \(\window\.KapisSales\.modules \|\| \[\]\)\.forEach\([\s\S]*?\);\n\n    initCharts\(\);/, '\n    initCharts();');

fs.writeFileSync(qPath, cleaned, 'utf8');
console.log('restored quotation.js', cleaned.split(/\r?\n/).length, 'lines');
