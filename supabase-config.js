// Supabase 설정 및 초기화
// 파충류 관리 시스템용 Supabase 클라이언트 설정

import { createClient } from '@supabase/supabase-js'

// Supabase 설정 (환경 변수 또는 직접 설정)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // 실시간 이벤트 제한
    },
  },
})

// 타입 정의 (TypeScript 사용 시)
export interface Reptile {
  id: string
  owner_id: string
  name: string
  species: string
  sex: '수컷' | '암컷' | '미구분'
  generation: string
  morph?: string
  birth_date?: string
  parent1_name?: string
  parent2_name?: string
  weight_grams?: number
  status: '활성' | '비활성' | '판매됨' | '사망'
  traits: Record<string, any>
  notes?: string
  image_url?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface Baby {
  id: string
  owner_id: string
  clutch_id?: string
  name?: string
  parent1_id?: string
  parent2_id?: string
  laying_date?: string
  hatching_date?: string
  status: '알' | '부화' | '성체승격' | '사망'
  weight_grams?: number
  notes?: string
  growth_records: Record<string, any>
  image_url?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface SyncMetadata {
  id: string
  user_id: string
  device_id: string
  last_sync_at: string
  sync_version: number
  created_at: string
}

// 인증 헬퍼 함수들
export class AuthService {
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }
  
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }
  
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
  
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 디바이스 ID 생성 및 관리
export class DeviceManager {
  private static readonly DEVICE_ID_KEY = 'reptile_device_id'
  
  static getDeviceId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId)
    }
    
    return deviceId
  }
  
  static async registerDevice(userId: string) {
    const deviceId = this.getDeviceId()
    
    const { error } = await supabase
      .from('sync_metadata')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        last_sync_at: new Date().toISOString(),
        sync_version: 1,
      })
    
    if (error) throw error
    return deviceId
  }
}

// 초기 설정 함수
export async function initializeSupabase() {
  try {
    // 현재 사용자 확인
    const user = await AuthService.getCurrentUser()
    
    if (user) {
      console.log('✅ 사용자 로그인됨:', user.email)
      
      // 디바이스 등록
      const deviceId = await DeviceManager.registerDevice(user.id)
      console.log('📱 디바이스 등록됨:', deviceId)
      
      return { user, deviceId }
    } else {
      console.log('❌ 로그인 필요')
      return { user: null, deviceId: null }
    }
  } catch (error) {
    console.error('❌ Supabase 초기화 실패:', error)
    throw error
  }
}

// 연결 상태 확인
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('reptiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) throw error
    
    console.log('✅ Supabase 연결 성공')
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error)
    return false
  }
}

export default supabase