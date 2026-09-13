const db = require('../db.cjs');
setTimeout(() => {
    db.all('SELECT id, name, slug, is_active, status FROM dynamic_features ORDER BY id', (err, rows) => {
        if (err) console.error(err);
        else console.table(rows);
        process.exit(0);
    });
}, 500);
