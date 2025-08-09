-- Supabase 설정 스크립트
-- 파충류 관리 시스템을 위한 테이블 및 RLS 정책 설정

-- 1. 기본 확장 프로그램 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. reptiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.reptiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255) DEFAULT 'Crested Gecko',
    sex VARCHAR(20) CHECK (sex IN ('수컷', '암컷', '미구분')) DEFAULT '미구분',
    generation VARCHAR(10) DEFAULT 'F1',
    morph TEXT,
    birth_date DATE,
    parent1_name VARCHAR(255),
    parent2_name VARCHAR(255),
    weight_grams DECIMAL(6,2),
    status VARCHAR(20) CHECK (status IN ('활성', '비활성', '판매됨', '사망')) DEFAULT '활성',
    traits JSONB DEFAULT '{}',
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    
    -- 인덱스를 위한 제약조건
    CONSTRAINT unique_owner_name UNIQUE (owner_id, name, deleted)
);

-- 3. babies 테이블 생성 (새끼 관리용)
CREATE TABLE IF NOT EXISTS public.babies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clutch_id VARCHAR(50),
    name VARCHAR(255),
    parent1_id UUID REFERENCES public.reptiles(id),
    parent2_id UUID REFERENCES public.reptiles(id),
    laying_date DATE,
    hatching_date DATE,
    status VARCHAR(20) CHECK (status IN ('알', '부화', '성체승격', '사망')) DEFAULT '알',
    weight_grams DECIMAL(6,2),
    notes TEXT,
    growth_records JSONB DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE
);

-- 4. sync_metadata 테이블 생성 (동기화 메타데이터 관리)
CREATE TABLE IF NOT EXISTS public.sync_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_device UNIQUE (user_id, device_id)
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reptiles_owner_updated ON public.reptiles(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reptiles_owner_deleted ON public.reptiles(owner_id, deleted);
CREATE INDEX IF NOT EXISTS idx_babies_owner_updated ON public.babies(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_babies_owner_deleted ON public.babies(owner_id, deleted);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_user_device ON public.sync_metadata(user_id, device_id);

-- 6. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS update_reptiles_updated_at ON public.reptiles;
CREATE TRIGGER update_reptiles_updated_at
    BEFORE UPDATE ON public.reptiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_babies_updated_at ON public.babies;
CREATE TRIGGER update_babies_updated_at
    BEFORE UPDATE ON public.babies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. RLS (Row Level Security) 정책 설정
ALTER TABLE public.reptiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- 9. RLS 정책 생성

-- reptiles 테이블 정책
CREATE POLICY "Users can view their own reptiles" ON public.reptiles
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own reptiles" ON public.reptiles
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own reptiles" ON public.reptiles
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own reptiles" ON public.reptiles
    FOR DELETE USING (auth.uid() = owner_id);

-- babies 테이블 정책
CREATE POLICY "Users can view their own babies" ON public.babies
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own babies" ON public.babies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own babies" ON public.babies
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own babies" ON public.babies
    FOR DELETE USING (auth.uid() = owner_id);

-- sync_metadata 테이블 정책
CREATE POLICY "Users can manage their own sync metadata" ON public.sync_metadata
    FOR ALL USING (auth.uid() = user_id);

-- 10. 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.reptiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.babies;

-- 11. 동기화 도우미 함수들

-- 마지막 동기화 이후 변경된 reptiles 조회
CREATE OR REPLACE FUNCTION get_reptiles_changes_since(
    p_user_id UUID,
    p_last_sync_at TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    name VARCHAR,
    species VARCHAR,
    sex VARCHAR,
    generation VARCHAR,
    morph TEXT,
    birth_date DATE,
    parent1_name VARCHAR,
    parent2_name VARCHAR,
    weight_grams DECIMAL,
    status VARCHAR,
    traits JSONB,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted BOOLEAN
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        id, owner_id, name, species, sex, generation, morph,
        birth_date, parent1_name, parent2_name, weight_grams,
        status, traits, notes, image_url, created_at, updated_at, deleted
    FROM public.reptiles
    WHERE owner_id = p_user_id 
    AND updated_at > p_last_sync_at
    ORDER BY updated_at DESC;
$$;

-- 마지막 동기화 이후 변경된 babies 조회
CREATE OR REPLACE FUNCTION get_babies_changes_since(
    p_user_id UUID,
    p_last_sync_at TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    owner_id UUID,
    clutch_id VARCHAR,
    name VARCHAR,
    parent1_id UUID,
    parent2_id UUID,
    laying_date DATE,
    hatching_date DATE,
    status VARCHAR,
    weight_grams DECIMAL,
    notes TEXT,
    growth_records JSONB,
    image_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted BOOLEAN
) LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        id, owner_id, clutch_id, name, parent1_id, parent2_id,
        laying_date, hatching_date, status, weight_grams, notes,
        growth_records, image_url, created_at, updated_at, deleted
    FROM public.babies
    WHERE owner_id = p_user_id 
    AND updated_at > p_last_sync_at
    ORDER BY updated_at DESC;
$$;

-- 동기화 메타데이터 업데이트 함수
CREATE OR REPLACE FUNCTION update_sync_metadata(
    p_user_id UUID,
    p_device_id VARCHAR,
    p_sync_version INTEGER DEFAULT 1
)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
    INSERT INTO public.sync_metadata (user_id, device_id, last_sync_at, sync_version)
    VALUES (p_user_id, p_device_id, NOW(), p_sync_version)
    ON CONFLICT (user_id, device_id) 
    DO UPDATE SET 
        last_sync_at = NOW(),
        sync_version = sync_metadata.sync_version + 1;
$$;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ Supabase 파충류 관리 시스템 설정 완료!';
    RAISE NOTICE '📋 테이블: reptiles, babies, sync_metadata';
    RAISE NOTICE '🔒 RLS 정책: 사용자별 데이터 접근 제한';
    RAISE NOTICE '⚡ 실시간 구독: 활성화됨';
    RAISE NOTICE '🔄 동기화 함수: get_*_changes_since, update_sync_metadata';
END $$;