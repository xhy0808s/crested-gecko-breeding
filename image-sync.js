// 이미지 동기화 시스템
// PC와 모바일 간 이미지 실시간 동기화

class ImageSync {
    constructor() {
        this.maxImageSize = 1024 * 1024; // 1MB
        this.quality = 0.8; // 이미지 품질
        this.supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        this.init();
    }

    // 초기화
    init() {
        console.log('🖼️ 이미지 동기화 시스템 시작');
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 이미지 업로드 시 자동 동기화
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.accept.includes('image')) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        // 이미지 동기화 이벤트 리스너
        window.addEventListener('imageSync', (event) => {
            this.handleImageSync(event.detail);
        });
    }

    // 이미지 업로드 처리
    async handleImageUpload(file) {
        try {
            console.log('📸 이미지 업로드 처리:', file.name);
            
            // 파일 검증
            if (!this.validateImage(file)) {
                return;
            }

            // 이미지 압축 및 Base64 변환
            const compressedImage = await this.compressImage(file);
            
            // 이미지 ID 생성
            const imageId = this.generateImageId(file);
            
            // 로컬 스토리지에 저장
            this.saveImageToStorage(imageId, compressedImage, file.name);
            
            // 동기화 브로드캐스트
            this.broadcastImageSync(imageId, compressedImage, file.name);
            
            console.log('✅ 이미지 처리 완료:', imageId);
            
        } catch (error) {
            console.error('❌ 이미지 처리 오류:', error);
        }
    }

    // 이미지 검증
    validateImage(file) {
        // 파일 크기 확인
        if (file.size > this.maxImageSize) {
            alert(`이미지 크기가 너무 큽니다. 최대 ${this.maxImageSize / 1024 / 1024}MB까지 가능합니다.`);
            return false;
        }

        // 파일 타입 확인
        if (!this.supportedTypes.includes(file.type)) {
            alert('지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 가능합니다.');
            return false;
        }

        return true;
    }

    // 이미지 압축
    async compressImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 캔버스 크기 설정 (최대 800px)
                const maxSize = 800;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // 이미지 그리기
                ctx.drawImage(img, 0, 0, width, height);

                // Base64로 변환
                const compressedDataUrl = canvas.toDataURL('image/jpeg', this.quality);
                resolve(compressedDataUrl);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 ID 생성
    generateImageId(file) {
        return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 로컬 스토리지에 이미지 저장
    saveImageToStorage(imageId, imageData, fileName) {
        const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
        images[imageId] = {
            data: imageData,
            fileName: fileName,
            timestamp: new Date().toISOString(),
            deviceId: this.getDeviceId()
        };
        
        localStorage.setItem('syncedImages', JSON.stringify(images));
        console.log('💾 이미지 저장됨:', imageId);
    }

    // 이미지 동기화 브로드캐스트
    broadcastImageSync(imageId, imageData, fileName) {
        const syncData = {
            type: 'imageSync',
            imageId: imageId,
            imageData: imageData,
            fileName: fileName,
            timestamp: new Date().toISOString(),
            deviceId: this.getDeviceId()
        };

        // localStorage를 통한 브로드캐스트
        localStorage.setItem('imageSyncBroadcast', JSON.stringify(syncData));
        
        // Custom Event 발생
        window.dispatchEvent(new CustomEvent('imageSync', {
            detail: syncData
        }));

        console.log('📡 이미지 동기화 브로드캐스트:', imageId);
    }

    // 이미지 동기화 처리
    handleImageSync(syncData) {
        if (syncData.deviceId === this.getDeviceId()) {
            return; // 자신의 디바이스에서 온 데이터는 무시
        }

        console.log('📡 이미지 동기화 수신:', syncData.imageId);
        
        // 이미지 저장
        this.saveImageToStorage(syncData.imageId, syncData.imageData, syncData.fileName);
        
        // UI 업데이트
        this.updateImageUI(syncData.imageId);
        
        // 알림 표시
        this.showNotification(`이미지 "${syncData.fileName}"이 동기화되었습니다`);
    }

    // 이미지 UI 업데이트
    updateImageUI(imageId) {
        // 이미지가 표시되는 모든 요소 업데이트
        const imageElements = document.querySelectorAll(`[data-image-id="${imageId}"]`);
        
        imageElements.forEach(element => {
            const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
            const imageData = images[imageId];
            
            if (imageData) {
                if (element.tagName === 'IMG') {
                    element.src = imageData.data;
                } else if (element.tagName === 'DIV') {
                    element.style.backgroundImage = `url(${imageData.data})`;
                }
            }
        });
    }

    // 이미지 가져오기
    getImage(imageId) {
        const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
        return images[imageId] || null;
    }

    // 모든 이미지 가져오기
    getAllImages() {
        return JSON.parse(localStorage.getItem('syncedImages') || '{}');
    }

    // 이미지 삭제
    deleteImage(imageId) {
        const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
        delete images[imageId];
        localStorage.setItem('syncedImages', JSON.stringify(images));
        
        // 삭제 브로드캐스트
        this.broadcastImageDelete(imageId);
        
        console.log('🗑️ 이미지 삭제됨:', imageId);
    }

    // 이미지 삭제 브로드캐스트
    broadcastImageDelete(imageId) {
        const syncData = {
            type: 'imageDelete',
            imageId: imageId,
            timestamp: new Date().toISOString(),
            deviceId: this.getDeviceId()
        };

        localStorage.setItem('imageDeleteBroadcast', JSON.stringify(syncData));
        
        window.dispatchEvent(new CustomEvent('imageDelete', {
            detail: syncData
        }));
    }

    // 디바이스 ID 가져오기
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // 알림 표시
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'image-sync-notification';
        notification.innerHTML = `
            <i class="fas fa-image"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4299e1;
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 이미지 동기화 상태 확인
    getSyncStatus() {
        const images = this.getAllImages();
        const imageCount = Object.keys(images).length;
        
        return {
            totalImages: imageCount,
            lastSync: localStorage.getItem('lastImageSync'),
            deviceId: this.getDeviceId()
        };
    }

    // 강제 이미지 동기화
    forceImageSync() {
        const images = this.getAllImages();
        
        Object.keys(images).forEach(imageId => {
            const imageData = images[imageId];
            this.broadcastImageSync(imageId, imageData.data, imageData.fileName);
        });
        
        this.showNotification('이미지 강제 동기화 완료');
    }

    // 이미지 동기화 초기화
    clearAllImages() {
        if (confirm('모든 이미지를 삭제하시겠습니까?')) {
            localStorage.removeItem('syncedImages');
            this.showNotification('모든 이미지가 삭제되었습니다');
        }
    }
}

// 전역 인스턴스 생성
window.imageSync = new ImageSync();

// 이미지 동기화 이벤트 리스너
window.addEventListener('imageSync', (event) => {
    console.log('📡 이미지 동기화 이벤트 수신:', event.detail);
    window.imageSync.handleImageSync(event.detail);
});

// 이미지 삭제 이벤트 리스너
window.addEventListener('imageDelete', (event) => {
    console.log('🗑️ 이미지 삭제 이벤트 수신:', event.detail);
    const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
    delete images[event.detail.imageId];
    localStorage.setItem('syncedImages', JSON.stringify(images));
});

// 로컬 스토리지 브로드캐스트 리스너
window.addEventListener('storage', (e) => {
    if (e.key === 'imageSyncBroadcast') {
        try {
            const syncData = JSON.parse(e.newValue);
            console.log('📡 이미지 동기화 브로드캐스트 수신:', syncData);
            window.imageSync.handleImageSync(syncData);
        } catch (error) {
            console.error('❌ 이미지 동기화 데이터 파싱 오류:', error);
        }
    } else if (e.key === 'imageDeleteBroadcast') {
        try {
            const deleteData = JSON.parse(e.newValue);
            console.log('🗑️ 이미지 삭제 브로드캐스트 수신:', deleteData);
            const images = JSON.parse(localStorage.getItem('syncedImages') || '{}');
            delete images[deleteData.imageId];
            localStorage.setItem('syncedImages', JSON.stringify(images));
        } catch (error) {
            console.error('❌ 이미지 삭제 데이터 파싱 오류:', error);
        }
    }
});

console.log('✅ 이미지 동기화 시스템 로드 완료'); 