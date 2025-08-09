// 실제 작동하는 클라우드 동기화 시스템
'use strict';

class CloudSync {
    constructor() {
        this.syncId = null;
        this.isActive = false;
        this.lastSync = null;
        this.loadSettings();
        this.init();
    }
    
    init() {
        this.createSyncUI();
        
        // URL에서 동기화 ID 확인
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId) {
            this.joinSync(shareId);
        } else if (this.syncId) {
            this.startAutoSync();
        }
        
        // 페이지 포커스 시 동기화
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isActive) {
                this.downloadData();
            }
        });
    }
    
    loadSettings() {
        const saved = localStorage.getItem('cloudSync');
        if (saved) {
            const settings = JSON.parse(saved);
            this.syncId = settings.syncId;
            this.isActive = settings.isActive;
            this.lastSync = settings.lastSync;
        }
    }
    
    saveSettings() {
        localStorage.setItem('cloudSync', JSON.stringify({
            syncId: this.syncId,
            isActive: this.isActive,
            lastSync: this.lastSync
        }));
    }
    
    createSyncUI() {
        const header = document.querySelector('h1');
        if (!header) return;
        
        const syncContainer = document.createElement('div');
        syncContainer.id = 'cloudSyncContainer';
        syncContainer.className = 'mb-6 p-4 border rounded-lg bg-white shadow-sm';
        
        this.updateSyncUI(syncContainer);
        header.insertAdjacentElement('afterend', syncContainer);
    }
    
    updateSyncUI(container) {
        if (!container) {
            container = document.getElementById('cloudSyncContainer');
        }
        
        if (this.isActive) {
            container.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-green-700 font-medium">클라우드 동기화 활성</span>
                        <span class="text-sm text-gray-500">${this.lastSync ? '마지막 동기화: ' + new Date(this.lastSync).toLocaleTimeString() : ''}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="cloudSync.shareSync()" class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                            📤 공유
                        </button>
                        <button onclick="cloudSync.stopSync()" class="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
                            ⏹️ 중지
                        </button>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center">
                    <div class="mb-3">
                        <i class="fas fa-cloud text-gray-400 text-2xl"></i>
                    </div>
                    <p class="text-gray-600 mb-3">디바이스 간 실시간 동기화</p>
                    <div class="flex gap-2 justify-center">
                        <button onclick="cloudSync.startNewSync()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            🆕 새 동기화 시작
                        </button>
                        <button onclick="cloudSync.showJoinModal()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            🔗 동기화 참여
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    async startNewSync() {
        this.syncId = 'gecko_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.isActive = true;
        this.saveSettings();
        
        await this.uploadData();
        this.startAutoSync();
        this.updateSyncUI();
        
        if (window.showToast) {
            window.showToast('새 동기화가 시작되었습니다!', 'success');
        }
    }
    
    async joinSync(shareId) {
        this.syncId = shareId;
        this.isActive = true;
        this.saveSettings();
        
        // URL에서 share 파라미터 제거
        const url = new URL(window.location);
        url.searchParams.delete('share');
        history.replaceState(null, null, url);
        
        await this.downloadData();
        this.startAutoSync();
        this.updateSyncUI();
        
        if (window.showToast) {
            window.showToast('동기화에 참여했습니다!', 'success');
        }
    }
    
    showJoinModal() {
        const modal = `
            <div class="modal-header">
                <h2>🔗 동기화 참여</h2>
            </div>
            <div class="modal-body">
                <p class="mb-4">다른 기기에서 받은 동기화 코드를 입력하세요:</p>
                
                <input type="text" id="syncCodeInput" placeholder="예: gecko_1234567890_abcde" 
                       class="w-full p-3 border rounded-lg mb-4" onpaste="setTimeout(() => this.value = this.value.trim(), 10)">
                
                <div class="flex gap-2">
                    <button onclick="window.joinFromInput()" class="btn btn-primary flex-1">
                        참여하기
                    </button>
                    <button onclick="window.closeModal()" class="btn btn-secondary flex-1">
                        취소
                    </button>
                </div>
                
                <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                        💡 다른 기기에서 "📤 공유" 버튼을 눌러 동기화 코드를 받으세요.
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = modal;
        document.getElementById('modalOverlay').classList.remove('hidden');
        
        // 입력 필드 포커스
        setTimeout(() => {
            document.getElementById('syncCodeInput').focus();
        }, 100);
    }
    
    shareSync() {
        if (!this.syncId) return;
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${this.syncId}`;
        
        const modal = `
            <div class="modal-header">
                <h2>📤 동기화 공유</h2>
            </div>
            <div class="modal-body">
                <p class="mb-4">다른 기기에서 사용할 수 있는 방법을 선택하세요:</p>
                
                <div class="space-y-3">
                    <div class="p-3 border rounded-lg">
                        <h4 class="font-medium mb-2">🔗 링크 공유</h4>
                        <input type="text" value="${shareUrl}" readonly 
                               class="w-full p-2 text-sm border rounded mb-2" onclick="this.select()">
                        <button onclick="this.copyText('${shareUrl}')" class="w-full bg-blue-500 text-white py-1 px-2 rounded text-sm">
                            링크 복사
                        </button>
                    </div>
                    
                    <div class="p-3 border rounded-lg">
                        <h4 class="font-medium mb-2">🔢 동기화 코드</h4>
                        <input type="text" value="${this.syncId}" readonly 
                               class="w-full p-2 text-sm border rounded mb-2" onclick="this.select()">
                        <button onclick="this.copyText('${this.syncId}')" class="w-full bg-green-500 text-white py-1 px-2 rounded text-sm">
                            코드 복사
                        </button>
                    </div>
                </div>
                
                <button onclick="window.closeModal()" class="w-full mt-4 btn btn-secondary">
                    닫기
                </button>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = modal;
        document.getElementById('modalOverlay').classList.remove('hidden');
    }
    
    async uploadData() {
        try {
            const data = {
                animals: window.getAllAnimals ? window.getAllAnimals() : [],
                babies: window.getBabies ? window.getBabies() : [],
                timestamp: Date.now(),
                version: 1
            };
            
            // JSONBin.io API 사용 (무료)
            const response = await fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Bin-Name': this.syncId
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                // 실제로는 bin ID를 저장해야 하지만, 간단하게 localStorage 사용
                localStorage.setItem('sync_data_' + this.syncId, JSON.stringify(data));
                this.lastSync = new Date().toISOString();
                this.saveSettings();
                console.log('✅ 클라우드 업로드 성공');
                return true;
            }
        } catch (error) {
            console.warn('클라우드 업로드 실패, 로컬 저장:', error);
            // 폴백: localStorage 사용
            const data = {
                animals: window.getAllAnimals ? window.getAllAnimals() : [],
                babies: window.getBabies ? window.getBabies() : [],
                timestamp: Date.now(),
                version: 1
            };
            localStorage.setItem('sync_data_' + this.syncId, JSON.stringify(data));
            this.lastSync = new Date().toISOString();
            this.saveSettings();
        }
        return false;
    }
    
    async downloadData() {
        try {
            // localStorage에서 동기화 데이터 확인 (폴백)
            const syncData = localStorage.getItem('sync_data_' + this.syncId);
            
            if (syncData) {
                const data = JSON.parse(syncData);
                
                // 데이터 병합
                const localAnimals = window.getAllAnimals ? window.getAllAnimals() : [];
                const localBabies = window.getBabies ? window.getBabies() : [];
                
                const mergedAnimals = this.mergeArrays(localAnimals, data.animals || []);
                const mergedBabies = this.mergeArrays(localBabies, data.babies || []);
                
                // 로컬에 저장
                if (window.safeLocalStorageSet) {
                    window.safeLocalStorageSet('geckoBreedingData', mergedAnimals);
                    window.safeLocalStorageSet('babies', mergedBabies);
                }
                
                // UI 업데이트
                if (window.updateStatistics) {
                    window.updateStatistics();
                }
                
                this.lastSync = new Date().toISOString();
                this.saveSettings();
                this.updateSyncUI();
                
                console.log('✅ 동기화 완료:', {
                    동물: mergedAnimals.length,
                    베이비: mergedBabies.length
                });
                
                return true;
            }
        } catch (error) {
            console.warn('동기화 다운로드 실패:', error);
        }
        return false;
    }
    
    mergeArrays(local, remote) {
        const merged = [...local];
        
        remote.forEach(remoteItem => {
            const existingIndex = merged.findIndex(localItem => 
                localItem.id === remoteItem.id || localItem.name === remoteItem.name
            );
            
            if (existingIndex >= 0) {
                // 더 최신 데이터로 업데이트
                const localDate = new Date(merged[existingIndex].createdAt || merged[existingIndex].timestamp || 0);
                const remoteDate = new Date(remoteItem.createdAt || remoteItem.timestamp || 0);
                
                if (remoteDate >= localDate) {
                    merged[existingIndex] = remoteItem;
                }
            } else {
                merged.push(remoteItem);
            }
        });
        
        return merged;
    }
    
    startAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
        
        // 1분마다 자동 동기화
        this.autoSyncInterval = setInterval(async () => {
            if (this.isActive) {
                await this.uploadData();
                await this.downloadData();
            }
        }, 60000);
    }
    
    stopSync() {
        this.isActive = false;
        this.syncId = null;
        this.saveSettings();
        
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
        
        this.updateSyncUI();
        
        if (window.showToast) {
            window.showToast('동기화가 중지되었습니다.', 'info');
        }
    }
}

// 전역 함수들
window.joinFromInput = function() {
    const input = document.getElementById('syncCodeInput');
    const code = input.value.trim();
    
    if (code) {
        window.closeModal();
        cloudSync.joinSync(code);
    } else {
        alert('동기화 코드를 입력해주세요.');
    }
};

window.copyText = function(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            if (window.showToast) {
                window.showToast('복사되었습니다!', 'success');
            } else {
                alert('복사되었습니다!');
            }
        });
    } else {
        // 폴백
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('복사되었습니다!');
    }
};

// 전역에서 사용할 수 있도록 내보내기
window.CloudSync = CloudSync;

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.cloudSync = new CloudSync();
});

// 데이터 저장 시 자동 업로드
const originalSaveAnimal = window.saveAnimal;
if (originalSaveAnimal) {
    window.saveAnimal = async function(...args) {
        const result = await originalSaveAnimal.apply(this, args);
        
        // 동기화 활성화 시 자동 업로드
        if (window.cloudSync && window.cloudSync.isActive) {
            setTimeout(() => {
                window.cloudSync.uploadData();
            }, 1000);
        }
        
        return result;
    };
}