// 템플릿 및 패키지 관리 시스템
class TemplateManager {
    constructor() {
        this.templates = {
            basic: {
                name: '기본 기록 템플릿',
                price: 0,
                type: 'free',
                description: '무료로 다운로드 가능한 기본 템플릿'
            },
            notion: {
                name: 'Notion 개체 기록 템플릿',
                price: 19900,
                type: 'paid',
                description: 'Notion을 활용한 체계적인 크레스티드 게코 개체 관리 템플릿'
            },
            sheets: {
                name: 'Google Sheets 브리딩 계획',
                price: 14900,
                type: 'paid',
                description: 'Google Sheets로 만든 전문적인 브리딩 계획 및 관리 시트'
            },
            certificate: {
                name: '입양증/리포트 자동 생성기',
                price: 29900,
                type: 'premium',
                description: '개체 정보를 입력하면 자동으로 입양증과 리포트를 생성하는 도구'
            },
            local: {
                name: '전체 시스템 로컬 버전',
                price: 99900,
                type: 'premium',
                description: '인터넷 없이도 사용할 수 있는 완전한 로컬 버전'
            },
            analytics: {
                name: '고급 분석 패키지',
                price: 49900,
                type: 'premium',
                description: '전문적인 브리딩 분석과 예측을 위한 고급 도구 모음'
            },
            education: {
                name: '브리딩 교육 패키지',
                price: 39900,
                type: 'paid',
                description: '크레스티드 게코 브리딩을 위한 완전한 교육 자료'
            }
        };
    }
    
    // 템플릿 다운로드 (무료)
    downloadTemplate(templateId) {
        const template = this.templates[templateId];
        if (!template) {
            alert('템플릿을 찾을 수 없습니다.');
            return;
        }
        
        if (template.type !== 'free') {
            alert('이 템플릿은 구매 후 다운로드할 수 있습니다.');
            return;
        }
        
        // 다운로드 시뮬레이션
        this.simulateDownload(template);
    }
    
    // 템플릿 구매
    purchaseTemplate(templateId) {
        const template = this.templates[templateId];
        if (!template) {
            alert('템플릿을 찾을 수 없습니다.');
            return;
        }
        
        if (template.type === 'free') {
            this.downloadTemplate(templateId);
            return;
        }
        
        // 구매 확인
        const confirmPurchase = confirm(
            `${template.name}\n\n` +
            `가격: ₩${template.price.toLocaleString()}\n` +
            `설명: ${template.description}\n\n` +
            `구매하시겠습니까?`
        );
        
        if (confirmPurchase) {
            this.processTemplatePurchase(template);
        }
    }
    
    // 구매 처리 시뮬레이션
    processTemplatePurchase(template) {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '구매 처리 중...';
        button.disabled = true;
        
        // 구매 처리 시뮬레이션 (2초)
        setTimeout(() => {
            button.textContent = '구매 완료!';
            button.style.background = '#28a745';
            
            setTimeout(() => {
                alert(`${template.name} 구매가 완료되었습니다!\n\n다운로드 링크가 이메일로 전송됩니다.`);
                this.simulateDownload(template);
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 1000);
            
        }, 2000);
    }
    
    // 다운로드 시뮬레이션
    simulateDownload(template) {
        // 다운로드 링크 생성 (실제로는 서버에서 파일 제공)
        const downloadLink = document.createElement('a');
        downloadLink.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
            `${template.name}\n\n` +
            `설명: ${template.description}\n` +
            `다운로드 날짜: ${new Date().toLocaleDateString()}\n\n` +
            `이 파일은 시뮬레이션용입니다. 실제 템플릿은 구매 후 제공됩니다.`
        )}`;
        downloadLink.download = `${template.name.replace(/\s+/g, '_')}.txt`;
        downloadLink.click();
        
        alert(`${template.name} 다운로드가 시작되었습니다!`);
    }
    
    // 구매한 템플릿 목록 가져오기
    getPurchasedTemplates() {
        const purchased = localStorage.getItem('purchasedTemplates');
        return purchased ? JSON.parse(purchased) : [];
    }
    
    // 템플릿 구매 기록 저장
    savePurchase(templateId) {
        const purchased = this.getPurchasedTemplates();
        purchased.push({
            id: templateId,
            name: this.templates[templateId].name,
            purchasedAt: new Date().toISOString(),
            price: this.templates[templateId].price
        });
        localStorage.setItem('purchasedTemplates', JSON.stringify(purchased));
    }
}

// 전역 템플릿 매니저 인스턴스
const templateManager = new TemplateManager();

// 템플릿 다운로드 함수 (전역으로 노출)
function downloadTemplate(templateId) {
    templateManager.downloadTemplate(templateId);
}

// 템플릿 구매 함수 (전역으로 노출)
function purchaseTemplate(templateId) {
    templateManager.purchaseTemplate(templateId);
}

// 페이지 로드 시 구매한 템플릿 표시
document.addEventListener('DOMContentLoaded', function() {
    const purchasedTemplates = templateManager.getPurchasedTemplates();
    
    if (purchasedTemplates.length > 0) {
        // 구매한 템플릿이 있으면 표시
        const purchasedSection = document.createElement('div');
        purchasedSection.className = 'preview-section';
        purchasedSection.innerHTML = `
            <h2>구매한 템플릿</h2>
            <div class="preview-grid">
                ${purchasedTemplates.map(template => `
                    <div class="preview-item">
                        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                        <h4>${template.name}</h4>
                        <p>구매일: ${new Date(template.purchasedAt).toLocaleDateString()}</p>
                        <button onclick="downloadTemplate('${template.id}')" class="btn btn-secondary btn-sm">다운로드</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // 첫 번째 섹션 뒤에 삽입
        const firstSection = document.querySelector('.preview-section');
        firstSection.parentNode.insertBefore(purchasedSection, firstSection.nextSibling);
    }
}); 