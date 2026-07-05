#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.resolve(__dirname, '../packages/turbowarp/src/lib/mindustry/schemas');
const zhDir = path.join(schemasDir, 'zh_CN');

const files = fs.readdirSync(schemasDir)
    .filter(f => f.endsWith('.json') && f !== 'zh_CN');

let ok = 0, skip = 0, err = 0;

for (const file of files) {
    const enPath = path.join(schemasDir, file);
    const zhPath = path.join(zhDir, file);

    if (!fs.existsSync(zhPath)) {
        console.log(`  SKIP (no zh_CN): ${file}`);
        skip++;
        continue;
    }

    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

    const result = {};

    if (zh.localizedName) {
        result.localizedName = zh.localizedName;
    }

    if (zh.notes) {
        result.notes = zh.notes;
    }

    if (Array.isArray(zh.fields)) {
        result.fields = zh.fields.map(f => {
            const entry = { name: f.name };
            if (f.localizedName) entry.localizedName = f.localizedName;
            if (f.notes) entry.notes = f.notes;
            return entry;
        });
    }

    const oldZhFields = (zh.fields || []).length;
    const newZhFields = (result.fields || []).length;

    fs.writeFileSync(zhPath, JSON.stringify(result, null, 4) + '\n', 'utf8');
    console.log(`  OK: ${file} (${oldZhFields} -> ${newZhFields} fields)`);
    ok++;
}

console.log(`\nDone: ${ok} converted, ${skip} skipped, ${err} errors`);
