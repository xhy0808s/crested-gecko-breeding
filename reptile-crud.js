// 파충류 CRUD 작업 (오프라인 지원)
// 모든 작업은 로컬 캐시 우선, 온라인 시 서버 동기화

import { supabase } from './supabase-config.js'
import { indexedDBCache } from './indexeddb-cache.js'
import { syncManager } from './sync-manager.js'
import { v4 as uuidv4 } from 'uuid'

class ReptileCRUD {
  constructor() {
    this.userId = null
  }

  async init(userId) {
    this.userId = userId
    await indexedDBCache.init()
  }

  // CREATE - 새 파충류 생성
  async createReptile(reptileData) {
    try {
      // 필수 필드 검증
      if (!reptileData.name) {
        throw new Error('파충류 이름은 필수입니다')
      }

      // 새 파충류 객체 생성
      const newReptile = {
        id: uuidv4(),
        owner_id: this.userId,
        name: reptileData.name,
        species: reptileData.species || 'Crested Gecko',
        sex: reptileData.sex || '미구분',
        generation: reptileData.generation || 'F1',
        morph: reptileData.morph || '',
        birth_date: reptileData.birth_date || null,
        parent1_name: reptileData.parent1_name || '',
        parent2_name: reptileData.parent2_name || '',
        weight_grams: reptileData.weight_grams || null,
        status: reptileData.status || '활성',
        traits: reptileData.traits || {},
        notes: reptileData.notes || '',
        image_url: reptileData.image_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted: false,
      }

      // 이름 중복 검사 (로컬)
      const existingReptiles = await indexedDBCache.getAllReptiles(this.userId)
      const isDuplicate = existingReptiles.some(r => 
        r.name.toLowerCase() === newReptile.name.toLowerCase() && !r.deleted
      )

      if (isDuplicate) {
        throw new Error(`이미 "${newReptile.name}" 이름의 파충류가 존재합니다`)
      }

      // 로컬 캐시에 저장
      await indexedDBCache.upsertReptile(newReptile)

      // 변경사항을 동기화 큐에 추가
      await syncManager.queueChange('reptiles', 'create', newReptile.id, newReptile)

      console.log('✅ 파충류 생성 완료:', newReptile.name)
      return newReptile

    } catch (error) {
      console.error('❌ 파충류 생성 실패:', error)
      throw error
    }
  }

  // READ - 파충류 목록 조회
  async getReptiles(options = {}) {
    try {
      const {
        includeDeleted = false,
        sortBy = 'updated_at',
        sortOrder = 'desc',
        filterBy = {},
      } = options

      let reptiles = await indexedDBCache.getAllReptiles(this.userId, includeDeleted)

      // 필터링
      if (Object.keys(filterBy).length > 0) {
        reptiles = reptiles.filter(reptile => {
          return Object.entries(filterBy).every(([key, value]) => {
            if (Array.isArray(value)) {
              return value.includes(reptile[key])
            }
            return reptile[key] === value
          })
        })
      }

      // 정렬
      reptiles.sort((a, b) => {
        const aValue = a[sortBy]
        const bValue = b[sortBy]
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })

      return reptiles

    } catch (error) {
      console.error('❌ 파충류 목록 조회 실패:', error)
      throw error
    }
  }

  // READ - 단일 파충류 조회
  async getReptile(reptileId) {
    try {
      const reptile = await indexedDBCache.getReptile(reptileId)
      
      if (!reptile) {
        throw new Error(`파충류를 찾을 수 없습니다: ${reptileId}`)
      }

      if (reptile.owner_id !== this.userId) {
        throw new Error('접근 권한이 없습니다')
      }

      return reptile

    } catch (error) {
      console.error('❌ 파충류 조회 실패:', error)
      throw error
    }
  }

  // UPDATE - 파충류 정보 수정
  async updateReptile(reptileId, updateData) {
    try {
      // 기존 파충류 조회
      const existingReptile = await this.getReptile(reptileId)

      // 업데이트할 필드만 병합
      const updatedReptile = {
        ...existingReptile,
        ...updateData,
        id: reptileId, // ID는 변경 불가
        owner_id: this.userId, // 소유자도 변경 불가
        updated_at: new Date().toISOString(),
      }

      // 이름 변경 시 중복 검사
      if (updateData.name && updateData.name !== existingReptile.name) {
        const existingReptiles = await indexedDBCache.getAllReptiles(this.userId)
        const isDuplicate = existingReptiles.some(r => 
          r.name.toLowerCase() === updateData.name.toLowerCase() && 
          r.id !== reptileId && !r.deleted
        )

        if (isDuplicate) {
          throw new Error(`이미 "${updateData.name}" 이름의 파충류가 존재합니다`)
        }
      }

      // 로컬 캐시 업데이트
      await indexedDBCache.upsertReptile(updatedReptile)

      // 변경사항을 동기화 큐에 추가
      await syncManager.queueChange('reptiles', 'update', reptileId, updatedReptile)

      console.log('✅ 파충류 수정 완료:', updatedReptile.name)
      return updatedReptile

    } catch (error) {
      console.error('❌ 파충류 수정 실패:', error)
      throw error
    }
  }

  // SOFT DELETE - 파충류 소프트 삭제
  async softDeleteReptile(reptileId) {
    try {
      const existingReptile = await this.getReptile(reptileId)

      if (existingReptile.deleted) {
        console.log('⚠️ 이미 삭제된 파충류입니다:', existingReptile.name)
        return existingReptile
      }

      // 소프트 삭제 실행
      const deletedReptile = {
        ...existingReptile,
        deleted: true,
        updated_at: new Date().toISOString(),
      }

      // 로컬 캐시 업데이트
      await indexedDBCache.upsertReptile(deletedReptile)

      // 변경사항을 동기화 큐에 추가
      await syncManager.queueChange('reptiles', 'delete', reptileId, deletedReptile)

      console.log('✅ 파충류 삭제 완료:', deletedReptile.name)
      return deletedReptile

    } catch (error) {
      console.error('❌ 파충류 삭제 실패:', error)
      throw error
    }
  }

  // RESTORE - 삭제된 파충류 복구
  async restoreReptile(reptileId) {
    try {
      const existingReptile = await indexedDBCache.getReptile(reptileId)

      if (!existingReptile) {
        throw new Error(`파충류를 찾을 수 없습니다: ${reptileId}`)
      }

      if (!existingReptile.deleted) {
        console.log('⚠️ 삭제되지 않은 파충류입니다:', existingReptile.name)
        return existingReptile
      }

      // 복구 실행
      const restoredReptile = {
        ...existingReptile,
        deleted: false,
        updated_at: new Date().toISOString(),
      }

      // 로컬 캐시 업데이트
      await indexedDBCache.upsertReptile(restoredReptile)

      // 변경사항을 동기화 큐에 추가
      await syncManager.queueChange('reptiles', 'update', reptileId, restoredReptile)

      console.log('✅ 파충류 복구 완료:', restoredReptile.name)
      return restoredReptile

    } catch (error) {
      console.error('❌ 파충류 복구 실패:', error)
      throw error
    }
  }

  // 대량 작업
  async batchCreateReptiles(reptilesData) {
    const results = []
    const errors = []

    for (const reptileData of reptilesData) {
      try {
        const reptile = await this.createReptile(reptileData)
        results.push(reptile)
      } catch (error) {
        errors.push({ reptileData, error: error.message })
      }
    }

    console.log(`📦 대량 생성 완료: 성공 ${results.length}개, 실패 ${errors.length}개`)
    
    return { results, errors }
  }

  // 통계 조회
  async getStatistics() {
    try {
      const reptiles = await this.getReptiles()
      
      const stats = {
        total: reptiles.length,
        byStatus: {},
        byGender: {},
        byGeneration: {},
        bySpecies: {},
        recentActivity: reptiles.slice(0, 5).map(r => ({
          id: r.id,
          name: r.name,
          action: r.created_at === r.updated_at ? '생성됨' : '수정됨',
          timestamp: r.updated_at
        }))
      }

      // 상태별 통계
      reptiles.forEach(reptile => {
        stats.byStatus[reptile.status] = (stats.byStatus[reptile.status] || 0) + 1
        stats.byGender[reptile.sex] = (stats.byGender[reptile.sex] || 0) + 1
        stats.byGeneration[reptile.generation] = (stats.byGeneration[reptile.generation] || 0) + 1
        stats.bySpecies[reptile.species] = (stats.bySpecies[reptile.species] || 0) + 1
      })

      return stats

    } catch (error) {
      console.error('❌ 통계 조회 실패:', error)
      throw error
    }
  }

  // 검색
  async searchReptiles(query, options = {}) {
    try {
      const reptiles = await this.getReptiles(options)
      
      if (!query || query.trim() === '') {
        return reptiles
      }

      const searchTerm = query.toLowerCase().trim()
      
      return reptiles.filter(reptile => {
        return (
          reptile.name.toLowerCase().includes(searchTerm) ||
          reptile.species.toLowerCase().includes(searchTerm) ||
          reptile.morph.toLowerCase().includes(searchTerm) ||
          reptile.notes.toLowerCase().includes(searchTerm) ||
          reptile.parent1_name.toLowerCase().includes(searchTerm) ||
          reptile.parent2_name.toLowerCase().includes(searchTerm)
        )
      })

    } catch (error) {
      console.error('❌ 파충류 검색 실패:', error)
      throw error
    }
  }
}

// Baby CRUD (유사한 구조)
class BabyCRUD {
  constructor() {
    this.userId = null
  }

  async init(userId) {
    this.userId = userId
    await indexedDBCache.init()
  }

  async createBaby(babyData) {
    try {
      const newBaby = {
        id: uuidv4(),
        owner_id: this.userId,
        clutch_id: babyData.clutch_id || `clutch_${Date.now()}`,
        name: babyData.name || '',
        parent1_id: babyData.parent1_id || null,
        parent2_id: babyData.parent2_id || null,
        laying_date: babyData.laying_date || null,
        hatching_date: babyData.hatching_date || null,
        status: babyData.status || '알',
        weight_grams: babyData.weight_grams || null,
        notes: babyData.notes || '',
        growth_records: babyData.growth_records || {},
        image_url: babyData.image_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted: false,
      }

      await indexedDBCache.upsertBaby(newBaby)
      await syncManager.queueChange('babies', 'create', newBaby.id, newBaby)

      console.log('✅ 베이비 생성 완료:', newBaby.clutch_id)
      return newBaby

    } catch (error) {
      console.error('❌ 베이비 생성 실패:', error)
      throw error
    }
  }

  async getBabies(options = {}) {
    return indexedDBCache.getAllBabies(this.userId, options.includeDeleted)
  }

  async updateBaby(babyId, updateData) {
    try {
      const existingBaby = await indexedDBCache.getBaby ? 
        await indexedDBCache.getBaby(babyId) :
        (await indexedDBCache.getAllBabies(this.userId, true)).find(b => b.id === babyId)

      if (!existingBaby) {
        throw new Error(`베이비를 찾을 수 없습니다: ${babyId}`)
      }

      const updatedBaby = {
        ...existingBaby,
        ...updateData,
        id: babyId,
        owner_id: this.userId,
        updated_at: new Date().toISOString(),
      }

      await indexedDBCache.upsertBaby(updatedBaby)
      await syncManager.queueChange('babies', 'update', babyId, updatedBaby)

      console.log('✅ 베이비 수정 완료:', updatedBaby.clutch_id)
      return updatedBaby

    } catch (error) {
      console.error('❌ 베이비 수정 실패:', error)
      throw error
    }
  }

  // 성체로 승격
  async promoteToAdult(babyId, adultData = {}) {
    try {
      const baby = (await indexedDBCache.getAllBabies(this.userId, true)).find(b => b.id === babyId)
      
      if (!baby) {
        throw new Error(`베이비를 찾을 수 없습니다: ${babyId}`)
      }

      // 새 성체 생성
      const reptileCRUD = new ReptileCRUD()
      await reptileCRUD.init(this.userId)

      const newReptile = await reptileCRUD.createReptile({
        name: adultData.name || baby.name || `${baby.clutch_id}_성체`,
        sex: adultData.sex || '미구분',
        birth_date: baby.hatching_date,
        notes: `${baby.clutch_id}에서 승격됨`,
        ...adultData
      })

      // 베이비 상태 업데이트
      await this.updateBaby(babyId, {
        status: '성체승격',
        promoted_reptile_id: newReptile.id
      })

      console.log('✅ 성체 승격 완료:', baby.clutch_id, '->', newReptile.name)
      return { baby, reptile: newReptile }

    } catch (error) {
      console.error('❌ 성체 승격 실패:', error)
      throw error
    }
  }
}

// 전역 인스턴스
export const reptileCRUD = new ReptileCRUD()
export const babyCRUD = new BabyCRUD()

// 편의 함수들
export async function initCRUD(userId) {
  await reptileCRUD.init(userId)
  await babyCRUD.init(userId)
}

export async function createReptile(reptileData) {
  return reptileCRUD.createReptile(reptileData)
}

export async function updateReptile(reptileId, updateData) {
  return reptileCRUD.updateReptile(reptileId, updateData)
}

export async function softDeleteReptile(reptileId) {
  return reptileCRUD.softDeleteReptile(reptileId)
}

export async function getReptiles(options) {
  return reptileCRUD.getReptiles(options)
}

export async function getReptileStats() {
  return reptileCRUD.getStatistics()
}

export default { reptileCRUD, babyCRUD }