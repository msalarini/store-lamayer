# 🌶️ Store Lamayer

Sistema de gestão de estoque e controle financeiro para comércio de especiarias, desenvolvido com foco em performance, usabilidade e dados em tempo real.

## 🏗️ Arquitetura e Tecnologias

O projeto utiliza uma arquitetura moderna baseada em **Next.js 15 (App Router)** e **Server Components**, garantindo alta performance e SEO otimizado.

### Stack Principal
-   **Frontend**: [Next.js 15](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
-   **Componentes UI**: [Shadcn UI](https://ui.shadcn.com/) (baseado em Radix UI)
-   **Ícones**: [Lucide React](https://lucide.dev/)
-   **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
-   **Autenticação**: [NextAuth.js](https://next-auth.js.org/) (OAuth Google/Microsoft)
-   **Validação**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)

### Estrutura do Projeto

```
store-lamayer/
├── database/              # Scripts de migração e schemas do banco de dados
├── src/
│   ├── app/               # Rotas e páginas (App Router)
│   │   ├── analytics/     # Página de relatórios e exportação
│   │   ├── dashboard/     # Painel principal
│   │   ├── api/           # API Routes (NextAuth, etc.)
│   │   └── ...
│   ├── components/        # Componentes reutilizáveis (UI, Forms, etc.)
│   ├── lib/               # Utilitários e configurações (Supabase client, utils)
│   └── types/             # Definições de tipos TypeScript
├── public/                # Assets estáticos
└── ...
```

## 🚀 Funcionalidades Principais

-   **Dashboard Interativo**: Visão geral de estoque, capital investido, lucro projetado e cotação do Guarani em tempo real.
-   **Gestão de Produtos**: CRUD completo com suporte a preços de atacado/varejo e conversão automática de moeda.
-   **Analytics**: Relatórios detalhados e exportação de dados para Excel.
-   **Etiquetas e Códigos de Barra**: Geração automática de etiquetas para impressão.
-   **Backup e Segurança**: Logs de auditoria e ferramentas de backup.

## ⚙️ Configuração e Instalação

### Pré-requisitos
-   Node.js 18+
-   Conta no Supabase

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/SEU_USUARIO/store-lamayer.git
    cd store-lamayer
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env.local` na raiz com as chaves do Supabase e NextAuth (veja `.env.example`).

4.  **Banco de Dados:**
    Execute os scripts SQL localizados na pasta `database/` no SQL Editor do seu projeto Supabase para criar as tabelas necessárias.

5.  **Execute o projeto:**
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000`.

## 📦 Deploy

O projeto está otimizado para deploy na **Vercel**. Basta conectar o repositório e configurar as variáveis de ambiente.

---

**Store Lamayer** - Desenvolvido por Marcus Salarini
