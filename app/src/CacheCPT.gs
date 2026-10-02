/**
 * CacheCPT 2.3.0. Cache compartilhado (ScriptCache) para leituras pesadas.
 * A aplicação roda como o proprietário e todos veem os mesmos dados, então um único cache serve a equipe toda.
 * As chaves incluem a última linha das tabelas: um registro novo invalida o cache sozinho.
 * Limite do Google: 100 KB por valor. Valores grandes vão comprimidos (gzip + base64, prefixo "z:"),
 * o que costuma reduzir o JSON a 1/5; se ainda passar do limite, simplesmente não guarda.
 */
class CacheCPT {
  static get versao() { return '23'; }
  static get comprimirAcima() { return 20000; }
  static cache() { try { return CacheService.getScriptCache(); } catch (_) { return null; } }
  static comprimir(s) {
    try {
      const z = 'z:' + Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(s, 'application/json')).getBytes());
      return z.length < s.length ? z : s;
    } catch (_) { return s; }
  }
  static expandir(s) { return Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(s.slice(2)), 'application/x-gzip')).getDataAsString('UTF-8'); }
  static ler(chave) {
    const c = this.cache(); if (!c) return null;
    try { const s = c.get(this.versao + ':' + chave); return s ? JSON.parse(s.slice(0, 2) === 'z:' ? this.expandir(s) : s) : null; } catch (_) { return null; }
  }
  static gravar(chave, valor, segundos) {
    const c = this.cache(); if (!c) return;
    try {
      let s = JSON.stringify(valor); if (s.length > this.comprimirAcima) s = this.comprimir(s);
      if (s.length < 95000) c.put(this.versao + ':' + chave, s, Math.min(21600, segundos || 600));
    } catch (_) {}
  }
  /** Devolve do cache ou calcula, grava e devolve. atualizar=true força o recálculo. */
  static obter(chave, segundos, calcular, atualizar) {
    if (!atualizar) { const v = this.ler(chave); if (v !== null) return v; }
    const v = calcular(); this.gravar(chave, v, segundos); return v;
  }
}
