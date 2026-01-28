// Wipe Timer - Countdown to next server wipe
document.addEventListener('DOMContentLoaded', () => {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const wipeProgressEl = document.getElementById('wipeProgress');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    let timerIntervalId = null;

    // Configuration
    const WIPE_CONFIG = {
        // Wipe happens at 00:00 Moscow time (UTC+3)
        // January 23, 2026
        referenceWipeDate: new Date('2026-01-24T00:00:00+03:00'),
        // Wipe interval in days (every 2 weeks = 14 days)
        wipeIntervalDays: 14
    };

    // Calculate next wipe date (always Saturday at 00:00 MSK = night from Friday to Saturday)
    function getNextWipeDate() {
        const now = new Date();
        let nextWipe = new Date(WIPE_CONFIG.referenceWipeDate);

        // If reference date is in the future, go back to find the cycle start
        while (nextWipe > now) {
            nextWipe.setDate(nextWipe.getDate() - WIPE_CONFIG.wipeIntervalDays);
        }

        // Now go forward to find the next wipe
        while (nextWipe <= now) {
            nextWipe.setDate(nextWipe.getDate() + WIPE_CONFIG.wipeIntervalDays);
        }

        return nextWipe;
    }

    // Calculate previous wipe date (for progress bar)
    function getPreviousWipeDate() {
        const nextWipe = getNextWipeDate();
        const prevWipe = new Date(nextWipe);
        prevWipe.setDate(prevWipe.getDate() - WIPE_CONFIG.wipeIntervalDays);
        return prevWipe;
    }

    // Calculate progress percentage
    function getWipeProgress() {
        const now = new Date();
        const prevWipe = getPreviousWipeDate();
        const nextWipe = getNextWipeDate();

        const totalTime = nextWipe - prevWipe;
        const elapsedTime = now - prevWipe;

        return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    }

    // Format date for display
    function formatWipeDate(date) {
        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];

        const weekDays = [
            'воскресенье', 'понедельник', 'вторник', 'среда',
            'четверг', 'пятница', 'суббота'
        ];

        const dayOfWeek = weekDays[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${dayOfWeek}, ${day} ${month} ${year} в ${hours}:${minutes}`;
    }

    // Update timer display
    function updateTimer() {
        const nextWipe = getNextWipeDate();
        const now = new Date();
        const diff = nextWipe - now;

        if (diff <= 0) {
            // Wipe just happened, recalculate
            setTimeout(updateTimer, 1000);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Update display with leading zeros
        const newDays = days.toString().padStart(2, '0');
        const newHours = hours.toString().padStart(2, '0');
        const newMinutes = minutes.toString().padStart(2, '0');
        const newSeconds = seconds.toString().padStart(2, '0');

        // Animate changes
        if (daysEl.textContent !== newDays) {
            animateChange(daysEl);
            daysEl.textContent = newDays;
        }
        if (hoursEl.textContent !== newHours) {
            animateChange(hoursEl);
            hoursEl.textContent = newHours;
        }
        if (minutesEl.textContent !== newMinutes) {
            animateChange(minutesEl);
            minutesEl.textContent = newMinutes;
        }
        if (secondsEl.textContent !== newSeconds) {
            animateChange(secondsEl);
            secondsEl.textContent = newSeconds;
        }


        // Update progress bar
        if (wipeProgressEl) {
            const progress = getWipeProgress();
            wipeProgressEl.style.width = `${progress}%`;
        }

    }

    // Add brief animation to element
    function animateChange(element) {
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 100);
    }

    // Initial update
    updateTimer();

    // Update every second
    timerIntervalId = setInterval(updateTimer, 1000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
        }
    });
});
