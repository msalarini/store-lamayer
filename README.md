# 🌶️ Store Lamayer

Sistema de gestão de estoque para comércio de especiarias, desenvolvido com Next.js e Supabase.

## 🚀 Funcionalidades Atuais

- ✅ **Autenticação**: Login com Google e Microsoft OAuth
- ✅ **Gestão de Produtos**: CRUD completo (Criar, Ler, Atualizar, Excluir)
- ✅ **Dashboard**: Estatísticas em tempo real
  - Total de produtos
  - Estoque total  
  - Valor do inventário
  - Histórico de atividades
- ✅ **Tema Claro/Escuro**: Interface adaptável com tema verde
- ✅ **Registro de Logs**: Auditoria de todas as ações
- ✅ **Interface em Português**: 100% traduzida para facilitar uso

## 🛠️ Tecnologias

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Shadcn UI, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: NextAuth.js
- **Formulários**: React Hook Form + Zod
- **Notificações**: Sonner

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (grátis)
- Credenciais OAuth do Google/Microsoft (opcional, tem modo dev)

## ⚙️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/store-lamayer.git
cd store-lamayer
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# NextAuth
NEXTAUTH_SECRET=gere_uma_chave_secreta_aqui
NEXTAUTH_URL=http://localhost:3000

# OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
```

4. Execute o script SQL no Supabase:

Acesse o SQL Editor do Supabase e execute o conteúdo de `supabase_schema.sql`

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse http://localhost:3000

## 🔐 Modo Desenvolvedor

Se as credenciais OAuth não estiverem configuradas, use o modo desenvolvedor na página de login:
- Digite um email permitido: `marcussalarini@gmail.com` ou `llamayer@hotmail.com`
- Clique em "Entrar (Dev)"

## 📦 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Importe o projeto no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy automático! 🚀

## 🎯 Roadmap - Próximas Funcionalidades

### 📊 Fase 1 - Organização (Essencial)
- [ ] Sistema de categorias para especiarias
- [ ] Busca e filtros avançados
- [ ] Controle de data de validade
- [ ] Alertas visuais de estoque baixo

### 💰 Fase 2 - Gestão Financeira
- [ ] Relatórios de lucro e margem
- [ ] Análise de produtos mais/menos lucrativos
- [ ] Histórico de preços
- [ ] Dashboard financeiro

### 📈 Fase 3 - Analytics
- [ ] Gráficos de vendas
- [ ] Tendências de estoque
- [ ] Produtos mais vendidos
- [ ] Exportação para Excel/CSV

### 🏭 Fase 4 - Fornecedores
- [ ] Cadastro de fornecedores
- [ ] Vincular produtos a fornecedores
- [ ] Histórico de compras
- [ ] Comparação de preços

### 🎨 Fase 5 - Extras
- [ ] Impressão de etiquetas de preço
- [ ] Código de barras
- [ ] App mobile PWA
- [ ] Backup automático

## 📝 Licença

MIT

## 👥 Desenvolvido por

Marcus Salarini para Store Lamayer - Comércio de Especiarias

---

💚 Desenvolvido com amor usando Next.js e Supabase
