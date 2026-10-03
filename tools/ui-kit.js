/* ===================== Kit de controles do inspector =====================
   Pedido do Max na rodada "refaz do zero"/"isso está amador": o inspector inteiro (~8
   funções render*Inspector em editor.js + brand.js) construía DOM na mão, chamando
   `document.createElement` repetidas vezes pra cada label+input, cada uma com seu próprio
   jeito ligeiramente diferente de montar a mesma coisa (rótulo + controle). Esse módulo
   junta os padrões que já se repetiam (o único que já existia como helper comum era
   `labeledRange`, em editor.js) numa família só de construtores — cada um devolve UM
   elemento (rótulo + controle já dentro), então todo chamador vira uma linha:
   `body.appendChild(field.select(...))` em vez de criar e anexar label e input em
   separado. Não é um framework — só os construtores que o inspector realmente usa,
   compostos a partir de `document.createElement` normal (mesma base de sempre, só não
   repetida 8 vezes). `field.range` delega pra `labeledRange` (editor.js) em vez de duplicar
   a implementação — `filter-panel.js` e `image-lab.js` (fora do escopo dessa reescrita)
   também dependem da função original, então ela continua existindo como está. */
const field = {
  label(text){
    const l = document.createElement('label');
    l.textContent = text;
    return l;
  },
  hint(text){
    const d = document.createElement('div');
    d.className = 'hint';
    d.textContent = text;
    return d;
  },
  button(text, onClick, opts){
    opts = opts || {};
    const b = document.createElement('button');
    b.textContent = text;
    if (opts.className) b.className = opts.className;
    if (opts.title) b.title = opts.title;
    b.addEventListener('click', onClick);
    return b;
  },
  /* Linha com N botões lado a lado (mesmo visual de .grid2/.toolgrid já usado na barra
     lateral) — pros casos de "Duplicar"/"Excluir" juntos, ou qualquer par/trio de ações. */
  buttonRow(buttons, className){
    const row = document.createElement('div');
    row.className = className || 'grid2';
    buttons.forEach(b=>row.appendChild(b));
    return row;
  },
  range(labelText, val, min, max, step, onInput){
    return labeledRange(labelText, val, min, max, step, onInput);
  },
  select(labelText, options, value, onChange){
    const wrap = document.createElement('div');
    if (labelText) wrap.appendChild(field.label(labelText));
    const sel = document.createElement('select');
    options.forEach(o=>{
      const opt = document.createElement('option');
      opt.value = o.value; opt.textContent = o.label;
      sel.appendChild(opt);
    });
    sel.value = value;
    sel.addEventListener('change', ()=>onChange(sel.value));
    wrap.appendChild(sel);
    wrap.__input = sel;
    return wrap;
  },
  color(labelText, value, onInput){
    const wrap = document.createElement('div');
    if (labelText) wrap.appendChild(field.label(labelText));
    const inp = document.createElement('input');
    inp.type = 'color'; inp.value = value;
    inp.addEventListener('input', ()=>onInput(inp.value));
    wrap.appendChild(inp);
    wrap.__input = inp;
    return wrap;
  },
  checkbox(labelText, checked, onChange){
    const lab = document.createElement('label');
    lab.className = 'inline';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = checked;
    cb.addEventListener('change', ()=>onChange(cb.checked));
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' '+labelText));
    lab.__input = cb;
    return lab;
  },
};
