-- =====================================================
-- ShiftSync - Schema Completo do Banco de Dados
-- Sistema de Controle de Horas Extras
-- =====================================================

-- =====================================================
-- 1. TIPOS CUSTOMIZADOS (ENUMS)
-- =====================================================

-- Enum para definir os tipos de usuário no sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- =====================================================
-- 2. TABELAS
-- =====================================================

-- Tabela de perfis de usuários
-- Armazena informações adicionais sobre cada usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita Row Level Security na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de roles/funções dos usuários
-- Mapeia quais roles cada usuário possui (admin ou employee)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Habilita Row Level Security na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tabela de registros de horas extras
-- Armazena todos os registros de horas extras dos funcionários
CREATE TABLE public.overtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours NUMERIC(4,2) NOT NULL,
  justification TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita Row Level Security na tabela overtime_records
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. FUNÇÕES DE SEGURANÇA
-- =====================================================

-- Função para verificar se um usuário possui determinado role
-- Utilizada nas políticas RLS para controle de acesso
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função para criar perfil automaticamente quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere um novo registro na tabela profiles
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || SUBSTRING(NEW.id::text FROM 1 FOR 8)
    )
  );
  
  -- Atribui automaticamente o role de employee para novos usuários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Função para deletar usuários (apenas admins podem executar)
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se o usuário que está executando é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Deleta o usuário (cascade irá deletar registros relacionados)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- =====================================================
-- 4. POLÍTICAS RLS - PROFILES
-- =====================================================

-- Permite que usuários visualizem seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Permite que admins visualizem todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Permite que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 5. POLÍTICAS RLS - USER_ROLES
-- =====================================================

-- Permite que usuários visualizem seus próprios roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Permite que admins visualizem todos os roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Permite que admins gerenciem todos os roles (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 6. POLÍTICAS RLS - OVERTIME_RECORDS
-- =====================================================

-- Permite que usuários visualizem seus próprios registros de horas extras
CREATE POLICY "Users can view their own overtime records"
  ON public.overtime_records FOR SELECT
  USING (user_id = auth.uid());

-- Permite que usuários insiram seus próprios registros de horas extras
CREATE POLICY "Users can insert their own overtime records"
  ON public.overtime_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Permite que usuários atualizem seus próprios registros de horas extras
CREATE POLICY "Users can update their own overtime records"
  ON public.overtime_records FOR UPDATE
  USING (user_id = auth.uid());

-- Permite que usuários deletem seus próprios registros de horas extras
CREATE POLICY "Users can delete their own overtime records"
  ON public.overtime_records FOR DELETE
  USING (user_id = auth.uid());

-- Permite que admins visualizem todos os registros de horas extras
CREATE POLICY "Admins can view all overtime records"
  ON public.overtime_records FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger para atualizar automaticamente o campo updated_at em overtime_records
CREATE TRIGGER update_overtime_records_updated_at
  BEFORE UPDATE ON public.overtime_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente quando um novo usuário se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. NOTAS DE CONFIGURAÇÃO
-- =====================================================

/*
CONFIGURAÇÕES IMPORTANTES:

1. CRIAR USUÁRIO ADMIN:
   - Utilize o painel de administração (ou o Supabase Auth com chave de serviço) para criar o primeiro usuário
   - Após criar, atualize seu papel para 'admin':
     UPDATE user_roles 
     SET role = 'admin' 
     WHERE user_id = (SELECT id FROM profiles WHERE username = '<usuario_admin>');

2. AUTENTICAÇÃO:
   - O aplicativo só solicita usuário e senha; o e-mail exigido pelo Supabase é gerado automaticamente no backend
   - Garanta que o domínio usado para gerar e-mails sintéticos esteja configurado via variável de ambiente (ex.: VITE_APP_EMAIL_DOMAIN)

3. SEGURANÇA:
   - Todas as tabelas têm Row Level Security (RLS) habilitado
   - Funções SECURITY DEFINER garantem execução segura
   - Apenas admins podem deletar usuários e visualizar todos os dados
   - Funcionários só podem gerenciar seus próprios registros

4. CASCADE DELETE:
   - Deletar um usuário remove automaticamente:
     * Perfil (profiles)
     * Roles (user_roles)
     * Registros de horas extras (overtime_records)
*/
