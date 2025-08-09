// Supabase Realtime을 이용한 실시간 동기화
// 다른 기기에서 변경 시 UI 즉시 갱신

import { supabase } from './supabase-config.js'
import { indexedDBCache } from './indexeddb-cache.js'
import { syncManager } from './sync-manager.js'

class RealtimeSync {
  constructor() {
    this.subscriptions = new Map()
    this.isSubscribed = false
    this.userId = null
    this.changeHandlers = new Set()
  }

  // 실시간 구독 시작
  async startRealtimeSync(userId) {
    if (this.isSubscribed) {
      console.log('⚡ 이미 실시간 동기화 중입니다')
      return
    }

    this.userId = userId

    try {
      // Reptiles 테이블 구독
      await this.subscribeToReptiles()
      
      // Babies 테이블 구독
      await this.subscribeToBabies()
      
      this.isSubscribed = true
      console.log('⚡ 실시간 동기화 시작됨')
      
    } catch (error) {
      console.error('❌ 실시간 구독 실패:', error)
      throw error
    }
  }

  // Reptiles 테이블 실시간 구독
  async subscribeToReptiles() {
    const subscription = supabase
      .channel('reptiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'reptiles',
          filter: `owner_id=eq.${this.userId}` // 본인 데이터만
        },
        async (payload) => {
          console.log('⚡ Reptiles 실시간 변경 감지:', payload)
          await this.handleReptileChange(payload)
        }
      )
      .subscribe((status) => {
        console.log('⚡ Reptiles 구독 상태:', status)
      })

    this.subscriptions.set('reptiles', subscription)
  }

  // Babies 테이블 실시간 구독
  async subscribeToBabies() {
    const subscription = supabase
      .channel('babies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'babies',
          filter: `owner_id=eq.${this.userId}`
        },
        async (payload) => {
          console.log('⚡ Babies 실시간 변경 감지:', payload)
          await this.handleBabyChange(payload)
        }
      )
      .subscribe((status) => {
        console.log('⚡ Babies 구독 상태:', status)
      })

    this.subscriptions.set('babies', subscription)
  }

  // Reptile 변경사항 처리
  async handleReptileChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    try {
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
          if (newRecord) {
            // 로컬 캐시 업데이트
            await indexedDBCache.upsertReptile(newRecord)
            
            // UI 변경 이벤트 발생
            this.emitChangeEvent('reptile', eventType.toLowerCase(), newRecord)
          }
          break

        case 'DELETE':
          if (oldRecord) {
            // 소프트 삭제 처리
            const deletedRecord = { ...oldRecord, deleted: true }
            await indexedDBCache.upsertReptile(deletedRecord)
            
            this.emitChangeEvent('reptile', 'delete', deletedRecord)
          }
          break
      }

      console.log(`✅ Reptile ${eventType} 처리 완료:`, newRecord?.id || oldRecord?.id)
      
    } catch (error) {
      console.error('❌ Reptile 실시간 변경 처리 실패:', error)
    }
  }

  // Baby 변경사항 처리
  async handleBabyChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    try {
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
          if (newRecord) {
            await indexedDBCache.upsertBaby(newRecord)
            this.emitChangeEvent('baby', eventType.toLowerCase(), newRecord)
          }
          break

        case 'DELETE':
          if (oldRecord) {
            const deletedRecord = { ...oldRecord, deleted: true }
            await indexedDBCache.upsertBaby(deletedRecord)
            this.emitChangeEvent('baby', 'delete', deletedRecord)
          }
          break
      }

      console.log(`✅ Baby ${eventType} 처리 완료:`, newRecord?.id || oldRecord?.id)
      
    } catch (error) {
      console.error('❌ Baby 실시간 변경 처리 실패:', error)
    }
  }

  // 변경 이벤트 발생 (UI 업데이트용)
  emitChangeEvent(type, action, record) {
    const event = {
      type,      // 'reptile' or 'baby'
      action,    // 'insert', 'update', 'delete'
      record,    // 변경된 레코드
      timestamp: new Date().toISOString()
    }

    this.changeHandlers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('❌ 변경 이벤트 핸들러 오류:', error)
      }
    })

    // 커스텀 이벤트로도 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reptile_data_changed', {
        detail: event
      }))
    }
  }

  // 변경 이벤트 핸들러 등록
  onChange(handler) {
    this.changeHandlers.add(handler)
    
    // 해제 함수 반환
    return () => {
      this.changeHandlers.delete(handler)
    }
  }

  // 실시간 구독 중지
  async stopRealtimeSync() {
    try {
      // 모든 구독 해제
      for (const [name, subscription] of this.subscriptions) {
        await supabase.removeChannel(subscription)
        console.log(`⚡ ${name} 구독 해제됨`)
      }

      this.subscriptions.clear()
      this.isSubscribed = false
      this.changeHandlers.clear()
      
      console.log('⚡ 실시간 동기화 중지됨')
      
    } catch (error) {
      console.error('❌ 실시간 구독 해제 실패:', error)
    }
  }

  // 구독 상태 확인
  getSubscriptionStatus() {
    return {
      isSubscribed: this.isSubscribed,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
      handlerCount: this.changeHandlers.size
    }
  }
}

// UI 업데이트 헬퍼 클래스
class UIUpdater {
  constructor() {
    this.updateCallbacks = new Map()
  }

  // UI 업데이트 콜백 등록
  registerUpdateCallback(elementId, callback) {
    this.updateCallbacks.set(elementId, callback)
  }

  // 자동 UI 업데이트
  async updateReptileList() {
    const reptiles = await indexedDBCache.getAllReptiles()
    
    // 전체 목록 업데이트
    const listCallback = this.updateCallbacks.get('reptile-list')
    if (listCallback) {
      listCallback(reptiles)
    }

    // 통계 업데이트
    const statsCallback = this.updateCallbacks.get('reptile-stats')
    if (statsCallback) {
      const stats = await this.calculateStats(reptiles)
      statsCallback(stats)
    }

    // 커스텀 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ui_update_reptiles', {
        detail: { reptiles }
      }))
    }
  }

  async updateBabyList() {
    const babies = await indexedDBCache.getAllBabies()
    
    const listCallback = this.updateCallbacks.get('baby-list')
    if (listCallback) {
      listCallback(babies)
    }

    const statsCallback = this.updateCallbacks.get('baby-stats')
    if (statsCallback) {
      const stats = await this.calculateBabyStats(babies)
      statsCallback(stats)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ui_update_babies', {
        detail: { babies }
      }))
    }
  }

  // 통계 계산
  async calculateStats(reptiles) {
    const active = reptiles.filter(r => r.status === '활성')
    const byGender = {
      '수컷': reptiles.filter(r => r.sex === '수컷').length,
      '암컷': reptiles.filter(r => r.sex === '암컷').length,
      '미구분': reptiles.filter(r => r.sex === '미구분').length,
    }

    return {
      total: reptiles.length,
      active: active.length,
      byGender,
      lastUpdated: new Date().toISOString()
    }
  }

  async calculateBabyStats(babies) {
    const byStatus = {}
    babies.forEach(baby => {
      byStatus[baby.status] = (byStatus[baby.status] || 0) + 1
    })

    return {
      total: babies.length,
      byStatus,
      lastUpdated: new Date().toISOString()
    }
  }
}

// 전역 인스턴스
export const realtimeSync = new RealtimeSync()
export const uiUpdater = new UIUpdater()

// 통합 실시간 동기화 초기화
export async function initRealtimeSync(userId) {
  try {
    // 실시간 구독 시작
    await realtimeSync.startRealtimeSync(userId)
    
    // 변경 이벤트에 UI 업데이트 연결
    realtimeSync.onChange(async (event) => {
      console.log('🔄 UI 업데이트 트리거:', event)
      
      if (event.type === 'reptile') {
        await uiUpdater.updateReptileList()
      } else if (event.type === 'baby') {
        await uiUpdater.updateBabyList()
      }
    })
    
    console.log('⚡ 통합 실시간 동기화 초기화 완료')
    return true
    
  } catch (error) {
    console.error('❌ 실시간 동기화 초기화 실패:', error)
    throw error
  }
}

// 편의 함수들
export async function startRealtime(userId) {
  return realtimeSync.startRealtimeSync(userId)
}

export async function stopRealtime() {
  return realtimeSync.stopRealtimeSync()
}

export function onDataChange(handler) {
  return realtimeSync.onChange(handler)
}

export function registerUICallback(elementId, callback) {
  return uiUpdater.registerUpdateCallback(elementId, callback)
}

export default { realtimeSync, uiUpdater }