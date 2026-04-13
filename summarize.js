const fs = require('fs');

function summarize(file) {
    if (!fs.existsSync(file)) return '';
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let out = '--- ' + file + ' ---\n';
    let totalErrors = 0; let totalWarnings = 0;
    const files = {};
    data.forEach(item => {
        item.messages.forEach(msg => {
            if (msg.severity === 2) totalErrors++; else totalWarnings++;
            if (!files[item.filePath]) files[item.filePath] = { errors: 0, warnings: 0, messages: [] };
            if (msg.severity === 2) files[item.filePath].errors++; else files[item.filePath].warnings++;
            files[item.filePath].messages.push({ line: msg.line, message: msg.message, rule: msg.ruleId, source: msg.source ? msg.source.trim() : '' });
        });
    });
    out += 'Total Errors: ' + totalErrors + ' Warnings: ' + totalWarnings + '\n';
    Object.keys(files).forEach(f => {
        if (files[f].errors > 0 || files[f].warnings > 0) {
            const shortName = f.split(/frontend|backend/)[1] || f;
            out += shortName + ': ' + files[f].errors + ' errors, ' + files[f].warnings + ' warnings\n';
            files[f].messages.slice(0, 5).forEach(m => {
                out += '  Line ' + m.line + ': ' + m.message + ' (' + m.rule + ')\n';
            });
        }
    });
    return out;
}
const out1 = summarize('frontend/frontend-errors.json');
const out2 = summarize('backend/backend-errors.json');
fs.writeFileSync('report_utf8.txt', out1 + out2, 'utf8');
