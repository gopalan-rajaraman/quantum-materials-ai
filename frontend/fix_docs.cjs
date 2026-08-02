const fs = require('fs');
let f = fs.readFileSync('src/pages/Docs/index.jsx', 'utf8');
f = f.replace(/color: '#64748b', lineHeight/g, "color: '#64748b', fontWeight: 500, lineHeight");
f = f.replace(/color: '#64748b', margin/g, "color: '#64748b', fontWeight: 500, margin");
f = f.replace(/fontWeight: 700, fontSize: 14/g, "fontWeight: 600, fontSize: 14");
fs.writeFileSync('src/pages/Docs/index.jsx', f);
console.log("Done");
