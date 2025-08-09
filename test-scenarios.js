// 테스트 시나리오 구현
// 요구사항에 명시된 4가지 테스트 시나리오 자동화

import { supabase, AuthService } from './supabase-config.js'
import { syncManager } from './sync-manager.js'
import { reptileCRUD, babyCRUD } from './reptile-crud.js'
import { initRealtimeSync } from './realtime-sync.js'

class TestScenarios {
  constructor() {
    this.testResults = []
    this.currentTest = null
  }

  // 테스트 결과 기록
  logResult(scenarioName, stepName, success, message, data = null) {
    const result = {
      scenario: scenarioName,
      step: stepName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    }
    
    this.testResults.push(result)
    
    const status = success ? '✅' : '❌'
    console.log(`${status} [${scenarioName}] ${stepName}: ${message}`)
    
    if (data) {
      console.log('📊 데이터:', data)
    }
  }

  // 테스트 사용자 생성 및 로그인
  async setupTestUsers() {
    const users = {
      pc: { email: 'pc-test@example.com', password: 'test123456!' },
      mobile: { email: 'mobile-test@example.com', password: 'test123456!' }
    }

    try {
      // 사용자 생성 (이미 존재하면 무시)
      for (const [device, credentials] of Object.entries(users)) {
        try {
          await AuthService.signUp(credentials.email, credentials.password)
          console.log(`✅ ${device} 테스트 사용자 생성 완료`)
        } catch (error) {
          if (error.message.includes('already registered')) {
            console.log(`⚠️ ${device} 테스트 사용자 이미 존재`)
          } else {
            throw error
          }
        }
      }

      return users
    } catch (error) {
      console.error('❌ 테스트 사용자 설정 실패:', error)
      throw error
    }
  }

  // 시나리오 1: PC에서 5마리 생성 → 모바일 로그인 → 자동으로 5마리 표시
  async runScenario1() {
    const scenarioName = 'Scenario 1: PC → Mobile Sync'
    this.currentTest = scenarioName

    try {
      this.logResult(scenarioName, '시작', true, '시나리오 1 테스트 시작')

      // 1-1. PC 사용자로 로그인
      const users = await this.setupTestUsers()
      const { data: pcAuth } = await AuthService.signIn(users.pc.email, users.pc.password)
      this.logResult(scenarioName, 'PC 로그인', !!pcAuth.user, 'PC 사용자 로그인', { userId: pcAuth.user?.id })

      // 1-2. PC에서 동기화 시스템 초기화
      await syncManager.init()
      await reptileCRUD.init(pcAuth.user.id)
      
      this.logResult(scenarioName, 'PC 초기화', true, 'PC 동기화 시스템 초기화 완료')

      // 1-3. PC에서 기존 데이터 정리
      const existingReptiles = await reptileCRUD.getReptiles()
      for (const reptile of existingReptiles) {
        await reptileCRUD.softDeleteReptile(reptile.id)
      }
      
      this.logResult(scenarioName, '데이터 정리', true, `기존 ${existingReptiles.length}개 데이터 정리 완료`)

      // 1-4. PC에서 5마리 생성
      const testReptiles = [
        { name: 'PC테스트1', species: 'Crested Gecko', sex: '수컷', morph: '릴리화이트' },
        { name: 'PC테스트2', species: 'Crested Gecko', sex: '암컷', morph: '달마시안' },
        { name: 'PC테스트3', species: 'Crested Gecko', sex: '미구분', morph: '하버게' },
        { name: 'PC테스트4', species: 'Crested Gecko', sex: '수컷', morph: '파티컬러' },
        { name: 'PC테스트5', species: 'Crested Gecko', sex: '암컷', morph: '바이컬러' },
      ]

      const createdReptiles = []
      for (const reptileData of testReptiles) {
        const reptile = await reptileCRUD.createReptile(reptileData)
        createdReptiles.push(reptile)
      }

      this.logResult(scenarioName, 'PC 데이터 생성', true, `PC에서 ${createdReptiles.length}마리 생성 완료`, 
        { count: createdReptiles.length })

      // 1-5. PC에서 동기화 실행
      await syncManager.syncNow()
      await this.wait(2000) // 2초 대기

      this.logResult(scenarioName, 'PC 동기화', true, 'PC 데이터 서버 동기화 완료')

      // 1-6. PC 로그아웃
      await AuthService.signOut()
      
      // 1-7. 모바일 사용자로 로그인
      const { data: mobileAuth } = await AuthService.signIn(users.pc.email, users.pc.password) // 같은 계정 사용
      this.logResult(scenarioName, '모바일 로그인', !!mobileAuth.user, '모바일 사용자 로그인')

      // 1-8. 모바일에서 동기화 시스템 초기화
      await syncManager.init()
      await reptileCRUD.init(mobileAuth.user.id)
      
      this.logResult(scenarioName, '모바일 초기화', true, '모바일 동기화 시스템 초기화 완료')

      // 1-9. 모바일에서 데이터 확인
      await this.wait(3000) // 동기화 시간 대기
      const mobileReptiles = await reptileCRUD.getReptiles()
      
      const success = mobileReptiles.length === 5
      this.logResult(scenarioName, '모바일 데이터 확인', success, 
        `모바일에서 ${mobileReptiles.length}/5마리 확인`, 
        { expected: 5, actual: mobileReptiles.length, reptiles: mobileReptiles.map(r => r.name) })

      this.logResult(scenarioName, '완료', success, success ? '시나리오 1 성공' : '시나리오 1 실패')
      
      return success

    } catch (error) {
      this.logResult(scenarioName, '오류', false, `시나리오 1 실패: ${error.message}`)
      throw error
    }
  }

  // 시나리오 2: 모바일에서 9마리 추가 → PC에 실시간/동기화 후 14마리 표시
  async runScenario2() {
    const scenarioName = 'Scenario 2: Mobile → PC Incremental Sync'
    this.currentTest = scenarioName

    try {
      this.logResult(scenarioName, '시작', true, '시나리오 2 테스트 시작')

      // 시나리오 1 완료 상태에서 시작 (5마리 존재)
      const users = await this.setupTestUsers()
      const { data: auth } = await AuthService.signIn(users.pc.email, users.pc.password)
      
      await syncManager.init()
      await reptileCRUD.init(auth.user.id)

      // 현재 데이터 확인
      const initialReptiles = await reptileCRUD.getReptiles()
      this.logResult(scenarioName, '초기 데이터', true, `초기 ${initialReptiles.length}마리 확인`)

      // 2-1. 모바일에서 9마리 추가 (실제로는 같은 세션에서 시뮬레이션)
      const additionalReptiles = [
        { name: '모바일테스트1', species: 'Crested Gecko', sex: '수컷', morph: '옐로우' },
        { name: '모바일테스트2', species: 'Crested Gecko', sex: '암컷', morph: '오렌지' },
        { name: '모바일테스트3', species: 'Crested Gecko', sex: '미구분', morph: '레드' },
        { name: '모바일테스트4', species: 'Crested Gecko', sex: '수컷', morph: '파이어' },
        { name: '모바일테스트5', species: 'Crested Gecko', sex: '암컷', morph: '플레임' },
        { name: '모바일테스트6', species: 'Crested Gecko', sex: '미구분', morph: '크림' },
        { name: '모바일테스트7', species: 'Crested Gecko', sex: '수컷', morph: '바닐라' },
        { name: '모바일테스트8', species: 'Crested Gecko', sex: '암컷', morph: '펜타스틱' },
        { name: '모바일테스트9', species: 'Crested Gecko', sex: '미구분', morph: '엑스트림' },
      ]

      const addedReptiles = []
      for (const reptileData of additionalReptiles) {
        const reptile = await reptileCRUD.createReptile(reptileData)
        addedReptiles.push(reptile)
      }

      this.logResult(scenarioName, '모바일 데이터 추가', true, 
        `모바일에서 ${addedReptiles.length}마리 추가 완료`)

      // 2-2. 동기화 실행
      await syncManager.syncNow()
      await this.wait(2000)

      // 2-3. 총 개수 확인 (5 + 9 = 14)
      const finalReptiles = await reptileCRUD.getReptiles()
      const expectedTotal = initialReptiles.length + additionalReptiles.length
      const success = finalReptiles.length === expectedTotal

      this.logResult(scenarioName, '최종 데이터 확인', success,
        `총 ${finalReptiles.length}/${expectedTotal}마리 확인`,
        { 
          initial: initialReptiles.length, 
          added: additionalReptiles.length, 
          expected: expectedTotal, 
          actual: finalReptiles.length 
        })

      this.logResult(scenarioName, '완료', success, success ? '시나리오 2 성공' : '시나리오 2 실패')
      
      return success

    } catch (error) {
      this.logResult(scenarioName, '오류', false, `시나리오 2 실패: ${error.message}`)
      throw error
    }
  }

  // 시나리오 3: PC와 모바일에서 같은 개체를 거의 동시에 수정 → updated_at이 더 최신인 값으로 양쪽 동일해짐
  async runScenario3() {
    const scenarioName = 'Scenario 3: Conflict Resolution (Last-Write-Wins)'
    this.currentTest = scenarioName

    try {
      this.logResult(scenarioName, '시작', true, '시나리오 3 테스트 시작')

      const users = await this.setupTestUsers()
      const { data: auth } = await AuthService.signIn(users.pc.email, users.pc.password)
      
      await syncManager.init()
      await reptileCRUD.init(auth.user.id)

      // 3-1. 테스트용 개체 생성
      const testReptile = await reptileCRUD.createReptile({
        name: '충돌테스트용개체',
        species: 'Crested Gecko',
        sex: '수컷',
        notes: '초기상태'
      })

      this.logResult(scenarioName, '테스트 개체 생성', true, '충돌 테스트용 개체 생성 완료')

      // 3-2. 첫 번째 수정 (PC 시뮬레이션)
      await this.wait(100) // 짧은 대기
      const pcUpdate = await reptileCRUD.updateReptile(testReptile.id, {
        notes: 'PC에서 수정됨',
        morph: 'PC모프'
      })

      this.logResult(scenarioName, 'PC 수정', true, 'PC에서 개체 수정 완료',
        { updated_at: pcUpdate.updated_at, notes: pcUpdate.notes })

      // 3-3. 두 번째 수정 (모바일 시뮬레이션 - 더 나중)
      await this.wait(500) // 더 나중에 수정
      const mobileUpdate = await reptileCRUD.updateReptile(testReptile.id, {
        notes: '모바일에서 나중에 수정됨',
        weight_grams: 45.5
      })

      this.logResult(scenarioName, '모바일 수정', true, '모바일에서 개체 수정 완료',
        { updated_at: mobileUpdate.updated_at, notes: mobileUpdate.notes })

      // 3-4. 동기화 실행
      await syncManager.syncNow()
      await this.wait(2000)

      // 3-5. 최종 결과 확인 (더 최신 시간의 데이터가 승리해야 함)
      const finalReptile = await reptileCRUD.getReptile(testReptile.id)
      
      const pcTime = new Date(pcUpdate.updated_at)
      const mobileTime = new Date(mobileUpdate.updated_at)
      const expectedWinner = mobileTime > pcTime ? 'mobile' : 'pc'
      const expectedNotes = expectedWinner === 'mobile' ? '모바일에서 나중에 수정됨' : 'PC에서 수정됨'
      
      const success = finalReptile.notes === expectedNotes

      this.logResult(scenarioName, '충돌 해결 확인', success,
        `Last-Write-Wins 정책에 따라 ${expectedWinner} 버전이 승리`,
        {
          pcTime: pcUpdate.updated_at,
          mobileTime: mobileUpdate.updated_at,
          winner: expectedWinner,
          finalNotes: finalReptile.notes,
          expectedNotes
        })

      this.logResult(scenarioName, '완료', success, success ? '시나리오 3 성공' : '시나리오 3 실패')
      
      return success

    } catch (error) {
      this.logResult(scenarioName, '오류', false, `시나리오 3 실패: ${error.message}`)
      throw error
    }
  }

  // 시나리오 4: 모바일에서 특정 개체 soft delete → PC에서도 숨김 처리
  async runScenario4() {
    const scenarioName = 'Scenario 4: Soft Delete Sync'
    this.currentTest = scenarioName

    try {
      this.logResult(scenarioName, '시작', true, '시나리오 4 테스트 시작')

      const users = await this.setupTestUsers()
      const { data: auth } = await AuthService.signIn(users.pc.email, users.pc.password)
      
      await syncManager.init()
      await reptileCRUD.init(auth.user.id)

      // 4-1. 삭제할 테스트 개체 생성
      const testReptile = await reptileCRUD.createReptile({
        name: '삭제테스트용개체',
        species: 'Crested Gecko',
        sex: '암컷',
        notes: '삭제될 예정'
      })

      this.logResult(scenarioName, '테스트 개체 생성', true, '삭제 테스트용 개체 생성 완료')

      // 4-2. 초기 상태 확인
      const initialReptiles = await reptileCRUD.getReptiles() // deleted=false만
      const initialCount = initialReptiles.length
      const targetExists = initialReptiles.some(r => r.id === testReptile.id)

      this.logResult(scenarioName, '초기 상태 확인', targetExists,
        `삭제 전 활성 개체 ${initialCount}마리 (대상 개체 포함)`)

      // 4-3. 모바일에서 소프트 삭제 수행
      const deletedReptile = await reptileCRUD.softDeleteReptile(testReptile.id)

      this.logResult(scenarioName, '모바일 삭제', deletedReptile.deleted,
        '모바일에서 개체 소프트 삭제 완료',
        { deleted: deletedReptile.deleted, updated_at: deletedReptile.updated_at })

      // 4-4. 동기화 실행
      await syncManager.syncNow()
      await this.wait(2000)

      // 4-5. PC에서 결과 확인
      const finalReptiles = await reptileCRUD.getReptiles() // deleted=false만
      const finalCount = finalReptiles.length
      const targetStillExists = finalReptiles.some(r => r.id === testReptile.id)

      // 4-6. 삭제된 개체 직접 확인 (deleted=true 포함하여 조회)
      const allReptiles = await reptileCRUD.getReptiles({ includeDeleted: true })
      const deletedTarget = allReptiles.find(r => r.id === testReptile.id)

      const success = (
        finalCount === initialCount - 1 && // 활성 개체 수가 1 감소
        !targetStillExists && // 활성 목록에는 더 이상 없음
        deletedTarget && deletedTarget.deleted // 하지만 삭제 표시되어 존재함
      )

      this.logResult(scenarioName, 'PC 삭제 확인', success,
        `PC에서도 개체가 숨겨짐 (활성: ${finalCount}/${initialCount-1}마리)`,
        {
          initialCount,
          finalCount,
          targetStillExists,
          deletedTargetExists: !!deletedTarget,
          deletedFlag: deletedTarget?.deleted
        })

      this.logResult(scenarioName, '완료', success, success ? '시나리오 4 성공' : '시나리오 4 실패')
      
      return success

    } catch (error) {
      this.logResult(scenarioName, '오류', false, `시나리오 4 실패: ${error.message}`)
      throw error
    }
  }

  // 모든 시나리오 실행
  async runAllScenarios() {
    console.log('🧪 === 파충류 동기화 시스템 테스트 시작 ===')
    
    const results = {
      scenario1: false,
      scenario2: false,
      scenario3: false,
      scenario4: false,
      startTime: new Date().toISOString(),
      endTime: null,
      totalTests: 4,
      passedTests: 0
    }

    try {
      // 시나리오 1: PC → Mobile 동기화
      results.scenario1 = await this.runScenario1()
      if (results.scenario1) results.passedTests++

      // 시나리오 2: Mobile → PC 증분 동기화  
      results.scenario2 = await this.runScenario2()
      if (results.scenario2) results.passedTests++

      // 시나리오 3: 충돌 해결
      results.scenario3 = await this.runScenario3()
      if (results.scenario3) results.passedTests++

      // 시나리오 4: 소프트 삭제 동기화
      results.scenario4 = await this.runScenario4()
      if (results.scenario4) results.passedTests++

    } catch (error) {
      console.error('🚨 테스트 실행 중 오류:', error)
    } finally {
      results.endTime = new Date().toISOString()
      
      // 최종 리포트
      console.log('\n📊 === 테스트 결과 리포트 ===')
      console.log(`총 테스트: ${results.totalTests}`)
      console.log(`성공: ${results.passedTests}`)
      console.log(`실패: ${results.totalTests - results.passedTests}`)
      console.log(`성공률: ${Math.round((results.passedTests / results.totalTests) * 100)}%`)
      
      console.log('\n📋 시나리오별 결과:')
      console.log(`  시나리오 1 (PC→Mobile): ${results.scenario1 ? '✅ 성공' : '❌ 실패'}`)
      console.log(`  시나리오 2 (증분 동기화): ${results.scenario2 ? '✅ 성공' : '❌ 실패'}`)
      console.log(`  시나리오 3 (충돌 해결): ${results.scenario3 ? '✅ 성공' : '❌ 실패'}`)
      console.log(`  시나리오 4 (소프트 삭제): ${results.scenario4 ? '✅ 성공' : '❌ 실패'}`)

      const allPassed = results.passedTests === results.totalTests
      console.log(`\n🎯 최종 결과: ${allPassed ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패'}`)
    }

    return results
  }

  // 유틸리티 함수
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 테스트 결과 내보내기
  exportResults() {
    const report = {
      summary: {
        testCount: this.testResults.length,
        successCount: this.testResults.filter(r => r.success).length,
        failureCount: this.testResults.filter(r => !r.success).length,
        scenarios: [...new Set(this.testResults.map(r => r.scenario))],
        generatedAt: new Date().toISOString()
      },
      results: this.testResults
    }

    return report
  }

  // 테스트 환경 정리
  async cleanup() {
    try {
      await AuthService.signOut()
      console.log('🧹 테스트 환경 정리 완료')
    } catch (error) {
      console.error('테스트 환경 정리 실패:', error)
    }
  }
}

// 전역 테스트 실행 함수
export async function runAllTests() {
  const testRunner = new TestScenarios()
  
  try {
    const results = await testRunner.runAllScenarios()
    
    // 브라우저 환경에서는 결과를 콘솔과 로컬스토리지에 저장
    if (typeof window !== 'undefined') {
      window.testResults = results
      localStorage.setItem('reptile_test_results', JSON.stringify(testRunner.exportResults()))
    }
    
    return results
  } finally {
    await testRunner.cleanup()
  }
}

// 개별 시나리오 실행 함수들
export async function testScenario1() {
  const testRunner = new TestScenarios()
  return testRunner.runScenario1()
}

export async function testScenario2() {
  const testRunner = new TestScenarios()
  return testRunner.runScenario2()
}

export async function testScenario3() {
  const testRunner = new TestScenarios()
  return testRunner.runScenario3()
}

export async function testScenario4() {
  const testRunner = new TestScenarios()
  return testRunner.runScenario4()
}

export default TestScenarios