// 광고 슬롯 관리 시스템
class AdSlotManager {
    constructor() {
        this.adSlots = {
            'top-banner': {
                name: '상단 배너형 광고',
                price: 299000,
                size: '728 x 90px',
                impressions: '10,000+',
                ctr: '2.5%',
                description: '모든 페이지 상단에 노출되는 배너 광고'
            },
            'sidebar': {
                name: '사이드바 광고',
                price: 199000,
                size: '300 x 250px',
                impressions: '8,000+',
                ctr: '3.2%',
                description: '메인 페이지 우측에 고정 노출되는 광고'
            },
            'card-banner': {
                name: '개체 카드 사이 배너',
                price: 399000,
                size: '728 x 90px',
                impressions: '15,000+',
                ctr: '4.1%',
                description: '개체 목록 중간에 노출되는 고효율 광고'
            },
            'calculator': {
                name: '모프 계산기 하단 광고',
                price: 499000,
                size: '728 x 90px',
                impressions: '12,000+',
                ctr: '5.3%',
                description: '모프 계산기 페이지에 노출되는 최고 전환율 광고'
            },
            'tree': {
                name: '혈통 트리 광고',
                price: 349000,
                size: '300 x 600px',
                impressions: '6,000+',
                ctr: '3.8%',
                description: '혈통 트리 페이지에 노출되는 세로형 배너'
            },
            'email': {
                name: '이메일 뉴스레터 광고',
                price: 599000,
                size: '600 x 200px',
                impressions: '5,000+',
                ctr: '6.2%',
                description: '주간 뉴스레터에 포함되는 직접 마케팅 광고'
            }
        };
    }
    
    // 광고 슬롯 구매
    purchaseAdSlot(slotId) {
        const adSlot = this.adSlots[slotId];
        if (!adSlot) {
            alert('광고 슬롯을 찾을 수 없습니다.');
            return;
        }
        
        // 구매 확인
        const confirmPurchase = confirm(
            `${adSlot.name}\n\n` +
            `가격: ₩${adSlot.price.toLocaleString()}/월\n` +
            `크기: ${adSlot.size}\n` +
            `월간 노출: ${adSlot.impressions}\n` +
            `평균 CTR: ${adSlot.ctr}\n\n` +
            `구매하시겠습니까?`
        );
        
        if (confirmPurchase) {
            this.processAdPurchase(adSlot);
        }
    }
    
    // 광고 구매 처리 시뮬레이션
    processAdPurchase(adSlot) {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '구매 처리 중...';
        button.disabled = true;
        
        // 구매 처리 시뮬레이션 (3초)
        setTimeout(() => {
            button.textContent = '구매 완료!';
            button.style.background = '#28a745';
            
            setTimeout(() => {
                this.showAdPurchaseModal(adSlot);
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 1000);
            
        }, 3000);
    }
    
    // 광고 구매 완료 모달
    showAdPurchaseModal(adSlot) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
                <h3 style="margin-bottom: 20px; color: var(--primary-color);">
                    <i class="fas fa-check-circle"></i> 광고 구매 완료
                </h3>
                <div style="margin-bottom: 20px;">
                    <h4>${adSlot.name}</h4>
                    <p style="color: #666; margin-bottom: 15px;">${adSlot.description}</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p><strong>가격:</strong> ₩${adSlot.price.toLocaleString()}/월</p>
                        <p><strong>크기:</strong> ${adSlot.size}</p>
                        <p><strong>월간 노출:</strong> ${adSlot.impressions}</p>
                        <p><strong>평균 CTR:</strong> ${adSlot.ctr}</p>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h5>다음 단계:</h5>
                    <ul style="margin-left: 20px; color: #555;">
                        <li>광고 소재 제작 (이미지/동영상)</li>
                        <li>광고 문구 및 링크 설정</li>
                        <li>노출 시작일 설정</li>
                        <li>성과 추적 계정 생성</li>
                    </ul>
                </div>
                <div style="text-align: center;">
                    <p style="margin-bottom: 15px; font-weight: 600;">
                        문의: <a href="mailto:ads@geckobreeding.com" style="color: var(--primary-color);">ads@geckobreeding.com</a>
                    </p>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-primary">
                        확인
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // 광고 성과 통계 가져오기
    getAdStats(slotId) {
        // 실제로는 서버에서 데이터를 가져옴
        return {
            impressions: Math.floor(Math.random() * 5000) + 5000,
            clicks: Math.floor(Math.random() * 200) + 50,
            ctr: (Math.random() * 3 + 2).toFixed(1),
            revenue: Math.floor(Math.random() * 1000000) + 500000
        };
    }
    
    // 광고 슬롯 가용성 확인
    checkAvailability(slotId) {
        const bookedSlots = JSON.parse(localStorage.getItem('bookedAdSlots') || '[]');
        return !bookedSlots.includes(slotId);
    }
    
    // 광고 슬롯 예약
    bookAdSlot(slotId, advertiserInfo) {
        const bookedSlots = JSON.parse(localStorage.getItem('bookedAdSlots') || '[]');
        bookedSlots.push({
            slotId,
            advertiserInfo,
            bookedAt: new Date().toISOString(),
            startDate: advertiserInfo.startDate,
            endDate: advertiserInfo.endDate
        });
        localStorage.setItem('bookedAdSlots', JSON.stringify(bookedSlots));
    }
}

// 전역 광고 슬롯 매니저 인스턴스
const adSlotManager = new AdSlotManager();

// 광고 슬롯 구매 함수 (전역으로 노출)
function purchaseAdSlot(slotId) {
    adSlotManager.purchaseAdSlot(slotId);
}

// 광고 문의 함수
function contactAdSales() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
            <h3 style="margin-bottom: 20px; color: var(--primary-color);">
                <i class="fas fa-envelope"></i> 광고 문의
            </h3>
            <p style="margin-bottom: 20px; color: #666;">
                맞춤형 광고 상담을 원하시면 연락주세요.
            </p>
            <div style="margin-bottom: 20px;">
                <h4>문의 방법:</h4>
                <ul style="margin-left: 20px; color: #555;">
                    <li>이메일: ads@geckobreeding.com</li>
                    <li>전화: 02-1234-5678</li>
                    <li>카카오톡: @geckobreeding</li>
                </ul>
            </div>
            <div style="text-align: center;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-primary">
                    닫기
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 페이지 로드 시 광고 슬롯 가용성 확인
document.addEventListener('DOMContentLoaded', function() {
    // 각 광고 슬롯의 가용성 표시
    const adSlots = document.querySelectorAll('.ad-slot');
    adSlots.forEach(slot => {
        const button = slot.querySelector('button');
        const slotId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        
        if (!adSlotManager.checkAvailability(slotId)) {
            button.textContent = '예약 완료';
            button.disabled = true;
            button.style.background = '#6c757d';
            slot.style.opacity = '0.7';
        }
    });
}); 