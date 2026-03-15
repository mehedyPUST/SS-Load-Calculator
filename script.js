(function () {
    "use strict";

    // --- Configuration constants ---
    const CONFIG = {
        VOLTAGE_FACTOR: 18,        // Conversion factor for A to MW (33/11 kV)
        BOTTAIL_FEEDERS: [1, 2, 8, 9], // Indices (1-based) that belong to Bottail
        FEEDER_COUNT: 9,
        TIMEZONE: 'Asia/Dhaka'
    };

    // --- DOM element cache ---
    const elements = {
        date: document.getElementById('date'),
        time: document.getElementById('time'),
        bottailBox: document.getElementById('bottail-box'),
        totalBox: document.getElementById('total-box'),
        calculateBtn: document.getElementById('calculateBtn'),
        copyBtn: document.getElementById('copyBtn'),
        inputs: [],
        outputs: []
    };

    // --- Initialize the application ---
    function init() {
        cacheInputsAndOutputs();
        attachEventListeners();
        startClock();
        disableNumberInputScroll();
    }

    // --- Cache DOM elements for better performance ---
    function cacheInputsAndOutputs() {
        for (let i = 1; i <= CONFIG.FEEDER_COUNT; i++) {
            elements.inputs[i] = document.getElementById(`i${i}`);
            elements.outputs[i] = document.getElementById(`o${i}`);
        }
    }

    // --- Attach event listeners ---
    function attachEventListeners() {
        if (elements.calculateBtn) {
            elements.calculateBtn.addEventListener('click', calculateWithFeedback);
        }

        if (elements.copyBtn) {
            elements.copyBtn.addEventListener('click', copyTotal);
        }

        // Also allow calculation on Enter key in any input
        for (let i = 1; i <= CONFIG.FEEDER_COUNT; i++) {
            const input = elements.inputs[i];
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        calculate();
                    }
                });
            }
        }
    }

    // --- Core calculation logic ---
    function calculate() {
        let total = 0;
        let bottail = 0;

        // Calculate individual feeder values
        for (let i = 1; i <= CONFIG.FEEDER_COUNT; i++) {
            const inputElement = elements.inputs[i];
            if (!inputElement) continue;

            const inputValue = parseFloat(inputElement.value) || 0;
            const result = inputValue / CONFIG.VOLTAGE_FACTOR;

            if (elements.outputs[i]) {
                elements.outputs[i].innerText = result.toFixed(1) + ' MW';
            }

            total += result;

            if (CONFIG.BOTTAIL_FEEDERS.includes(i)) {
                bottail += result;
            }
        }

        // Update summary boxes
        if (elements.bottailBox) {
            elements.bottailBox.innerText = `Bottail: ${bottail.toFixed(1)} MW`;
        }

        if (elements.totalBox) {
            elements.totalBox.innerText = `Total: ${total.toFixed(1)} MW`;
        }

        return { total, bottail };
    }

    // --- Calculate button with visual feedback ---
    function calculateWithFeedback(event) {
        event?.preventDefault();

        calculate();

        const btn = elements.calculateBtn;
        if (!btn) return;

        const originalText = btn.innerText;
        btn.innerText = '✔ Success';
        btn.classList.remove('hover:bg-blue-700');
        btn.classList.add('hover:bg-cyan-700');
        btn.style.background = '#17a2b8';

        setTimeout(() => {
            btn.innerText = 'Calculate';
            btn.style.background = '';
            btn.classList.remove('hover:bg-cyan-700');
            btn.classList.add('hover:bg-blue-700');
        }, 2000);
    }

    // --- Copy total with feedback ---
    function copyTotal(event) {
        event?.preventDefault();

        if (!elements.totalBox) return;

        const totalText = elements.totalBox.innerText;
        const totalValue = parseFloat(totalText.split(':')[1]) || 0;
        const roundedTotal = Math.round(totalValue);
        const textToCopy = `Bottail : ${roundedTotal} MW`;

        const btn = elements.copyBtn;
        if (!btn) return;

        // Success feedback function
        const showSuccess = () => {
            btn.innerText = '✔ Copied';
            btn.style.background = '#17a2b8';

            setTimeout(() => {
                btn.innerText = 'Copy Total';
                btn.style.background = '#28a745';
            }, 2000);
        };

        // Fallback copy method for older browsers
        const fallbackCopy = () => {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);

            try {
                textarea.select();
                document.execCommand('copy');
                showSuccess();
            } catch (err) {
                alert('Please manually copy: ' + textToCopy);
            } finally {
                document.body.removeChild(textarea);
            }
        };

        // Try modern clipboard API first
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(showSuccess)
                .catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    }

    // --- Clock functionality ---
    function updateClock() {
        const now = new Date();

        if (elements.date) {
            elements.date.innerText = now.toLocaleDateString('en-US', {
                timeZone: CONFIG.TIMEZONE,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (elements.time) {
            elements.time.innerText = now.toLocaleTimeString('en-US', {
                timeZone: CONFIG.TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        }
    }

    function startClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }

    // --- Disable wheel and arrow keys on number inputs ---
    function disableNumberInputScroll() {
        for (let i = 1; i <= CONFIG.FEEDER_COUNT; i++) {
            const input = elements.inputs[i];
            if (!input) continue;

            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                }
            });

            input.addEventListener('wheel', (e) => {
                e.preventDefault();
            }, { passive: false });
        }
    }

    // --- Initialize when DOM is ready ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();