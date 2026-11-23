/* Gera station-layouts.js (PUBLICO) = layout padrão de cada sala, com itens reais do catálogo (editáveis no editor de salas).
   Uso: node tools/gen_layouts.js   (confere limites, portas e sobreposição; sai com erro se algum item estiver fora do lugar) */
const fs=require('fs'),path=require('path');
const lib=require('./layouts/lib');
['module','weather','cellar','lq'].forEach(f=>{const p=path.join(__dirname,'layouts',f+'.js');if(fs.existsSync(p))require(p);});
const {ALL,PROBLEMS,S}=lib;
const missing=[];Object.keys(S.roomIndex).forEach(id=>{if(!ALL[id])missing.push(id);});
let n=0;Object.keys(ALL).forEach(id=>{n+=Object.keys(ALL[id].items).length;});
const out='/* GERADO por tools/gen_layouts.js — layout padrao de cada sala (itens do catalogo, em metros a partir do canto da sala).\n'+
 '   O painel do Guardiao e o editor de salas copiam isto pro Firebase (gm/layout) na primeira vez; depois o que vale e o que voce editar. */\n'+
 'window.STATION_LAYOUTS='+JSON.stringify(ALL)+';\n';
fs.writeFileSync(path.join(__dirname,'..','station-layouts.js'),out);
console.log('salas com layout:',Object.keys(ALL).length,'| itens:',n,'| bytes:',out.length);
if(missing.length)console.log('SEM LAYOUT ('+missing.length+'):',missing.join(' '));
if(PROBLEMS.length){console.log('\nPROBLEMAS ('+PROBLEMS.length+'):');PROBLEMS.forEach(p=>console.log(' -',p));process.exitCode=1;}
