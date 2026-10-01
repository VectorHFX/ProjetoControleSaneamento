/**
 * AplicarObrasDoRelatorio — v4.0.4
 * SOMENTE ATUALIZAÇÃO INICIAL: aplica as 15 frentes informadas por Victor em setembro/2026.
 * Execute aplicarObrasDoRelatorioCampo40 no MESMO projeto já instalado.
 * Depois de conferir as oito opções e o controle Salvar, este arquivo pode ser removido.
 */
class AplicarObrasDoRelatorio {
  static dataBrasil(valor) {
    if(valor==='Pausada')return valor;
    const m=String(valor).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(!m)throw new Error('Data inválida na relação de obras: '+valor);
    const data=new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]),12));
    if(data.getUTCDate()!==Number(m[1])||data.getUTCMonth()!==Number(m[2])-1)throw new Error('Data inexistente: '+valor);
    return data;
  }
  static get registros() {return [
  {
    "idPAC": "OBR-0117",
    "nome": "Viela Sanitária x Carijós – Obra Córrego",
    "inicio": "19/08/2026",
    "situacao": "Em andamento",
    "bairros": [
      "Jardim do Estádio",
      "Vila Linda"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "19/08/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0074",
    "nome": "Córrego Apiaí – Margem Esquerda Orquídea",
    "inicio": "16/07/2026",
    "situacao": "Em andamento",
    "bairros": [
      "Vila Linda"
    ],
    "publico": "A, B",
    "impacto": "Médio",
    "comunicacao": "16/07/2026",
    "observacao": "Implementação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0061",
    "nome": "Rua Marcolino Antonio Moutinho x Caminho dos Vianas x Rua Ciprestes – Ferro Velho VCA",
    "inicio": "16/09/2026",
    "situacao": "Em andamento",
    "bairros": [
      "Jardim Cipreste"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "16/09/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": null,
    "nome": "Cata Preta x Caminho dos Vianas – VCA",
    "inicio": "17/08/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Cata Preta",
      "Vila João Ramalho"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "17/08/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": null,
    "nome": "Estrada Cata Preta – VCA",
    "inicio": "24/08/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Cata Preta",
      "Vila João Ramalho"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "24/08/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0067",
    "nome": "Estrada Cata Preta x Rua D. João III x Rua Dr. Manoel – HDD",
    "inicio": "13/03/2026",
    "situacao": "Em andamento",
    "bairros": [
      "Cata Preta",
      "Vila João Ramalho"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "13/03/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0049",
    "nome": "Caminho dos Vianas x Rua Ciprestes x Rua André Magine",
    "inicio": "20/01/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Jardim Irene"
    ],
    "publico": "A",
    "impacto": "Alto",
    "comunicacao": "20/01/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0141",
    "nome": "Rua Vasco da Gama x Rua Vasco Fernandes Coutinho x Vielas",
    "inicio": "16/06/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Vila João Ramalho"
    ],
    "publico": "A",
    "impacto": "Alto",
    "comunicacao": "16/06/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0056",
    "nome": "Av. Valdemar Mattei / Prof. Valdemar Mattei x Praça Ives Ota – Bolsão",
    "inicio": "10/01/2026",
    "situacao": "Paralisada",
    "bairros": [
      "Vila Assunção"
    ],
    "publico": "A",
    "impacto": "Alto",
    "comunicacao": "Pausada",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0021",
    "nome": "Marginal Pinheirinho",
    "inicio": "24/02/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Jardim Santa Cristina"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "24/02/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": null,
    "nome": "Rua Aníbal Freire",
    "inicio": "19/05/2026",
    "situacao": "Paralisada",
    "bairros": [
      "Vila Eldízia"
    ],
    "publico": "A, B",
    "impacto": "Baixo",
    "comunicacao": "Pausada",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0093",
    "nome": "Rua Juquiá",
    "inicio": "07/04/2026",
    "situacao": "Paralisada",
    "bairros": [
      "Vila Eldízia"
    ],
    "publico": "B",
    "impacto": "Médio",
    "comunicacao": "Pausada",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": null,
    "nome": "Rua André Magine",
    "inicio": "13/03/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Jardim Irene"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "13/03/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0022",
    "nome": "Rua Carneiro Ribeiro, nº 3",
    "inicio": "11/03/2026",
    "situacao": "Finalizada",
    "bairros": [
      "Jardim Santa Cristina"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "11/03/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  },
  {
    "idPAC": "OBR-0133",
    "nome": "Viela Sanitária x Rua Luís Lobo Neto x Rua Carijós – Córrego Canalizado",
    "inicio": "19/08/2026",
    "situacao": "Em andamento",
    "bairros": [
      "Jardim Santa Cristina"
    ],
    "publico": "C",
    "impacto": "Alto",
    "comunicacao": "19/08/2026",
    "observacao": "Ampliação da rede de esgoto para assegurar o afastamento correto dos efluentes, transporte e tratamento."
  }
];}

  /** Plano em memória: valida antes de escrever. IDs não são pareados por semelhança vaga. */
  static planejar(obras,bairros,agora) {
    obras=obras.filter(r=>r.some(v=>v!==''&&v!==false)).map(r=>{const x=r.slice();while(x.length<26)x.push('');return x;});
    bairros=bairros.filter(r=>r.some(v=>v!==''&&v!==false)).map(r=>r.slice());
    CatalogosDeObrasEBairros.validarLinhas(obras,bairros);
    const normalizar=CatalogosDeObrasEBairros.normalizar;
    const porId=new Map(obras.map(r=>[r[0],r])),porNome=new Map();
    obras.forEach(r=>{const chave=normalizar(r[1]);if(!porNome.has(chave))porNome.set(chave,[]);porNome.get(chave).push(r);});
    const porBairro=new Map(bairros.map(r=>[normalizar(r[1]),r]));
    let ultimoObra=Math.max(0,...obras.map(r=>Number(String(r[0]).replace('OBR-',''))));
    let ultimoBairro=Math.max(0,...bairros.map(r=>Number(String(r[0]).replace('BAI-',''))));
    // Apenas a seleção é recortada: as demais frentes PAC16 ficam disponíveis para consulta futura.
    obras.forEach(r=>{r[3]=false;});
    const correspondencias=[];
    this.registros.forEach(d=>{
      const vinculados=d.bairros.map(nome=>{
        const chave=normalizar(nome);let bairro=porBairro.get(chave);
        if(!bairro){bairro=['BAI-'+String(++ultimoBairro).padStart(3,'0'),nome,true,'Santo André','Bairro','Relação de obras informada por Victor — setembro/2026'];bairros.push(bairro);porBairro.set(chave,bairro);}
        if(bairro[4]==='Opção especial')throw new Error('Bairro de obra não pode ser opção especial: '+nome);
        bairro[2]=true;return bairro[1];
      });
      let r=d.idPAC?porId.get(d.idPAC):null;
      if(d.idPAC&&!r)throw new Error('ID PAC16 esperado ausente: '+d.idPAC+'. Confira o cadastro antes de aplicar.');
      if(!d.idPAC){const candidatos=porNome.get(normalizar(d.nome))||[];if(candidatos.length>1)throw new Error('Mais de uma obra com o nome exato: '+d.nome);r=candidatos[0];}
      const nomeAnterior=r?r[1]:null;
      if(!r){
        r=Array(26).fill('');r[0]='OBR-'+String(++ultimoObra).padStart(4,'0');r[7]='Santo André';r[8]=d.nome;
        r[13]='Relação de obras informada por Victor — setembro/2026';r[18]='Frente atual própria: correspondência individual no PAC16 não confirmada. Não inferir EAP ou coordenadas.';
        obras.push(r);porId.set(r[0],r);porNome.set(normalizar(d.nome),[r]);
      }
      r[1]=d.nome;r[2]=vinculados.join('; ');r[3]=CatalogosDeObrasEBairros.disponivel(d.situacao);
      r[12]=d.nome; // Ponto/trecho descritivo. Não inventa latitude nem longitude.
      [d.situacao,this.dataBrasil(d.inicio),this.dataBrasil(d.comunicacao),d.publico,d.impacto,d.observacao,new Date(agora)].forEach((v,i)=>{r[19+i]=v;});
      correspondencias.push({id:r[0],idPAC:d.idPAC,nomeAnterior:nomeAnterior,nome:d.nome,situacao:d.situacao});
    });
    const dados=CatalogosDeObrasEBairros.validarLinhas(obras,bairros);
    if(dados.obras.filter(x=>x.mostrar).length!==8)throw new Error('O recorte deve conter exatamente oito obras. Nenhuma lista foi publicada.');
    return {obras:obras,bairros:bairros,dados:dados,correspondencias:correspondencias};
  }

  static aplicar() {
    return ConfiguracaoDaBase.comTrava(function(){
      const e=ConfiguracaoDaBase.exigirInstalacao(),base=SpreadsheetApp.openById(e.baseId),form=FormApp.openById(e.formId);
      if(e.obrasRelatorioSetembroAplicadas){
        CatalogosDeObrasEBairros.prepararColunas(base);CatalogosDeObrasEBairros.instalarControles(base,e);
        const r=CatalogosDeObrasEBairros.publicar(base,form,e,CatalogosDeObrasEBairros.autor(),'Conferência de atualização já aplicada');
        CatalogosDeObrasEBairros.aviso(base,'Atualização já aplicada. Suas edições foram mantidas. '+r.obras.length+' obras disponíveis.',false);return r;
      }
      const o=base.getSheetByName('Obras'),b=base.getSheetByName('Bairros');
      const largura=Math.min(26,o.getMaxColumns()),antesObras=CatalogosDeObrasEBairros.lerLinhas(o,largura),antesBairros=CatalogosDeObrasEBairros.lerLinhas(b,6);
      const plano=AplicarObrasDoRelatorio.planejar(antesObras,antesBairros,new Date().toISOString());
      // Guarda a origem e o pareamento na pasta existente, sem criar novas abas.
      const pasta=DriveApp.getFolderById(e.pastaId);
      if(!e.recorteRelatorioFonteId){e.recorteRelatorioFonteId=ConfiguracaoDaBase.gravarJson(pasta,null,'Recorte_Obras_Setembro_2026.json',{
        registradoEm:new Date().toISOString(),origem:'Tabela fornecida por Victor',registros:AplicarObrasDoRelatorio.registros,
        correspondencias:plano.correspondencias,antes:{obras:antesObras,bairros:antesBairros}});ConfiguracaoDaBase.salvarEstado(e);}
      CatalogosDeObrasEBairros.prepararColunas(base);
      if(o.getMaxRows()<plano.obras.length+1)o.insertRowsAfter(o.getMaxRows(),plano.obras.length+1-o.getMaxRows());
      if(b.getMaxRows()<plano.bairros.length+1)b.insertRowsAfter(b.getMaxRows(),plano.bairros.length+1-b.getMaxRows());
      b.getRange(2,1,plano.bairros.length,6).setValues(plano.bairros);
      o.getRange(2,1,plano.obras.length,26).setValues(plano.obras);
      e.catalogosAtuais=true;CatalogosDeObrasEBairros.instalarControles(base,e);
      try {
        const r=CatalogosDeObrasEBairros.publicar(base,form,e,CatalogosDeObrasEBairros.autor(),'Aplicação da relação de obras — setembro/2026',plano.dados);
        e.obrasRelatorioSetembroAplicadas=true;e.versao='4.0.4';ConfiguracaoDaBase.salvarEstado(e);
        CatalogosDeObrasEBairros.aviso(base,'Salvo! 5 em andamento + 3 paralisadas. As 7 finalizadas ficaram no cadastro.',false);
        console.log(JSON.stringify({resultado:'CONCLUÍDO',obrasNoFormulario:8,opcoesEspeciais:2,bairros:r.bairros.length,pareamento:plano.correspondencias},null,2));return r;
      }catch(erro){CatalogosDeObrasEBairros.aviso(base,'Cadastro preparado, mas a publicação não concluiu. Execute aplicarObrasDoRelatorioCampo40 novamente. '+String(erro.message||erro),true);throw erro;}
    });
  }
}
function aplicarObrasDoRelatorioCampo40(){return AplicarObrasDoRelatorio.aplicar();}
