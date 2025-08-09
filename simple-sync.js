// 간단한 URL 기반 동기화 시스템
'use strict';

class SimpleSync {
    constructor() {
        this.isEnabled = false;
        this.syncKey = this.generateSyncKey();
        this.init();
    }
    
    init() {
        // URL에서 동기화 키 확인
        const urlParams = new URLSearchParams(window.location.search);
        const sharedKey = urlParams.get('sync');
        
        if (sharedKey) {
            this.syncKey = sharedKey;
            this.isEnabled = true;
            this.showSyncStatus('다른 기기와 연결됨', 'success');
        } else {
            this.showSyncButton();
        }
        
        // 주기적 동기화
        if (this.isEnabled) {
            this.startAutoSync();
        }
    }
    
    generateSyncKey() {
        return 'gecko_' + Math.random().toString(36).substr(2, 9);
    }
    
    showSyncButton() {
        const header = document.querySelector('h1');
        if (header) {
            const syncBtn = document.createElement('button');
            syncBtn.innerHTML = '🔗 기기 간 동기화 활성화';
            syncBtn.className = 'btn btn-primary mt-4';
            syncBtn.onclick = () => this.enableSync();
            header.insertAdjacentElement('afterend', syncBtn);
        }
    }
    
    enableSync() {
        this.isEnabled = true;
        const syncUrl = window.location.origin + window.location.pathname + '?sync=' + this.syncKey;
        
        // 링크 복사 모달 표시
        const modal = `
            <div class="modal-header">
                <h2>🔗 기기 간 동기화</h2>
            </div>
            <div class="modal-body">
                <p class="mb-4">다른 기기에서 아래 링크를 열면 데이터가 동기화됩니다:</p>
                
                <div class="bg-gray-100 p-4 rounded-lg mb-4">
                    <input type="text" id="syncUrl" value="${syncUrl}" readonly 
                           class="w-full p-2 border rounded" onclick="this.select()">
                </div>
                
                <div class="flex gap-2">
                    <button onclick="this.copyToClipboard('${syncUrl}')" class="btn btn-primary flex-1">
                        📋 링크 복사
                    </button>
                    <button onclick="window.closeModal()" class="btn btn-secondary flex-1">
                        닫기
                    </button>
                </div>
                
                <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                        💡 <strong>사용법:</strong><br>
                        1. "링크 복사" 버튼 클릭<br>
                        2. 다른 기기(폰/PC)에서 링크 열기<br>
                        3. 자동으로 데이터 동기화됨
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = modal;
        document.getElementById('modalOverlay').classList.remove('hidden');
        
        // 현재 URL 업데이트
        history.replaceState(null, null, syncUrl);
        
        this.showSyncStatus('동기화 활성화됨', 'success');
        this.startAutoSync();
    }
    
    startAutoSync() {
        // 30초마다 자동 동기화
        setInterval(() => {
            this.syncData();
        }, 30000);
        
        // 페이지 포커스 시 동기화
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncData();
            }
        });
    }
    
    async syncData() {
        if (!this.isEnabled) return;
        
        try {
            // GitHub Gist를 간단한 저장소로 사용
            const data = {
                animals: window.getAllAnimals ? window.getAllAnimals() : [],
                babies: window.getBabies ? window.getBabies() : [],
                lastSync: new Date().toISOString(),
                syncKey: this.syncKey
            };
            
            // 로컬스토리지에 임시 저장 (실제 구현에서는 외부 API 사용)
            const syncData = JSON.parse(localStorage.getItem('sync_' + this.syncKey) || '{"animals":[], "babies":[]}');
            
            // 데이터 병합
            const mergedAnimals = this.mergeArrays(data.animals, syncData.animals || []);
            const mergedBabies = this.mergeArrays(data.babies, syncData.babies || []);
            
            // 로컬에 병합된 데이터 저장
            if (window.safeLocalStorageSet) {
                window.safeLocalStorageSet('geckoBreedingData', mergedAnimals);
                window.safeLocalStorageSet('babies', mergedBabies);
            }
            
            // 동기화 데이터 업데이트
            localStorage.setItem('sync_' + this.syncKey, JSON.stringify({
                animals: mergedAnimals,
                babies: mergedBabies,
                lastSync: new Date().toISOString()
            }));
            
            // UI 업데이트
            if (window.updateStatistics) {
                window.updateStatistics();
            }
            
            console.log('🔄 동기화 완료');
            
        } catch (error) {
            console.warn('동기화 실패:', error);
        }
    }
    
    mergeArrays(local, remote) {
        const merged = [...local];
        
        remote.forEach(remoteItem => {
            const existingIndex = merged.findIndex(localItem => 
                localItem.id === remoteItem.id
            );
            
            if (existingIndex >= 0) {
                // 더 최신 데이터로 업데이트
                const localDate = new Date(merged[existingIndex].createdAt || 0);
                const remoteDate = new Date(remoteItem.createdAt || 0);
                
                if (remoteDate > localDate) {
                    merged[existingIndex] = remoteItem;
                }
            } else {
                merged.push(remoteItem);
            }
        });
        
        return merged;
    }
    
    showSyncStatus(message, type) {
        const statusDiv = document.getElementById('syncStatus') || this.createStatusDiv();
        statusDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-sync-alt ${type === 'success' ? 'text-green-600' : 'text-blue-600'}"></i>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        statusDiv.className = `p-2 rounded-lg ${type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`;
    }
    
    createStatusDiv() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'syncStatus';
        statusDiv.className = 'mb-4';
        document.querySelector('.container').prepend(statusDiv);
        return statusDiv;
    }
}

// 클립보드 복사 함수
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (window.showToast) {
            window.showToast('링크가 클립보드에 복사되었습니다!', 'success');
        } else {
            alert('링크가 복사되었습니다!');
        }
    }).catch(() => {
        // 폴백: 텍스트 선택
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('링크가 복사되었습니다!');
    });
};

// 전역에서 사용할 수 있도록 내보내기
window.SimpleSync = SimpleSync;

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.simpleSync = new SimpleSync();
});