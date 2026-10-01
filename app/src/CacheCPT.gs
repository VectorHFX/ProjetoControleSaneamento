/**
 * CacheCPT 2.2.0. Cache compartilhado (ScriptCache) para leituras pesadas.
 * A aplicação roda como o proprietário e todos veem os mesmos dados, então um único cache serve a equipe toda.
 * As chaves incluem a última linha das tabelas: um registro novo invalida o cache sozinho.
 * Limite do Google: 100 KB por valor. Acima disso, simplesmente não guarda.
 */
class CacheCPT {
  static get versao() { return '22'; }
  static cache() { try { return CacheService.getScriptCache(); } catch (_) { return null; } }
  static ler(chave) {
    const c = this.cache(); if (!c) return null;
    try { const s = c.get(this.versao + ':' + chave); return s ? JSON.parse(s) : null; } catch (_) { return null; }
  }
  static gravar(chave, valor, segundos) {
    const c = this.cache(); if (!c) return;
    try { const s = JSON.stringify(valor); if (s.length < 95000) c.put(this.versao + ':' + chave, s, Math.min(21600, segundos || 600)); } catch (_) {}
  }
  /** Devolve do cache ou calcula, grava e devolve. atualizar=true força o recálculo. */
  static obter(chave, segundos, calcular, atualizar) {
    if (!atualizar) { const v = this.ler(chave); if (v !== null) return v; }
    const v = calcular(); this.gravar(chave, v, segundos); return v;
  }
}
