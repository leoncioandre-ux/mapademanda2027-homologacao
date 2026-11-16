# Autenticação — Mapa de Demanda 2027 (ambiente de desenvolvimento)

Esta pasta contém uma proposta inicial de integração. Ela **não altera o index.html publicado** e não está em produção.

## Arquivos
- `Code.gs`: backend Apps Script. Valida o Firebase ID token no servidor e consulta a aba `AUTORIZADOS` antes de liberar os dados.
- `Bridge.html`: página HTML que deve existir dentro do projeto Apps Script. Ela recebe mensagens do GitHub Pages e usa `google.script.run` para chamar o backend.

## Antes de usar
1. Faça uma cópia do projeto Apps Script atual. Não substitua o endpoint em produção.
2. No projeto de teste do Apps Script, crie/substitua o conteúdo de `Code.gs` pelo arquivo desta pasta e crie um arquivo HTML chamado exatamente `Bridge`, copiando `Bridge.html`.
3. Em **Configurações do projeto > Propriedades do script**, adicione:
   - Nome: `FIREBASE_WEB_API_KEY`
   - Valor: a `apiKey` pública exibida na configuração do aplicativo Web Firebase.
4. Execute manualmente `configurarAbaAutorizados` uma vez. Autorize as permissões solicitadas.
5. Na planilha, preencha a aba `AUTORIZADOS` com as colunas `Email | Nome | Perfil | Ativo`. Para liberar alguém, use o e-mail exato e `Ativo = TRUE` (ou `Sim`). A conta administradora definida em `ADMIN_EMAIL` é liberada pelo código.
6. Proteja a aba e o intervalo de autorização para que somente o administrador possa editá-los.
7. Implante o Apps Script de teste como **Aplicativo da Web**, executando como o proprietário. Copie a URL terminada em `/exec`.
8. Teste a URL `/exec?mode=bridge` em uma aba separada. Ela deve abrir uma página em branco; isso é esperado.

## Observações de segurança e limitações
- O endpoint antigo com JSONP continua público até ser substituído/revogado. Não o considere protegido.
- Não publique dados de alunos ou dados operacionais em CSV público.
- O ID token do Firebase é validado no servidor usando o endpoint oficial de lookup do Firebase Identity Toolkit.
- A ponte usa um iframe do Apps Script com `ALLOWALL`; o HTML da ponte só aceita mensagens cuja origem seja `https://leoncioandre-ux.github.io`.
- O frontend ainda precisa ser integrado ao Firebase Auth e à ponte. Não está concluído neste commit.
- O Apps Script precisa ser implantado em uma implantação de teste separada. Não edite a implantação atual.
- A chave `apiKey` é uma configuração pública do Firebase, mas deve ser restringida no console do Google Cloud/Firebase conforme as plataformas e APIs utilizadas.
- A aba `AUTORIZADOS` controla autorização de acesso; não compartilhe sua edição com usuários comuns.
- Esta implementação é uma base de desenvolvimento e precisa passar por testes de login, e-mail não autorizado, usuário desativado, token expirado, CORS/mensagens e carregamento de ambas as abas antes de entrar em produção.
