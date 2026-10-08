'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(path.dirname(require.resolve('@supabase/supabase-js')),'..');
const version = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
if(version !== '2.117.3') throw Error('Review dependency upgrade before vendoring.');
fs.copyFileSync(path.join(root,'dist/umd/supabase.js'),path.resolve(__dirname,'../../assets/vendor/supabase-2.117.3.js'));
console.log('Vendored official pinned Supabase UMD bundle; no code modifications.');
