// 양방향 증분 동기화 매니저
// last_sync_at 기반으로 서버 변경분만 pull, 로컬 변경분만 push

import { supabase, AuthService, DeviceManager } from './supabase-config.js'
import { indexedDBCache } from './indexeddb-cache.js'

class SyncManager {
  constructor() {
    this.isSyncing = false
    this.syncListeners = new Set()
    this.errorHandlers = new Set()
    this.userId = null
    this.deviceId = null
    this.isOnline = navigator.onLine
    
    // 온라인/오프라인 이벤트 리스너
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 온라인 상태 - 자동 동기화 시작')
      this.syncNow()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📴 오프라인 상태 - 로컬 캐시 모드')
    })
  }

  // 초기화
  async init() {
    try {
      // IndexedDB 초기화
      await indexedDBCache.init()
      
      // 사용자 인증 확인
      const user = await AuthService.getCurrentUser()
      if (!user) {
        throw new Error('사용자 인증이 필요합니다')
      }
      
      this.userId = user.id
      this.deviceId = DeviceManager.getDeviceId()
      
      // 디바이스 등록
      await DeviceManager.registerDevice(this.userId)
      
      console.log('✅ SyncManager 초기화 완료:', { userId: this.userId, deviceId: this.deviceId })
      
      // 초기 동기화 실행
      if (this.isOnline) {
        await this.syncNow()
      }
      
      return true
    } catch (error) {
      console.error('❌ SyncManager 초기화 실패:', error)
      throw error
    }
  }

  // 이벤트 리스너 등록
  onSyncStart(callback) { this.syncListeners.add(callback) }
  onSyncComplete(callback) { this.syncListeners.add(callback) }
  onSyncError(callback) { this.errorHandlers.add(callback) }

  // 동기화 상태 이벤트 발생
  emitSyncEvent(eventType, data = {}) {
    this.syncListeners.forEach(callback => {
      try {
        callback(eventType, data)
      } catch (error) {
        console.error('동기화 이벤트 콜백 오류:', error)
      }
    })
  }

  // 메인 동기화 함수
  async syncNow() {
    if (this.isSyncing) {
      console.log('⏳ 이미 동기화 중입니다')
      return
    }

    if (!this.isOnline) {
      console.log('📴 오프라인 상태 - 동기화 건너뛰기')
      return
    }

    try {
      this.isSyncing = true
      this.emitSyncEvent('sync_start')

      console.log('🔄 동기화 시작...')
      
      // 1. 로컬 변경사항을 서버로 푸시
      await this.pushLocalChanges()
      
      // 2. 서버 변경사항을 로컬로 풀
      await this.pullServerChanges()
      
      // 3. 마지막 동기화 시간 업데이트
      await indexedDBCache.setLastSyncTime()
      
      // 4. 동기화 메타데이터 업데이트
      await this.updateSyncMetadata()
      
      console.log('✅ 동기화 완료')
      this.emitSyncEvent('sync_complete')
      
    } catch (error) {
      console.error('❌ 동기화 실패:', error)
      this.emitSyncEvent('sync_error', { error })
      throw error
    } finally {
      this.isSyncing = false
    }
  }

  // 로컬 변경사항을 서버로 푸시
  async pushLocalChanges() {
    const pendingChanges = await indexedDBCache.getPendingChanges()
    
    if (pendingChanges.length === 0) {
      console.log('📤 푸시할 변경사항 없음')
      return
    }

    console.log(`📤 ${pendingChanges.length}개 변경사항 푸시 중...`)
    
    for (const change of pendingChanges) {
      try {
        await this.processSingleChange(change)
        await indexedDBCache.removePendingChange(change.id)
        console.log(`✅ 변경사항 푸시 완료: ${change.table_name} ${change.action}`)
      } catch (error) {
        console.error(`❌ 변경사항 푸시 실패:`, change, error)
        
        // 재시도 횟수 증가
        change.retries = (change.retries || 0) + 1
        
        // 3회 초과 시 에러로 마킹
        if (change.retries > 3) {
          console.error(`❌ 변경사항 푸시 포기 (3회 실패):`, change)
          await indexedDBCache.removePendingChange(change.id)
        }
      }
    }
  }

  // 개별 변경사항 처리
  async processSingleChange(change) {
    const { table_name, action, record_id, data } = change

    switch (table_name) {
      case 'reptiles':
        return this.processReptileChange(action, record_id, data)
      case 'babies':
        return this.processBabyChange(action, record_id, data)
      default:
        throw new Error(`지원하지 않는 테이블: ${table_name}`)
    }
  }

  async processReptileChange(action, recordId, data) {
    switch (action) {
      case 'create':
      case 'update':
        const { error: upsertError } = await supabase
          .from('reptiles')
          .upsert(data)
        if (upsertError) throw upsertError
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from('reptiles')
          .update({ deleted: true, updated_at: new Date().toISOString() })
          .eq('id', recordId)
        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`지원하지 않는 액션: ${action}`)
    }
  }

  async processBabyChange(action, recordId, data) {
    switch (action) {
      case 'create':
      case 'update':
        const { error: upsertError } = await supabase
          .from('babies')
          .upsert(data)
        if (upsertError) throw upsertError
        break

      case 'delete':
        const { error: deleteError } = await supabase
          .from('babies')
          .update({ deleted: true, updated_at: new Date().toISOString() })
          .eq('id', recordId)
        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`지원하지 않는 액션: ${action}`)
    }
  }

  // 서버 변경사항을 로컬로 풀
  async pullServerChanges() {
    const lastSyncTime = await indexedDBCache.getLastSyncTime()
    console.log(`📥 ${lastSyncTime.toISOString()} 이후 변경사항 풀 중...`)

    // Reptiles 변경사항 풀
    const { data: reptileChanges, error: reptileError } = await supabase
      .rpc('get_reptiles_changes_since', {
        p_user_id: this.userId,
        p_last_sync_at: lastSyncTime.toISOString()
      })

    if (reptileError) {
      console.error('❌ Reptiles 변경사항 조회 실패:', reptileError)
    } else if (reptileChanges && reptileChanges.length > 0) {
      console.log(`📥 Reptiles ${reptileChanges.length}개 변경사항 적용 중...`)
      await indexedDBCache.batchUpsertReptiles(reptileChanges)
    }

    // Babies 변경사항 풀
    const { data: babyChanges, error: babyError } = await supabase
      .rpc('get_babies_changes_since', {
        p_user_id: this.userId,
        p_last_sync_at: lastSyncTime.toISOString()
      })

    if (babyError) {
      console.error('❌ Babies 변경사항 조회 실패:', babyError)
    } else if (babyChanges && babyChanges.length > 0) {
      console.log(`📥 Babies ${babyChanges.length}개 변경사항 적용 중...`)
      await indexedDBCache.batchUpsertBabies(babyChanges)
    }

    const totalChanges = (reptileChanges?.length || 0) + (babyChanges?.length || 0)
    console.log(`✅ 총 ${totalChanges}개 변경사항 적용 완료`)
  }

  // 동기화 메타데이터 업데이트
  async updateSyncMetadata() {
    try {
      const { error } = await supabase
        .rpc('update_sync_metadata', {
          p_user_id: this.userId,
          p_device_id: this.deviceId
        })

      if (error) {
        console.error('❌ 동기화 메타데이터 업데이트 실패:', error)
      }
    } catch (error) {
      console.error('❌ 동기화 메타데이터 업데이트 오류:', error)
    }
  }

  // 변경사항 큐에 추가 (오프라인 지원)
  async queueChange(tableName, action, recordId, data) {
    await indexedDBCache.queueChange(tableName, action, recordId, data)
    
    // 온라인 상태면 즉시 동기화 시도
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncNow(), 1000) // 1초 후 동기화
    }
  }

  // 충돌 해결 (Last-Write-Wins 정책)
  resolveConflict(localRecord, serverRecord) {
    const localTime = new Date(localRecord.updated_at)
    const serverTime = new Date(serverRecord.updated_at)
    
    // 서버 시간이 더 최신이면 서버 버전 사용
    if (serverTime >= localTime) {
      console.log(`🔄 충돌 해결: 서버 버전 사용 (${serverRecord.id})`)
      return serverRecord
    } else {
      console.log(`🔄 충돌 해결: 로컬 버전 유지 (${localRecord.id})`)
      return localRecord
    }
  }

  // 필드별 병합 예시 (선택적 사용)
  mergeRecordFields(localRecord, serverRecord) {
    const merged = { ...serverRecord } // 기본은 서버 버전
    
    // 특정 필드는 로컬 우선
    const localPriorityFields = ['notes', 'weight_grams']
    
    localPriorityFields.forEach(field => {
      if (localRecord[field] && !serverRecord[field]) {
        merged[field] = localRecord[field]
      }
    })
    
    // 최신 updated_at 사용
    merged.updated_at = new Date(Math.max(
      new Date(localRecord.updated_at),
      new Date(serverRecord.updated_at)
    )).toISOString()
    
    return merged
  }

  // 동기화 상태 조회
  async getSyncStatus() {
    const stats = await indexedDBCache.getStats()
    
    return {
      isSyncing: this.isSyncing,
      isOnline: this.isOnline,
      userId: this.userId,
      deviceId: this.deviceId,
      lastSyncTime: stats.lastSyncTime,
      pendingChanges: stats.pendingChanges,
      localData: {
        reptiles: stats.reptiles,
        babies: stats.babies,
      }
    }
  }

  // 자동 동기화 시작/중지
  startAutoSync(intervalMinutes = 5) {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval)
    }
    
    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        console.log('⏰ 자동 동기화 실행')
        this.syncNow()
      }
    }, intervalMinutes * 60 * 1000)
    
    console.log(`⏰ 자동 동기화 활성화: ${intervalMinutes}분마다`)
  }

  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval)
      this.autoSyncInterval = null
      console.log('⏰ 자동 동기화 비활성화')
    }
  }
}

// 전역 인스턴스
export const syncManager = new SyncManager()

// 편의 함수들
export async function initSync() {
  return syncManager.init()
}

export async function syncNow() {
  return syncManager.syncNow()
}

export async function queueChange(tableName, action, recordId, data) {
  return syncManager.queueChange(tableName, action, recordId, data)
}

export async function getSyncStatus() {
  return syncManager.getSyncStatus()
}

export default syncManager