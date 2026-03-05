// marketing-pitch/js/salepage.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for scroll animations (Fade-up)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));

    // 2. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3. Set default LMP date to ~20 weeks ago for demo
    const lmpInput = document.getElementById('lmp-date');
    if (lmpInput) {
        const demo = new Date();
        demo.setDate(demo.getDate() - 20 * 7);
        lmpInput.value = demo.toISOString().split('T')[0];
    }
});

// === BOOKING DEMO ENGINE ===

// Prenatal appointment milestones per medical protocol
const MILESTONES = [
    { week: 8, title: 'Khám thai lần đầu', desc: 'Siêu âm xác nhận tim thai, xét nghiệm máu cơ bản' },
    { week: 12, title: 'Sàng lọc quý 1', desc: 'Double Test, đo độ mờ da gáy (NT)' },
    { week: 16, title: 'Khám định kỳ', desc: 'Triple Test (nếu cần), theo dõi phát triển thai' },
    { week: 20, title: 'Siêu âm hình thái', desc: 'Siêu âm 4D, kiểm tra cấu trúc thai nhi' },
    { week: 24, title: 'Nghiệm pháp đường huyết', desc: 'Xét nghiệm tiểu đường thai kỳ (OGTT 75g)' },
    { week: 28, title: 'Khám quý 3', desc: 'Tiêm phòng uốn ván, xét nghiệm máu lần 2' },
    { week: 32, title: 'Siêu âm tăng trưởng', desc: 'Đánh giá cân nặng thai, vị trí nhau thai' },
    { week: 36, title: 'Khám tiền sản', desc: 'Xét nghiệm GBS, đánh giá ngôi thai, lập kế hoạch sinh' },
    { week: 38, title: 'Theo dõi cuối thai kỳ', desc: 'Monitor tim thai (NST), kiểm tra cổ tử cung' },
    { week: 40, title: 'Ngày dự sinh', desc: 'Đánh giá tình trạng, quyết định chờ sinh hay can thiệp' }
];

const CLINIC_NAME = 'Phòng Khám An Sinh';
const CLINIC_ADDRESS = '416 Minh Khai, Đồng Nguyên, Từ Sơn, Bắc Ninh';

function formatDateVN(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function formatDateISO(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function calculateSchedule() {
    const lmpInput = document.getElementById('lmp-date');
    if (!lmpInput || !lmpInput.value) {
        alert('Vui lòng nhập ngày kinh cuối.');
        return;
    }

    const lmp = new Date(lmpInput.value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Due date = LMP + 280 days
    const dueDate = new Date(lmp);
    dueDate.setDate(dueDate.getDate() + 280);

    // Current gestational age
    const diffMs = today - lmp;
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;

    // Trimester
    let trimester = 'Quý 1';
    if (weeks >= 28) trimester = 'Quý 3';
    else if (weeks >= 13) trimester = 'Quý 2';

    // Update UI
    document.getElementById('result-week').textContent = weeks;
    document.getElementById('result-day').textContent = `${days} ngày`;
    document.getElementById('result-due').textContent = formatDateVN(dueDate);
    document.getElementById('result-trimester').textContent = trimester;

    // Build appointment list
    const listEl = document.getElementById('appointment-list');
    listEl.innerHTML = '';

    // Store global for "Add all" actions
    window._appointments = [];

    MILESTONES.forEach((m, i) => {
        const apptDate = new Date(lmp);
        apptDate.setDate(apptDate.getDate() + m.week * 7);

        const isPast = apptDate < today;
        const isNext = !isPast && (i === 0 || new Date(lmp.getTime() + MILESTONES[i - 1].week * 7 * 86400000) < today);

        window._appointments.push({
            ...m,
            date: apptDate,
            dateISO: formatDateISO(apptDate),
            dateVN: formatDateVN(apptDate)
        });

        const statusClass = isPast
            ? 'border-slate-100 bg-slate-50 opacity-60'
            : isNext
                ? 'border-primary/30 bg-primary-light/20 ring-1 ring-primary/10'
                : 'border-slate-100 bg-white';

        const badge = isPast
            ? '<span class="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-medium">Đã qua</span>'
            : isNext
                ? '<span class="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-medium animate-pulse">Sắp tới</span>'
                : '';

        const card = document.createElement('div');
        card.className = `rounded-xl border p-4 ${statusClass} transition-all`;
        card.style.animationDelay = `${i * 60}ms`;
        card.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 ${isPast ? 'bg-slate-300' : 'bg-primary'} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        T${m.week}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="font-bold text-slate-900 text-sm">${m.title}</p>
                            ${badge}
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">${m.desc}</p>
                        <p class="text-xs text-slate-500 mt-1 font-medium">📅 ${formatDateVN(apptDate)}</p>
                    </div>
                </div>
                ${!isPast ? `
                <div class="flex gap-2 flex-shrink-0">
                    <button onclick="addToGoogleCal(${i})" title="Google Calendar" class="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors cursor-pointer text-slate-400">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    </button>
                    <button onclick="downloadICS(${i})" title="Apple Calendar (.ics)" class="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:border-slate-900 hover:text-slate-900 transition-colors cursor-pointer text-slate-400">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        listEl.appendChild(card);
    });

    // Show results with animation
    const resultsEl = document.getElementById('booking-results');
    resultsEl.classList.remove('hidden');
    resultsEl.style.opacity = '0';
    resultsEl.style.transform = 'translateY(20px)';
    requestAnimationFrame(() => {
        resultsEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        resultsEl.style.opacity = '1';
        resultsEl.style.transform = 'translateY(0)';
    });

    // Scroll to results
    setTimeout(() => {
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
}

// === GOOGLE CALENDAR ===

function buildGoogleCalUrl(appt) {
    const startDate = appt.dateISO;
    const endDate = appt.dateISO; // all-day event
    const title = encodeURIComponent(`${appt.title} — ${CLINIC_NAME}`);
    const details = encodeURIComponent(`${appt.desc}\n\nTuần thai: ${appt.week}\nPhòng khám: ${CLINIC_NAME}\nĐịa chỉ: ${CLINIC_ADDRESS}\n\nLịch khám được tạo tự động từ website.`);
    const location = encodeURIComponent(`${CLINIC_NAME}, ${CLINIC_ADDRESS}`);

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

function addToGoogleCal(index) {
    const appt = window._appointments[index];
    if (!appt) return;
    window.open(buildGoogleCalUrl(appt), '_blank');
}

function addAllToGoogleCal() {
    if (!window._appointments) return;
    const future = window._appointments.filter(a => a.date >= new Date());
    if (future.length === 0) {
        alert('Không có lịch khám sắp tới nào.');
        return;
    }
    // Open first, prompt for rest
    window.open(buildGoogleCalUrl(future[0]), '_blank');
    if (future.length > 1) {
        setTimeout(() => {
            if (confirm(`Đã mở lịch khám "${future[0].title}". Tiếp tục thêm ${future.length - 1} lịch khám còn lại?`)) {
                future.slice(1).forEach((a, i) => {
                    setTimeout(() => window.open(buildGoogleCalUrl(a), '_blank'), i * 800);
                });
            }
        }, 1000);
    }
}

// === APPLE CALENDAR (.ics) ===

function buildICSContent(appointments) {
    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TodyAI Medical//Lich Kham Thai//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Lịch Khám Thai - ' + CLINIC_NAME,
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh'
    ];

    appointments.forEach(appt => {
        const uid = `${appt.dateISO}-week${appt.week}@todyai.medical`;
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics.push(
            'BEGIN:VEVENT',
            `DTSTART;VALUE=DATE:${appt.dateISO}`,
            `DTEND;VALUE=DATE:${appt.dateISO}`,
            `DTSTAMP:${now}`,
            `UID:${uid}`,
            `SUMMARY:${appt.title} — ${CLINIC_NAME}`,
            `DESCRIPTION:${appt.desc}\\nTuần thai: ${appt.week}\\n${CLINIC_NAME}\\nĐịa chỉ: ${CLINIC_ADDRESS}`,
            `LOCATION:${CLINIC_NAME}\\, ${CLINIC_ADDRESS}`,
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            `DESCRIPTION:Nhắc lịch khám: ${appt.title}`,
            'END:VALARM',
            'BEGIN:VALARM',
            'TRIGGER:-PT2H',
            'ACTION:DISPLAY',
            `DESCRIPTION:Lịch khám hôm nay: ${appt.title}`,
            'END:VALARM',
            'END:VEVENT'
        );
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
}

function triggerICSDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadICS(index) {
    const appt = window._appointments[index];
    if (!appt) return;
    const content = buildICSContent([appt]);
    triggerICSDownload(content, `lich-kham-tuan-${appt.week}.ics`);
}

function downloadAllICS() {
    if (!window._appointments) return;
    const future = window._appointments.filter(a => a.date >= new Date());
    if (future.length === 0) {
        alert('Không có lịch khám sắp tới nào.');
        return;
    }
    const content = buildICSContent(future);
    triggerICSDownload(content, `lich-kham-thai-${CLINIC_NAME.replace(/\s+/g, '-')}.ics`);
}
