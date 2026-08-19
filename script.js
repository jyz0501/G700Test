const CORRECT_WEIGHT = 20250830;

let isRealTime = true;
let customDateTime = null;
let currentTimezoneOffset = 8;

function getNowWithTimezone() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + currentTimezoneOffset * 3600000);
}

function getCurrentDateTime() {
    let date;
    
    if (isRealTime) {
        date = getNowWithTimezone();
    } else if (customDateTime) {
        date = customDateTime;
    } else {
        date = getNowWithTimezone();
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return {
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
        dateStr: `${year}-${month}-${day}`,
        timeStr: `${hours}:${minutes}:${seconds}`,
        mmddhh: parseInt(`${month}${day}${hours}`)
    };
}

function generateWeightNumbers() {
    const weights = [];
    const startYear = 2024;
    const startMonth = 7;
    const endYear = 2026;
    const endMonth = 6;
    
    for (let year = startYear; year <= endYear; year++) {
        const startM = year === startYear ? startMonth : 1;
        const endM = year === endYear ? endMonth : 12;
        
        for (let month = startM; month <= endM; month++) {
            const weight = parseInt(`${year}${String(month).padStart(2, '0')}30`);
            weights.push(weight);
        }
    }
    
    return weights;
}

function calculatePassword(mmddhh, hours, weight) {
    const product = mmddhh * weight;
    const lastSix = parseInt(String(product).slice(-6));
    const password = lastSix - parseInt(hours);
    return `*#${password}#*`;
}

function renderFixedPasswords() {
    const mmddhh = parseInt('010100');
    const hours = '00';
    const weights = generateWeightNumbers();
    const grid = document.getElementById('fixed-passwords-grid');

    const seen = new Set();
    const uniquePasswords = [];

    weights.forEach(weight => {
        const password = calculatePassword(mmddhh, hours, weight);
        if (!seen.has(password)) {
            seen.add(password);
            uniquePasswords.push({ password, weight });
        }
    });

    let html = '';
    uniquePasswords.forEach(item => {
        const isCorrect = item.weight === CORRECT_WEIGHT || calculatePassword(mmddhh, hours, CORRECT_WEIGHT) === item.password;
        html += `
            <div class="password-card ${isCorrect ? 'correct' : ''}" data-password="${item.password}">
                <div class="password-value">${item.password}</div>
                <div class="password-hint">点击复制密码</div>
            </div>
        `;
    });

    grid.innerHTML = html;

    const fixedDateEl = document.getElementById('fixed-array-date');
    if (fixedDateEl) {
        fixedDateEl.textContent = '阵列计算时间 01-01 00:00:00';
    }

    grid.querySelectorAll('.password-card').forEach(card => {
        card.addEventListener('click', function() {
            const password = this.dataset.password;
            navigator.clipboard.writeText(password).then(() => {
                this.classList.add('copied');
                setTimeout(() => { this.classList.remove('copied'); }, 2000);
            }).catch(err => { console.error('复制失败:', err); });
        });
    });
}

function renderPasswords() {
    const dt = getCurrentDateTime();
    const weights = generateWeightNumbers();
    const grid = document.getElementById('passwords-grid');
    
    let html = '';
    weights.forEach((weight, index) => {
        const password = calculatePassword(dt.mmddhh, dt.hours, weight);
        const isCorrect = weight === CORRECT_WEIGHT;
        html += `
            <div class="password-card ${isCorrect ? 'correct' : ''}" data-password="${password}" data-index="${index}">
                <div class="password-value">${password}</div>
                <div class="password-hint">点击复制密码</div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
    
    document.querySelectorAll('.password-card').forEach(card => {
        card.addEventListener('click', function() {
            const password = this.dataset.password;
            navigator.clipboard.writeText(password).then(() => {
                this.classList.add('copied');
                setTimeout(() => {
                    this.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('复制失败:', err);
            });
        });
    });
}

function updateDisplay() {
    const dt = getCurrentDateTime();
    
    document.getElementById('display-date').textContent = dt.dateStr;
    document.getElementById('display-time').textContent = dt.timeStr;
    
    const tzSign = currentTimezoneOffset >= 0 ? '+' : '';
    document.querySelector('.time-zone-badge').textContent = `UTC${tzSign}${currentTimezoneOffset}`;
    
    const arrayDateEl = document.getElementById('array-date');
    if (arrayDateEl) {
        arrayDateEl.textContent = `阵列计算时间 ${dt.dateStr} ${dt.timeStr} · UTC${tzSign}${currentTimezoneOffset}`;
    }
    
    const password = calculatePassword(dt.mmddhh, dt.hours, CORRECT_WEIGHT);
    document.getElementById('final-password').textContent = password;
    
    renderPasswords();
}

function copyFinalPassword() {
    const password = document.getElementById('final-password').textContent;
    navigator.clipboard.writeText(password).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">已复制</span>';
        btn.style.background = 'linear-gradient(135deg, #00FF88, #00C8FF)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

function initCustomDateTime() {
    const now = getNowWithTimezone();
    document.getElementById('date-input').value = now.toISOString().split('T')[0];
    document.getElementById('time-input').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function updateCustomDateTime() {
    const dateStr = document.getElementById('date-input').value;
    const timeStr = document.getElementById('time-input').value;
    
    if (dateStr && timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const [year, month, day] = dateStr.split('-').map(Number);
        
        const localOffset = new Date().getTimezoneOffset() * 60000;
        customDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds) + localOffset);
        updateDisplay();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initCustomDateTime();
    updateDisplay();
    renderFixedPasswords();
    
    let intervalId = setInterval(updateDisplay, 1000);
    
    document.getElementById('toggle-real-time').addEventListener('click', function() {
        isRealTime = true;
        document.getElementById('toggle-real-time').classList.add('active');
        document.getElementById('toggle-custom-time').classList.remove('active');
        document.getElementById('custom-controls').style.opacity = '0.5';
        document.getElementById('custom-controls').style.pointerEvents = 'none';
        
        clearInterval(intervalId);
        intervalId = setInterval(updateDisplay, 1000);
        updateDisplay();
    });
    
    document.getElementById('toggle-custom-time').addEventListener('click', function() {
        isRealTime = false;
        document.getElementById('toggle-real-time').classList.remove('active');
        document.getElementById('toggle-custom-time').classList.add('active');
        document.getElementById('custom-controls').style.opacity = '1';
        document.getElementById('custom-controls').style.pointerEvents = 'auto';
        
        clearInterval(intervalId);
        updateCustomDateTime();
    });
    
    document.getElementById('date-input').addEventListener('change', updateCustomDateTime);
    document.getElementById('time-input').addEventListener('change', updateCustomDateTime);
    
    document.getElementById('timezone-select').addEventListener('change', function() {
        currentTimezoneOffset = parseInt(this.value);
        initCustomDateTime();
        updateCustomDateTime();
    });
    
    document.getElementById('copy-btn').addEventListener('click', copyFinalPassword);

    document.querySelectorAll('.page-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const pageId = this.dataset.page;
            document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
            document.getElementById('page-' + pageId).style.display = 'block';
        });
    });
});