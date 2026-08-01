-- ============================================================
-- MATRIZ APROVA — Schema Completo Supabase
-- ============================================================

-- 1. PROFILES (estende auth.users)
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  nome        text,
  area_concurso text,
  data_prova  date,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  suspenso    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário edita apenas seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user' AND suspenso = false);

CREATE POLICY "Sistema pode inserir perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user' AND suspenso = false);

-- SECURITY DEFINER: roda como o dono (que ignora RLS), então o SELECT em
-- profiles NÃO re-dispara as policies de profiles — evita "infinite
-- recursion detected in policy for relation profiles".
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "Admin vê todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin atualiza qualquer perfil"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role  ON public.profiles(role);

-- 2. COURSES
CREATE TABLE public.courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  area          text,
  descricao     text,
  thumbnail_url text,
  publicado     boolean NOT NULL DEFAULT false,
  ordem         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses visíveis para todos usuários autenticados"
  ON public.courses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admin gerencia courses"
  ON public.courses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin edita courses"
  ON public.courses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin exclui courses"
  ON public.courses FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_courses_area  ON public.courses(area);
CREATE INDEX idx_courses_ordem ON public.courses(ordem);

-- 3. MODULES
CREATE TABLE public.modules (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  titulo    text NOT NULL,
  ordem     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules visíveis para usuários autenticados"
  ON public.modules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admin gerencia modules"
  ON public.modules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin edita modules"
  ON public.modules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin exclui modules"
  ON public.modules FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_modules_course_id ON public.modules(course_id);
CREATE INDEX idx_modules_ordem     ON public.modules(ordem);

-- 4. LESSONS
CREATE TABLE public.lessons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  video_url       text,
  duracao_segundos integer,
  ordem           integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons visíveis para usuários autenticados"
  ON public.lessons FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admin gerencia lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin edita lessons"
  ON public.lessons FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin exclui lessons"
  ON public.lessons FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX idx_lessons_ordem     ON public.lessons(ordem);

-- 5. PROGRESS
CREATE TABLE public.progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  concluido       boolean NOT NULL DEFAULT false,
  tempo_assistido integer NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seu próprio progresso"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere apenas seu próprio progresso"
  ON public.progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza apenas seu próprio progresso"
  ON public.progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_progress_user_id   ON public.progress(user_id);
CREATE INDEX idx_progress_lesson_id ON public.progress(lesson_id);
CREATE INDEX idx_progress_concluido ON public.progress(concluido);

-- 6. QUESTIONS
CREATE TABLE public.questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia         text NOT NULL,
  sub_materia     text,
  banca           text,
  ano             integer,
  nivel           text CHECK (nivel IN ('facil', 'medio', 'dificil')),
  area_concurso   text,
  enunciado       text NOT NULL,
  texto_referencia text,
  mostrar_texto   boolean NOT NULL DEFAULT true,
  alternativas    jsonb NOT NULL DEFAULT '[]'::jsonb,
  resposta_correta integer NOT NULL,
  explicacao      text,
  referencias     text,
  figuras         jsonb NOT NULL DEFAULT '[]'::jsonb,
  incidencia_pct  numeric(5,2) DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions visíveis para todos autenticados"
  ON public.questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admin gerencia questions"
  ON public.questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin edita questions"
  ON public.questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin exclui questions"
  ON public.questions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_questions_materia ON public.questions(materia);
CREATE INDEX idx_questions_banca   ON public.questions(banca);
CREATE INDEX idx_questions_ano     ON public.questions(ano);
CREATE INDEX idx_questions_nivel   ON public.questions(nivel);
CREATE INDEX idx_questions_area_concurso ON public.questions(area_concurso);

-- 7. USER_ANSWERS
CREATE TABLE public.user_answers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id    uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  resposta_dada  integer NOT NULL,
  correto        boolean NOT NULL,
  tempo_segundos integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas próprias respostas"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere apenas suas próprias respostas"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza apenas suas próprias respostas"
  ON public.user_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_answers_user_id     ON public.user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON public.user_answers(question_id);
CREATE INDEX idx_user_answers_correto     ON public.user_answers(correto);
CREATE INDEX idx_user_answers_created_at  ON public.user_answers(created_at);

-- 8. MATERIALS
CREATE TABLE public.materials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  materia       text,
  sub_materia   text,
  banca         text,
  professor     text,
  paginas       integer,
  pdf_url       text,
  incidencia_pct numeric(5,2) DEFAULT 0,
  ia_recommend  boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials visíveis para todos autenticados"
  ON public.materials FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admin gerencia materials"
  ON public.materials FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin edita materials"
  ON public.materials FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Apenas admin exclui materials"
  ON public.materials FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_materials_materia ON public.materials(materia);
CREATE INDEX idx_materials_banca   ON public.materials(banca);

-- 9. STUDY_PLANS
CREATE TABLE public.study_plans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semana_inicio date NOT NULL,
  tarefas      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seus próprios planos"
  ON public.study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere apenas seus próprios planos"
  ON public.study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza apenas seus próprios planos"
  ON public.study_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário exclui apenas seus próprios planos"
  ON public.study_plans FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_study_plans_user_id       ON public.study_plans(user_id);
CREATE INDEX idx_study_plans_semana_inicio ON public.study_plans(semana_inicio);

-- 10. SIMULATIONS
CREATE TABLE public.simulations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questoes     jsonb NOT NULL DEFAULT '[]'::jsonb,
  pontuacao    numeric(5,2) NOT NULL DEFAULT 0,
  tempo_total  integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas próprias simulações"
  ON public.simulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere apenas suas próprias simulações"
  ON public.simulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza apenas suas próprias simulações"
  ON public.simulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário exclui apenas suas próprias simulações"
  ON public.simulations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX idx_simulations_created_at ON public.simulations(created_at);

-- ============================================================
-- FUNÇÃO: Calcular % de progresso de um curso por user_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.curso_progresso(p_user_id uuid, p_course_id uuid)
RETURNS numeric AS $$
DECLARE
  total_lessons  integer;
  completed_lessons integer;
  progresso_pct  numeric;
BEGIN
  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = p_course_id;

  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO completed_lessons
  FROM public.progress pr
  JOIN public.lessons l ON l.id = pr.lesson_id
  JOIN public.modules m ON m.id = l.module_id
  WHERE pr.user_id = p_user_id
    AND m.course_id = p_course_id
    AND pr.concluido = true;

  progresso_pct := ROUND((completed_lessons::numeric / total_lessons) * 100, 1);
  RETURN progresso_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: Inserir perfil automaticamente ao criar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE: bucket de materiais (PDFs)
-- Privado — leitura só via signed URL para usuários autenticados.
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais', 'materiais', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin faz upload de materiais"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'materiais'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin atualiza materiais no storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'materiais'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin exclui materiais do storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'materiais'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Autenticados leem materiais do storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materiais' AND auth.role() = 'authenticated');

-- Bucket público para figuras de questões (conteúdo educacional)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('questoes-figuras', 'questoes-figuras', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin faz upload de figuras de questoes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'questoes-figuras'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin exclui figuras de questoes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'questoes-figuras'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 14. GRUPOS E MEMBROS (comunidade)
-- ============================================================
CREATE TABLE public.grupos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL CHECK (char_length(nome) >= 3),
  descricao  text NOT NULL DEFAULT '',
  materia    text NOT NULL,
  criador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.membros (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id   uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grupo_id, user_id)
);

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem grupos"
  ON public.grupos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuário cria grupo"
  ON public.grupos FOR INSERT
  WITH CHECK (auth.uid() = criador_id);

CREATE POLICY "Admin edita grupos"
  ON public.grupos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin exclui grupos"
  ON public.grupos FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Autenticados leem membros"
  ON public.membros FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuário participa de grupo"
  ON public.membros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário sai de grupo"
  ON public.membros FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_grupos_materia ON public.grupos(materia);
CREATE INDEX idx_membros_grupo  ON public.membros(grupo_id);
CREATE INDEX idx_membros_user   ON public.membros(user_id);

CREATE OR REPLACE FUNCTION public.handle_novo_grupo()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.membros (grupo_id, user_id)
  VALUES (new.id, new.criador_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_grupo_created
  AFTER INSERT ON public.grupos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_novo_grupo();

-- ============================================================
-- 15. SESSÕES DE ESTUDO (cronômetro)
-- ============================================================
CREATE TABLE public.study_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia        text NOT NULL,
  tempo_minutos  integer NOT NULL CHECK (tempo_minutos > 0),
  registrado_em  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas próprias sessões"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere apenas suas próprias sessões"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário exclui apenas suas próprias sessões"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_study_sessions_user          ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_registrado_em ON public.study_sessions(registrado_em);
