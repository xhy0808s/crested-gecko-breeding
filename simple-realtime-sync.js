// 간단한 실시간 동기화 시스템
// Firebase 없이도 실시간으로 디바이스 간 동기화

class SimpleRealtimeSync {
    constructor() {
        this.syncId = null
        this.isActive = false
        this.lastSync = null
        this.syncInterval = null
        this.eventSource = null
        this.loadSettings()
    }
    
    init() {
        // URL에서 동기화 ID 확인
        const urlParams = new URLSearchParams(window.location.search)
        const shareId = urlParams.get('sync')
        
        if (shareId) {
            this.joinSync(shareId)
        } else if (this.syncId) {
            this.startSync()
        }
        
        this.createSyncUI()
    }
    
    loadSettings() {
        const saved = localStorage.getItem('realtimeSync')
        if (saved) {
            const settings = JSON.parse(saved)
            this.syncId = settings.syncId
            this.isActive = settings.isActive
            this.lastSync = settings.lastSync
        }
    }
    
    saveSettings() {
        localStorage.setItem('realtimeSync', JSON.stringify({
            syncId: this.syncId,
            isActive: this.isActive,
            lastSync: this.lastSync
        }))
    }
    
    createSyncUI() {
        const container = document.querySelector('.container')
        if (!container) return
        
        const syncContainer = document.createElement('div')
        syncContainer.id = 'realtimeSyncContainer'
        syncContainer.className = 'mb-6 p-4 border-2 border-green-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
        
        this.updateSyncUI(syncContainer)
        container.prepend(syncContainer)
    }
    
    updateSyncUI(container) {
        if (!container) container = document.getElementById('realtimeSyncContainer')
        if (!container) return
        
        if (this.isActive) {
            container.innerHTML = `
                <div class="text-center">
                    <div class="mb-4">
                        <div class="flex items-center justify-center gap-2 mb-2">
                            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span class="text-green-800 font-bold text-lg">⚡ 실시간 동기화 활성</span>
                        </div>
                        <p class="text-sm text-green-600">
                            다른 기기와 실시간으로 데이터가 동기화됩니다
                        </p>
                        ${this.lastSync ? `<p class="text-xs text-green-500 mt-1">마지막 동기화: ${new Date(this.lastSync).toLocaleString()}</p>` : ''}
                    </div>
                    
                    <div class="flex justify-center gap-3">
                        <button onclick="realtimeSync.shareSync()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                            📤 공유하기
                        </button>
                        <button onclick="realtimeSync.manualSync()" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                            🔄 지금 동기화
                        </button>
                        <button onclick="realtimeSync.stopSync()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            ⏹️ 중지
                        </button>
                    </div>
                </div>
            `
        } else {
            container.innerHTML = `
                <div class="text-center">
                    <div class="mb-4">
                        <i class="fas fa-wifi text-gray-400 text-3xl mb-3"></i>
                        <h3 class="text-lg font-bold text-gray-700 mb-2">실시간 동기화</h3>
                        <p class="text-gray-600 mb-3">디바이스 간 실시간으로 데이터를 동기화하세요</p>
                    </div>
                    
                    <div class="flex justify-center gap-3">
                        <button onclick="realtimeSync.startNewSync()" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold">
                            🆕 새 동기화 시작
                        </button>
                        <button onclick="realtimeSync.showJoinModal()" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold">
                            🔗 동기화 참여
                        </button>
                    </div>
                </div>
            `
        }
    }
    
    async startNewSync() {
        this.syncId = 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        this.isActive = true
        this.saveSettings()
        
        await this.uploadData()
        this.startRealTimePolling()
        this.updateSyncUI()
        
        this.showToast('새 실시간 동기화가 시작되었습니다!', 'success')
    }
    
    async joinSync(syncId) {
        this.syncId = syncId
        this.isActive = true
        this.saveSettings()
        
        // URL에서 sync 파라미터 제거
        const url = new URL(window.location)
        url.searchParams.delete('sync')
        history.replaceState(null, null, url)
        
        await this.downloadData()
        this.startRealTimePolling()
        this.updateSyncUI()
        
        this.showToast('실시간 동기화에 참여했습니다!', 'success')
    }
    
    showJoinModal() {
        const modal = document.createElement('div')
        modal.className = 'modal-overlay'
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔗 실시간 동기화 참여</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-2xl">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="mb-4">다른 기기에서 받은 동기화 코드를 입력하세요:</p>
                    
                    <input type="text" id="syncCodeInput" placeholder="예: sync_1234567890_abcde" 
                           class="w-full p-3 border rounded-lg mb-4">
                    
                    <div class="flex gap-3">
                        <button onclick="realtimeSync.joinFromInput()" class="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600">
                            참여하기
                        </button>
                        <button onclick="this.closest('.modal-overlay').remove()" class="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600">
                            취소
                        </button>
                    </div>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
        setTimeout(() => document.getElementById('syncCodeInput').focus(), 100)
    }
    
    joinFromInput() {
        const input = document.getElementById('syncCodeInput')
        const code = input.value.trim()
        
        if (code) {
            document.querySelector('.modal-overlay').remove()
            this.joinSync(code)
        } else {
            alert('동기화 코드를 입력해주세요.')
        }
    }
    
    shareSync() {
        if (!this.syncId) return
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?sync=${this.syncId}`
        
        const modal = document.createElement('div')
        modal.className = 'modal-overlay'
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📤 실시간 동기화 공유</h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-2xl">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="mb-4">다른 기기에서 사용할 수 있는 방법을 선택하세요:</p>
                    
                    <div class="space-y-4">
                        <div class="p-4 border rounded-lg bg-blue-50">
                            <h4 class="font-bold mb-2">🔗 링크 공유 (추천)</h4>
                            <input type="text" value="${shareUrl}" readonly 
                                   class="w-full p-2 text-sm border rounded mb-2" onclick="this.select()">
                            <button onclick="realtimeSync.copyText('${shareUrl}')" class="w-full bg-blue-500 text-white py-2 px-3 rounded">
                                링크 복사
                            </button>
                        </div>
                        
                        <div class="p-4 border rounded-lg bg-green-50">
                            <h4 class="font-bold mb-2">🔢 동기화 코드</h4>
                            <input type="text" value="${this.syncId}" readonly 
                                   class="w-full p-2 text-sm border rounded mb-2" onclick="this.select()">
                            <button onclick="realtimeSync.copyText('${this.syncId}')" class="w-full bg-green-500 text-white py-2 px-3 rounded">
                                코드 복사
                            </button>
                        </div>
                    </div>
                    
                    <button onclick="this.closest('.modal-overlay').remove()" class="w-full mt-4 bg-gray-500 text-white py-3 px-4 rounded-lg">
                        닫기
                    </button>
                </div>
            </div>
        `
        
        document.body.appendChild(modal)
    }
    
    async uploadData() {
        try {
            const animals = window.getAllAnimals ? window.getAllAnimals() : []
            const babies = window.getBabies ? window.getBabies() : []
            
            const data = {
                animals,
                babies,
                timestamp: Date.now(),
                syncId: this.syncId
            }
            
            // GitHub Gist API 사용 (무료)
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: `ReptileSync_${this.syncId}`,
                    public: false,
                    files: {
                        [`${this.syncId}.json`]: {
                            content: JSON.stringify(data)
                        }
                    }
                })
            })
            
            if (response.ok) {
                const result = await response.json()
                localStorage.setItem('gist_' + this.syncId, result.id)
                this.lastSync = new Date().toISOString()
                this.saveSettings()
                console.log('✅ 데이터 업로드 성공')
            } else {
                // 폴백: localStorage 사용
                this.fallbackToLocalStorage(data)
            }
            
        } catch (error) {
            console.warn('업로드 실패, 로컬 저장:', error)
            this.fallbackToLocalStorage({
                animals: window.getAllAnimals ? window.getAllAnimals() : [],
                babies: window.getBabies ? window.getBabies() : [],
                timestamp: Date.now(),
                syncId: this.syncId
            })
        }
    }
    
    fallbackToLocalStorage(data) {
        localStorage.setItem('sync_data_' + this.syncId, JSON.stringify(data))
        this.lastSync = new Date().toISOString()
        this.saveSettings()
    }
    
    async downloadData() {
        try {
            // 로컬 데이터 확인
            const localData = localStorage.getItem('sync_data_' + this.syncId)
            
            if (localData) {
                const data = JSON.parse(localData)
                await this.mergeData(data)
                return
            }
            
            // GitHub Gist에서 다운로드 시도
            const gistId = localStorage.getItem('gist_' + this.syncId)
            if (gistId) {
                const response = await fetch(`https://api.github.com/gists/${gistId}`)
                if (response.ok) {
                    const gist = await response.json()
                    const fileContent = Object.values(gist.files)[0].content
                    const data = JSON.parse(fileContent)
                    await this.mergeData(data)
                }
            }
            
        } catch (error) {
            console.warn('다운로드 실패:', error)
        }
    }
    
    async mergeData(serverData) {
        try {
            const localAnimals = window.getAllAnimals ? window.getAllAnimals() : []
            const localBabies = window.getBabies ? window.getBabies() : []
            
            const serverAnimals = serverData.animals || []
            const serverBabies = serverData.babies || []
            
            // 데이터 병합
            const mergedAnimals = this.mergeArrays(localAnimals, serverAnimals)
            const mergedBabies = this.mergeArrays(localBabies, serverBabies)
            
            // 로컬에 저장
            if (window.safeLocalStorageSet) {
                window.safeLocalStorageSet('geckoBreedingData', mergedAnimals)
                window.safeLocalStorageSet('babies', mergedBabies)
            } else {
                localStorage.setItem('geckoBreedingData', JSON.stringify(mergedAnimals))
                localStorage.setItem('babies', JSON.stringify(mergedBabies))
            }
            
            // UI 업데이트
            if (window.updateStatistics) {
                window.updateStatistics()
            }
            
            this.lastSync = new Date().toISOString()
            this.saveSettings()
            
            console.log('✅ 데이터 병합 완료:', {
                동물: mergedAnimals.length,
                베이비: mergedBabies.length
            })
            
            this.updateSyncUI()
            
        } catch (error) {
            console.error('데이터 병합 실패:', error)
        }
    }
    
    mergeArrays(local, remote) {
        const merged = [...local]
        
        remote.forEach(remoteItem => {
            const existingIndex = merged.findIndex(localItem => 
                localItem.id === remoteItem.id || 
                (localItem.name && localItem.name === remoteItem.name)
            )
            
            if (existingIndex >= 0) {
                // 더 최신 데이터로 업데이트
                const localDate = new Date(merged[existingIndex].createdAt || merged[existingIndex].timestamp || 0)
                const remoteDate = new Date(remoteItem.createdAt || remoteItem.timestamp || 0)
                
                if (remoteDate >= localDate) {
                    merged[existingIndex] = remoteItem
                }
            } else {
                merged.push(remoteItem)
            }
        })
        
        return merged
    }
    
    startRealTimePolling() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }
        
        // 30초마다 동기화 확인
        this.syncInterval = setInterval(async () => {
            if (this.isActive) {
                await this.downloadData()
            }
        }, 30000)
        
        console.log('⚡ 실시간 폴링 시작 (30초 간격)')
    }
    
    async manualSync() {
        if (!this.isActive) return
        
        this.showToast('동기화 중...', 'info')
        
        try {
            await this.uploadData()
            await this.downloadData()
            this.showToast('동기화 완료!', 'success')
        } catch (error) {
            this.showToast('동기화 실패', 'error')
        }
    }
    
    stopSync() {
        this.isActive = false
        this.syncId = null
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
            this.syncInterval = null
        }
        
        this.saveSettings()
        this.updateSyncUI()
        
        this.showToast('실시간 동기화가 중지되었습니다.', 'info')
    }
    
    startSync() {
        if (this.syncId && this.isActive) {
            this.startRealTimePolling()
            this.updateSyncUI()
        }
    }
    
    copyText(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('복사되었습니다!', 'success')
            })
        } else {
            const textArea = document.createElement('textarea')
            textArea.value = text
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            this.showToast('복사되었습니다!', 'success')
        }
    }
    
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type)
        } else {
            console.log(`${type.toUpperCase()}: ${message}`)
        }
    }
}

// 전역 인스턴스 생성
window.realtimeSync = new SimpleRealtimeSync()

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.realtimeSync.init()
    }, 1000)
})

// 데이터 변경 시 자동 업로드
const originalSaveAnimal = window.saveAnimal
if (typeof window.saveAnimal === 'function') {
    window.saveAnimal = async function(...args) {
        const result = await originalSaveAnimal.apply(this, args)
        
        // 실시간 동기화 활성화 시 자동 업로드
        if (window.realtimeSync && window.realtimeSync.isActive) {
            setTimeout(() => {
                window.realtimeSync.uploadData()
            }, 2000)
        }
        
        return result
    }
}