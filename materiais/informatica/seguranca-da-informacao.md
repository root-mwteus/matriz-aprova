# O que cai

**Matéria:** Informática  
**Tema:** Segurança da Informação  
**Concursos-alvo:** Receita Federal, CGU, PRF, Polícia Federal, INSS, TRT, TCU/TCE, Câmara e Petrobras  
**Bancas de referência:** Cebraspe, FCC e bancas semelhantes

Segurança da Informação costuma ser cobrada por conceitos, situações práticas
e diferenças entre ameaças. Os pontos mais importantes são:

1. princípios da segurança: confidencialidade, integridade, disponibilidade,
   autenticidade e não repúdio;
2. malware e formas de infecção;
3. phishing, engenharia social e spoofing;
4. senhas, autenticação multifator e controle de acesso;
5. backup, criptografia e certificados digitais;
6. diferença entre firewall, antivírus e mecanismos de detecção.

**Atenção:** segurança não é apenas instalar antivírus. Ela combina pessoas,
processos, controles físicos e tecnologias.

# Teoria essencial

## 1. Princípios da Segurança da Informação

### 1.1. Confidencialidade

Confidencialidade é garantir que a informação seja acessada somente por pessoas
ou sistemas autorizados. Controle de permissões, criptografia e classificação
da informação são mecanismos relacionados a esse princípio.

Uma quebra de confidencialidade ocorre quando um arquivo sigiloso é copiado ou
visualizado por pessoa sem autorização, ainda que o conteúdo não seja alterado.

### 1.2. Integridade

Integridade é preservar a exatidão, a completude e a não alteração indevida da
informação. Hashes, assinaturas digitais e controle de versões ajudam a
verificar se um arquivo foi modificado.

Se alguém altera o valor de uma nota em um sistema sem autorização, há quebra
de integridade. O arquivo pode continuar disponível e acessível, mas seu
conteúdo deixou de ser confiável.

### 1.3. Disponibilidade

Disponibilidade é permitir que usuários autorizados acessem a informação e os
serviços quando necessários. Redundância, manutenção, nobreak, backups,
monitoramento e proteção contra ataques de negação de serviço contribuem para
esse princípio.

### 1.4. Autenticidade

Autenticidade permite verificar a identidade de uma pessoa, sistema ou origem
de uma mensagem. Login, certificado digital e assinatura digital podem ajudar
nesse processo.

Autenticidade não é a mesma coisa que autorização. A primeira responde
"quem é?"; a segunda responde "o que essa identidade pode fazer?".

### 1.5. Não repúdio

Não repúdio busca impedir que o autor de uma ação negue posteriormente sua
realização. Assinaturas digitais e registros confiáveis de auditoria podem
contribuir para esse objetivo.

## 2. Malware

Malware é software malicioso criado para causar dano, obter acesso indevido,
roubar informações ou explorar recursos do dispositivo.

| Tipo | Característica |
|---|---|
| vírus | depende de arquivo hospedeiro e normalmente precisa de alguma ação para se propagar |
| worm | propaga-se automaticamente por redes ou sistemas vulneráveis |
| trojan | disfarça-se de programa legítimo para induzir a instalação |
| ransomware | bloqueia ou cifra dados e exige pagamento ou outra vantagem |
| spyware | monitora atividades e coleta informações |
| keylogger | registra teclas digitadas, inclusive senhas |
| adware | exibe publicidade indesejada; pode também rastrear hábitos |
| rootkit | busca ocultar presença e manter acesso privilegiado |
| bot | transforma o dispositivo em parte de uma rede controlada |

Um arquivo infectado por vírus pode contaminar outros quando é executado ou
compartilhado. O worm não precisa necessariamente de um arquivo hospedeiro e
é conhecido pela capacidade de propagação automática.

## 3. Engenharia social e phishing

Engenharia social explora comportamento humano para obter acesso, informação ou
vantagem. O atacante pode usar autoridade falsa, urgência, medo, curiosidade ou
recompensa.

**Phishing** é uma fraude que tenta induzir a vítima a clicar em link, abrir
arquivo ou fornecer dados, geralmente por e-mail, mensagem ou página falsa.

Variações comuns:

- **spear phishing:** ataque direcionado a uma pessoa ou organização;
- **smishing:** phishing por SMS ou aplicativo de mensagens;
- **vishing:** fraude por ligação ou voz;
- **pharming:** redirecionamento para página falsa, mesmo quando a vítima tenta
  acessar um endereço legítimo.

**Spoofing** é falsificação de identidade, origem ou endereço. Pode envolver
e-mail, número de telefone, endereço IP, DNS ou página visualmente semelhante.

Cuidados: conferir domínio, não confiar apenas no nome exibido, evitar links
inesperados, confirmar solicitações por canal independente e nunca fornecer
senha ou código de autenticação por mensagem.

## 4. Senhas e autenticação

Autenticação é o processo de verificar a identidade. Os fatores de autenticação
são normalmente classificados como:

- algo que o usuário **sabe**: senha ou PIN;
- algo que o usuário **possui**: token, celular ou cartão;
- algo que o usuário **é**: impressão digital ou reconhecimento facial.

Autenticação multifator combina fatores diferentes. Digitar senha e depois
confirmar um código em aplicativo usa conhecimento e posse. Usar duas senhas
continua sendo, em regra, um único fator: algo que o usuário sabe.

Uma boa senha deve ser exclusiva, longa e não baseada em informações públicas.
O armazenamento seguro deve usar funções de derivação e mecanismos adequados,
nunca guardar senhas em texto puro.

## 5. Criptografia, hash e assinatura digital

Criptografia transforma uma informação legível em conteúdo protegido por meio
de algoritmo e chave.

### 5.1. Criptografia simétrica

Usa a mesma chave para cifrar e decifrar. É eficiente para grandes volumes de
dados, mas exige que a chave seja compartilhada com segurança.

### 5.2. Criptografia assimétrica

Usa um par de chaves relacionadas: pública e privada. A chave pública pode ser
compartilhada; a privada deve permanecer protegida.

Para confidencialidade, uma mensagem pode ser cifrada com a chave pública do
destinatário, que a decifra com sua chave privada. Para assinatura digital,
usa-se a chave privada do signatário, e a verificação é feita com a chave
pública correspondente.

### 5.3. Hash

Hash é uma função que produz um resumo de tamanho definido a partir de uma
entrada. Uma alteração no arquivo tende a produzir outro resumo. Hash não é
criptografia reversível: não existe, em condições normais, uma chave para
"desfazer" o hash.

### 5.4. Assinatura digital

Assinatura digital ajuda a verificar autoria, integridade e, em determinados
contextos, não repúdio. Ela não é simplesmente uma imagem da assinatura
manuscrita colada em um documento.

## 6. Firewall, antivírus e IDS/IPS

- **Firewall:** controla tráfego de rede com base em regras. Pode bloquear ou
  permitir conexões de acordo com origem, destino, porta, protocolo e outros
  critérios.
- **Antivírus/antimalware:** identifica, bloqueia ou remove códigos maliciosos.
- **IDS:** detecta e alerta sobre atividades suspeitas.
- **IPS:** além de detectar, pode bloquear ou impedir a atividade identificada.

Nenhum desses mecanismos garante proteção absoluta. Segurança depende de
configuração, atualização, monitoramento e comportamento seguro.

## 7. Backup

Backup é uma cópia de dados para recuperação em caso de perda, corrupção,
falha, ataque ou exclusão acidental.

A estratégia **3-2-1** recomenda manter:

- pelo menos 3 cópias dos dados;
- em 2 tipos de mídia diferentes;
- pelo menos 1 cópia fora do ambiente principal.

Backup conectado permanentemente ao computador pode ser atingido por
ransomware. É necessário testar a restauração: uma cópia que nunca foi
recuperada pode não ser utilizável quando necessária.

# Como a banca cobra

- Confidencialidade trata de acesso; integridade trata de alteração;
  disponibilidade trata de acesso no momento necessário.
- Autenticação identifica; autorização define permissões.
- Hash não é criptografia reversível.
- MFA exige fatores diferentes, não apenas duas senhas.
- Worm se propaga automaticamente; trojan depende de disfarce e indução.
- Firewall controla tráfego; antivírus atua contra código malicioso.
- Backup é cópia de recuperação, não simplesmente sincronização.

# Exemplos resolvidos

## Exemplo 1

Um atacante modifica o valor de uma transferência bancária, mas o usuário
continua conseguindo acessar o sistema. Qual princípio foi violado?

**Integridade.** O dado foi alterado indevidamente. A disponibilidade foi
mantida, e não há informação suficiente para afirmar quebra de
confidencialidade.

## Exemplo 2

Uma mensagem solicita que o usuário clique em um link para evitar o bloqueio
imediato da conta. A página imita o banco e pede senha e código. Qual é o ataque?

**Phishing**, com uso de engenharia social. A urgência é usada para induzir a
vítima a fornecer credenciais em uma página falsa.

# Quadro-resumo

| Conceito | Pergunta principal |
|---|---|
| confidencialidade | quem pode acessar? |
| integridade | o conteúdo foi alterado? |
| disponibilidade | o serviço está acessível quando necessário? |
| autenticidade | quem é o autor ou usuário? |
| autorização | o que ele pode fazer? |
| vírus | usa arquivo hospedeiro |
| worm | propaga-se automaticamente |
| trojan | disfarça-se de programa legítimo |
| ransomware | bloqueia ou cifra dados |
| hash | verifica resumo, não é reversível |

# Questões de fixação

## Questão 1 — (questão inédita)

Um usuário autorizado acessa um arquivo, mas encontra seu conteúdo alterado
sem permissão. O principal princípio afetado é:

A) confidencialidade.  
B) integridade.  
C) disponibilidade.  
D) autenticidade.  
E) não repúdio.

**Gabarito: B.** Integridade protege a exatidão e a não alteração indevida da
informação.

## Questão 2 — (questão inédita)

A combinação de senha e código gerado por aplicativo caracteriza:

A) duas senhas do mesmo fator.  
B) autenticação multifator.  
C) criptografia simétrica.  
D) assinatura digital.  
E) autorização sem autenticação.

**Gabarito: B.** A senha é algo que o usuário sabe; o aplicativo ou dispositivo
é algo que possui. São fatores diferentes.

## Questão 3 — (questão inédita)

Assinale a alternativa correta sobre malware.

A) Worm sempre precisa de arquivo hospedeiro.  
B) Trojan é um mecanismo de backup.  
C) Ransomware pode cifrar dados e exigir pagamento.  
D) Spyware é um protocolo de criptografia.  
E) Rootkit é um equipamento de rede.

**Gabarito: C.** Ransomware pode impedir o acesso aos dados por meio de
criptografia e exigir resgate.

## Questão 4 — (questão inédita)

Sobre hash, é correto afirmar que:

A) sempre permite recuperar o arquivo original com a chave pública.  
B) é sinônimo de criptografia simétrica.  
C) gera um resumo usado, entre outras finalidades, para verificar alterações.  
D) impede qualquer tipo de malware.  
E) exige duas senhas para funcionar.

**Gabarito: C.** Hash produz um resumo e pode ser usado para verificar
integridade; não é uma cifra reversível.

## Questão 5 — (questão inédita)

Na estratégia de backup 3-2-1, recomenda-se:

A) 3 cópias, em 2 tipos de mídia, com 1 fora do ambiente principal.  
B) 3 senhas, em 2 usuários, com 1 administrador.  
C) 3 firewalls, em 2 redes, com 1 cópia local.  
D) 3 antivírus, em 2 computadores, com 1 arquivo.  
E) 3 cópias exclusivamente online.

**Gabarito: A.** A estratégia combina redundância, mídias diferentes e uma
cópia fora do ambiente principal.

# Revisão final

- [ ] Diferencio confidencialidade, integridade e disponibilidade.
- [ ] Sei separar autenticação de autorização.
- [ ] Reconheço vírus, worm, trojan, ransomware e spyware.
- [ ] Identifico phishing, smishing, vishing e spoofing.
- [ ] Sei o que caracteriza autenticação multifator.
- [ ] Diferencio criptografia simétrica e assimétrica.
- [ ] Sei que hash não é reversível como uma cifra.
- [ ] Diferencio firewall, antivírus, IDS e IPS.
- [ ] Sei aplicar a regra de backup 3-2-1.
