// 통합 파충류 관리 앱
// 모든 동기화 시스템을 통합한 완전한 애플리케이션

import { AuthService, supabase } from './supabase-config.js'
import { syncManager } from './sync-manager.js'
import { reptileCRUD, babyCRUD } from './reptile-crud.js'
import { initRealtimeSync } from './realtime-sync.js'
import { runAllTests } from './test-scenarios.js'

class ReptileApp {
  constructor() {
    this.currentUser = null
    this.isInitialized = false
    this.uiElements = {}
    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: null,
      pendingChanges: 0
    }
  }

  // 앱 초기화
  async init() {
    try {
      console.log('🚀 파충류 관리 앱 초기화 시작...')
      
      // UI 요소 바인딩
      this.bindUIElements()
      
      // 네트워크 상태 모니터링
      this.setupNetworkMonitoring()
      
      // 인증 상태 확인
      const user = await AuthService.getCurrentUser()
      
      if (user) {
        await this.initializeWithUser(user)
      } else {
        this.showLoginForm()
      }
      
      this.isInitialized = true
      console.log('✅ 파충류 관리 앱 초기화 완료')
      
    } catch (error) {
      console.error('❌ 앱 초기화 실패:', error)
      this.showError('앱 초기화에 실패했습니다: ' + error.message)
    }
  }

  // 사용자와 함께 초기화
  async initializeWithUser(user) {
    this.currentUser = user
    
    try {
      // 동기화 시스템 초기화
      await syncManager.init()
      
      // CRUD 시스템 초기화  
      await reptileCRUD.init(user.id)
      await babyCRUD.init(user.id)
      
      // 실시간 동기화 시작
      await initRealtimeSync(user.id)
      
      // 자동 동기화 시작 (5분마다)
      syncManager.startAutoSync(5)
      
      // 동기화 이벤트 리스너 등록
      this.setupSyncEventListeners()
      
      // UI 표시
      this.showMainApp()
      
      // 초기 데이터 로드
      await this.loadInitialData()
      
    } catch (error) {
      console.error('❌ 사용자 초기화 실패:', error)
      throw error
    }
  }

  // UI 요소 바인딩
  bindUIElements() {
    this.uiElements = {
      // 인증 관련
      loginForm: document.getElementById('loginForm'),
      loginEmail: document.getElementById('loginEmail'),
      loginPassword: document.getElementById('loginPassword'),
      loginButton: document.getElementById('loginButton'),
      logoutButton: document.getElementById('logoutButton'),
      
      // 메인 앱
      mainApp: document.getElementById('mainApp'),
      userInfo: document.getElementById('userInfo'),
      
      // 동기화 상태
      syncStatus: document.getElementById('syncStatus'),
      syncButton: document.getElementById('syncButton'),
      
      // 파충류 관리
      reptilesList: document.getElementById('reptilesList'),
      addReptileButton: document.getElementById('addReptileButton'),
      reptileForm: document.getElementById('reptileForm'),
      
      // 통계
      statsContainer: document.getElementById('statsContainer'),
      
      // 테스트
      testButton: document.getElementById('testButton'),
      testResults: document.getElementById('testResults')
    }

    // 이벤트 리스너 등록
    this.setupEventListeners()
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 로그인
    if (this.uiElements.loginButton) {
      this.uiElements.loginButton.addEventListener('click', () => this.handleLogin())
    }

    // 로그아웃
    if (this.uiElements.logoutButton) {
      this.uiElements.logoutButton.addEventListener('click', () => this.handleLogout())
    }

    // 수동 동기화
    if (this.uiElements.syncButton) {
      this.uiElements.syncButton.addEventListener('click', () => this.handleManualSync())
    }

    // 파충류 추가
    if (this.uiElements.addReptileButton) {
      this.uiElements.addReptileButton.addEventListener('click', () => this.showAddReptileForm())
    }

    // 테스트 실행
    if (this.uiElements.testButton) {
      this.uiElements.testButton.addEventListener('click', () => this.runTests())
    }

    // 엔터키로 로그인
    if (this.uiElements.loginPassword) {
      this.uiElements.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin()
      })
    }
  }

  // 네트워크 모니터링
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true
      this.updateSyncStatusUI()
      console.log('🌐 온라인 상태 - 자동 동기화 시작')
    })

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false
      this.updateSyncStatusUI()
      console.log('📴 오프라인 상태')
    })
  }

  // 동기화 이벤트 리스너
  setupSyncEventListeners() {
    syncManager.onSyncStart(() => {
      this.updateSyncStatusUI('syncing')
    })

    syncManager.onSyncComplete(() => {
      this.syncStatus.lastSync = new Date()
      this.updateSyncStatusUI('completed')
      this.loadReptilesList() // UI 갱신
    })

    syncManager.onSyncError((eventType, data) => {
      console.error('동기화 오류:', data.error)
      this.updateSyncStatusUI('error')
    })
  }

  // 로그인 처리
  async handleLogin() {
    const email = this.uiElements.loginEmail?.value
    const password = this.uiElements.loginPassword?.value

    if (!email || !password) {
      this.showError('이메일과 비밀번호를 입력해주세요')
      return
    }

    try {
      this.showLoading('로그인 중...')
      
      const { data } = await AuthService.signIn(email, password)
      
      if (data.user) {
        await this.initializeWithUser(data.user)
      }
      
    } catch (error) {
      console.error('로그인 실패:', error)
      this.showError('로그인에 실패했습니다: ' + error.message)
    } finally {
      this.hideLoading()
    }
  }

  // 로그아웃 처리
  async handleLogout() {
    try {
      // 자동 동기화 중지
      syncManager.stopAutoSync()
      
      // 로그아웃
      await AuthService.signOut()
      
      // 상태 초기화
      this.currentUser = null
      
      // UI 전환
      this.showLoginForm()
      
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  // 수동 동기화
  async handleManualSync() {
    try {
      this.updateSyncStatusUI('syncing')
      await syncManager.syncNow()
    } catch (error) {
      console.error('수동 동기화 실패:', error)
      this.showError('동기화에 실패했습니다')
    }
  }

  // 초기 데이터 로드
  async loadInitialData() {
    await Promise.all([
      this.loadReptilesList(),
      this.loadStatistics()
    ])
  }

  // 파충류 목록 로드
  async loadReptilesList() {
    try {
      const reptiles = await reptileCRUD.getReptiles({
        sortBy: 'updated_at',
        sortOrder: 'desc'
      })

      this.renderReptilesList(reptiles)
      
    } catch (error) {
      console.error('파충류 목록 로드 실패:', error)
    }
  }

  // 파충류 목록 렌더링
  renderReptilesList(reptiles) {
    if (!this.uiElements.reptilesList) return

    if (reptiles.length === 0) {
      this.uiElements.reptilesList.innerHTML = `
        <div class="empty-state">
          <p>등록된 파충류가 없습니다.</p>
          <button class="btn btn-primary" onclick="reptileApp.showAddReptileForm()">
            첫 파충류 등록하기
          </button>
        </div>
      `
      return
    }

    const html = reptiles.map(reptile => this.renderReptileCard(reptile)).join('')
    this.uiElements.reptilesList.innerHTML = html
  }

  // 파충류 카드 렌더링
  renderReptileCard(reptile) {
    const lastUpdated = new Date(reptile.updated_at).toLocaleDateString()
    
    return `
      <div class="reptile-card" data-id="${reptile.id}">
        <div class="reptile-header">
          <h3>${this.escapeHtml(reptile.name)}</h3>
          <span class="status-badge status-${reptile.status}">${reptile.status}</span>
        </div>
        
        <div class="reptile-info">
          <div class="info-row">
            <span class="label">종류:</span>
            <span class="value">${reptile.species}</span>
          </div>
          <div class="info-row">
            <span class="label">성별:</span>
            <span class="value">${reptile.sex}</span>
          </div>
          <div class="info-row">
            <span class="label">세대:</span>
            <span class="value">${reptile.generation}</span>
          </div>
          ${reptile.morph ? `
          <div class="info-row">
            <span class="label">모프:</span>
            <span class="value">${this.escapeHtml(reptile.morph)}</span>
          </div>
          ` : ''}
          ${reptile.weight_grams ? `
          <div class="info-row">
            <span class="label">무게:</span>
            <span class="value">${reptile.weight_grams}g</span>
          </div>
          ` : ''}
        </div>
        
        <div class="reptile-actions">
          <button class="btn btn-sm btn-secondary" onclick="reptileApp.editReptile('${reptile.id}')">
            수정
          </button>
          <button class="btn btn-sm btn-danger" onclick="reptileApp.deleteReptile('${reptile.id}')">
            삭제
          </button>
        </div>
        
        <div class="reptile-footer">
          <small>마지막 수정: ${lastUpdated}</small>
        </div>
      </div>
    `
  }

  // 통계 로드
  async loadStatistics() {
    try {
      const stats = await reptileCRUD.getStatistics()
      this.renderStatistics(stats)
    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  // 통계 렌더링
  renderStatistics(stats) {
    if (!this.uiElements.statsContainer) return

    const html = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${stats.total}</div>
          <div class="stat-label">전체 개체</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.byStatus['활성'] || 0}</div>
          <div class="stat-label">활성 개체</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.byGender['수컷'] || 0}</div>
          <div class="stat-label">수컷</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.byGender['암컷'] || 0}</div>
          <div class="stat-label">암컷</div>
        </div>
      </div>
    `

    this.uiElements.statsContainer.innerHTML = html
  }

  // 파충류 추가 폼 표시
  showAddReptileForm() {
    const formHtml = `
      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>새 파충류 등록</h2>
            <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
          </div>
          
          <form id="addReptileForm" class="modal-body">
            <div class="form-group">
              <label for="reptileName">이름 *</label>
              <input type="text" id="reptileName" required>
            </div>
            
            <div class="form-group">
              <label for="reptileSex">성별</label>
              <select id="reptileSex">
                <option value="미구분">미구분</option>
                <option value="수컷">수컷</option>
                <option value="암컷">암컷</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="reptileMorph">모프</label>
              <input type="text" id="reptileMorph">
            </div>
            
            <div class="form-group">
              <label for="reptileNotes">메모</label>
              <textarea id="reptileNotes" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                취소
              </button>
              <button type="submit" class="btn btn-primary">
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', formHtml)

    // 폼 제출 이벤트
    document.getElementById('addReptileForm').addEventListener('submit', (e) => {
      e.preventDefault()
      this.handleAddReptile(e.target)
    })
  }

  // 파충류 추가 처리
  async handleAddReptile(form) {
    const formData = new FormData(form)
    
    const reptileData = {
      name: document.getElementById('reptileName').value,
      sex: document.getElementById('reptileSex').value,
      morph: document.getElementById('reptileMorph').value,
      notes: document.getElementById('reptileNotes').value,
    }

    try {
      await reptileCRUD.createReptile(reptileData)
      
      // 폼 닫기
      form.closest('.modal').remove()
      
      // 목록 갱신
      await this.loadReptilesList()
      await this.loadStatistics()
      
      this.showSuccess('파충류가 성공적으로 등록되었습니다')
      
    } catch (error) {
      console.error('파충류 등록 실패:', error)
      this.showError('파충류 등록에 실패했습니다: ' + error.message)
    }
  }

  // 파충류 삭제
  async deleteReptile(reptileId) {
    if (!confirm('정말로 이 파충류를 삭제하시겠습니까?')) return

    try {
      await reptileCRUD.softDeleteReptile(reptileId)
      
      await this.loadReptilesList()
      await this.loadStatistics()
      
      this.showSuccess('파충류가 삭제되었습니다')
      
    } catch (error) {
      console.error('파충류 삭제 실패:', error)
      this.showError('파충류 삭제에 실패했습니다')
    }
  }

  // 동기화 상태 UI 업데이트
  updateSyncStatusUI(status) {
    if (!this.uiElements.syncStatus) return

    const statusConfig = {
      syncing: { icon: '🔄', text: '동기화 중...', class: 'syncing' },
      completed: { icon: '✅', text: '동기화 완료', class: 'completed' },
      error: { icon: '❌', text: '동기화 실패', class: 'error' },
      offline: { icon: '📴', text: '오프라인', class: 'offline' }
    }

    const currentStatus = status || (this.syncStatus.isOnline ? 'completed' : 'offline')
    const config = statusConfig[currentStatus]

    this.uiElements.syncStatus.innerHTML = `
      <span class="sync-icon">${config.icon}</span>
      <span class="sync-text">${config.text}</span>
      ${this.syncStatus.lastSync ? 
        `<small>마지막: ${this.syncStatus.lastSync.toLocaleTimeString()}</small>` : 
        ''
      }
    `
    
    this.uiElements.syncStatus.className = `sync-status ${config.class}`
  }

  // UI 상태 변경
  showLoginForm() {
    if (this.uiElements.loginForm) this.uiElements.loginForm.style.display = 'block'
    if (this.uiElements.mainApp) this.uiElements.mainApp.style.display = 'none'
  }

  showMainApp() {
    if (this.uiElements.loginForm) this.uiElements.loginForm.style.display = 'none'
    if (this.uiElements.mainApp) this.uiElements.mainApp.style.display = 'block'
    
    if (this.uiElements.userInfo && this.currentUser) {
      this.uiElements.userInfo.textContent = this.currentUser.email
    }
  }

  // 테스트 실행
  async runTests() {
    if (!this.uiElements.testButton || !this.uiElements.testResults) return

    try {
      this.uiElements.testButton.disabled = true
      this.uiElements.testButton.textContent = '테스트 실행 중...'
      
      this.uiElements.testResults.innerHTML = '<p>🧪 테스트 실행 중입니다...</p>'
      
      const results = await runAllTests()
      
      this.renderTestResults(results)
      
    } catch (error) {
      console.error('테스트 실행 실패:', error)
      this.uiElements.testResults.innerHTML = `<p>❌ 테스트 실행 실패: ${error.message}</p>`
    } finally {
      this.uiElements.testButton.disabled = false
      this.uiElements.testButton.textContent = '테스트 실행'
    }
  }

  // 테스트 결과 렌더링
  renderTestResults(results) {
    const successRate = Math.round((results.passedTests / results.totalTests) * 100)
    
    const html = `
      <div class="test-results">
        <h3>테스트 결과</h3>
        <div class="test-summary">
          <p>성공률: <strong>${successRate}%</strong> (${results.passedTests}/${results.totalTests})</p>
        </div>
        
        <div class="test-scenarios">
          <div class="scenario ${results.scenario1 ? 'pass' : 'fail'}">
            ${results.scenario1 ? '✅' : '❌'} 시나리오 1: PC → Mobile 동기화
          </div>
          <div class="scenario ${results.scenario2 ? 'pass' : 'fail'}">
            ${results.scenario2 ? '✅' : '❌'} 시나리오 2: 증분 동기화 (14마리)
          </div>
          <div class="scenario ${results.scenario3 ? 'pass' : 'fail'}">
            ${results.scenario3 ? '✅' : '❌'} 시나리오 3: 충돌 해결
          </div>
          <div class="scenario ${results.scenario4 ? 'pass' : 'fail'}">
            ${results.scenario4 ? '✅' : '❌'} 시나리오 4: 소프트 삭제 동기화
          </div>
        </div>
        
        <p><small>상세 결과는 브라우저 콘솔을 확인하세요.</small></p>
      </div>
    `
    
    this.uiElements.testResults.innerHTML = html
  }

  // 유틸리티 함수들
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  showLoading(message) {
    // 로딩 UI 구현
  }

  hideLoading() {
    // 로딩 UI 숨김
  }

  showSuccess(message) {
    console.log('✅', message)
    // Toast 알림 등으로 구현 가능
  }

  showError(message) {
    console.error('❌', message)
    alert(message) // 간단한 구현
  }
}

// 전역 앱 인스턴스
export const reptileApp = new ReptileApp()

// 자동 초기화
if (typeof window !== 'undefined') {
  window.reptileApp = reptileApp
  
  // DOM 로드 완료 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => reptileApp.init())
  } else {
    reptileApp.init()
  }
}

export default reptileApp