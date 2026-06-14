const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, '..', 'frontend', 'src', 'components', 'seller', 'mobile'),
    path.join(__dirname, '..', 'frontend', 'src', 'components', 'mobile')
];

const replacements = [
    // slate
    { regex: /text-slate-350/g, replace: 'text-slate-400' },
    { regex: /text-slate-405/g, replace: 'text-slate-405' }, // Wait, let's keep 405 or change to 400? Let's check. Wait, slate-400 is valid! Let's map it.
    { regex: /text-slate-405/g, replace: 'text-slate-400' },
    { regex: /text-slate-305/g, replace: 'text-slate-300' },
    { regex: /text-slate-505/g, replace: 'text-slate-500' },
    { regex: /text-slate-655/g, replace: 'text-slate-600' },
    { regex: /text-slate-650/g, replace: 'text-slate-600' },
    { regex: /text-slate-450/g, replace: 'text-slate-400' },
    { regex: /border-slate-150/g, replace: 'border-slate-200' },
    { regex: /bg-slate-150/g, replace: 'bg-slate-200' },
    { regex: /text-slate-505/g, replace: 'text-slate-500' },
    // indigo
    { regex: /text-indigo-650/g, replace: 'text-indigo-600' },
    { regex: /bg-indigo-650/g, replace: 'bg-indigo-600' },
    { regex: /fill-indigo-650/g, replace: 'fill-indigo-600' },
    { regex: /text-indigo-655/g, replace: 'text-indigo-600' },
    { regex: /text-indigo-755/g, replace: 'text-indigo-700' },
    { regex: /text-indigo-750/g, replace: 'text-indigo-700' },
    { regex: /hover:bg-indigo-750/g, replace: 'hover:bg-indigo-700' },
    // amber
    { regex: /text-amber-455/g, replace: 'text-amber-500' },
    { regex: /text-amber-650/g, replace: 'text-amber-600' },
    { regex: /text-amber-605/g, replace: 'text-amber-600' },
    { regex: /bg-amber-605/g, replace: 'bg-amber-600' },
    { regex: /text-amber-655/g, replace: 'text-amber-600' },
    // emerald
    { regex: /text-emerald-450/g, replace: 'text-emerald-500' },
    { regex: /text-emerald-455/g, replace: 'text-emerald-500' },
    // rose
    { regex: /text-rose-650/g, replace: 'text-rose-600' },
    { regex: /bg-rose-105/g, replace: 'bg-rose-100' },
    { regex: /border-rose-105/g, replace: 'border-rose-100' },
    { regex: /text-rose-605/g, replace: 'text-rose-600' },
];

dirs.forEach(dirPath => {
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error("Could not list directory", dirPath, err);
            return;
        }

        files.forEach(file => {
            if (file.endsWith('.jsx')) {
                const filePath = path.join(dirPath, file);
                let content = fs.readFileSync(filePath, 'utf8');
                let original = content;

                replacements.forEach(rep => {
                    content = content.replace(rep.regex, rep.replace);
                });

                if (content !== original) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`Updated invalid colors in: ${filePath}`);
                }
            }
        });
    });
});
