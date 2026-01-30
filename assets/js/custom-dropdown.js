/**
 * Global Custom Dropdown System
 * Converts standard <select> elements into styled dropdowns.
 */

function initCustomDropdowns() {
    document.querySelectorAll('select').forEach(select => {
        // Skip if specifically marked to ignore
        if (select.classList.contains('no-custom')) return;

        // Skip if already initialized, just update
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-wrapper')) {
            updateCustomDropdownOptions(select);
        } else {
            setupCustomDropdown(select);
        }
    });
}

function setupCustomDropdown(select) {
    // 1. Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';

    // Copy ID for easier targeting if needed (optional)
    if (select.id) wrapper.id = select.id + 'Wrapper';

    // 2. Create Custom UI
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select__trigger';
    const selectedOption = select.options[select.selectedIndex];
    const initialText = selectedOption ? selectedOption.textContent : 'Select...';
    trigger.innerHTML = `<span>${initialText}</span>`;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-options';

    customSelect.appendChild(trigger);
    customSelect.appendChild(optionsContainer);
    wrapper.appendChild(customSelect);

    // 3. Insert after select and hide select
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    select.style.display = 'none';

    // 4. Populate Options
    populateOptions(select, optionsContainer, trigger);

    // 5. Event Listeners

    // Toggle
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close others
        document.querySelectorAll('.custom-select').forEach(el => {
            if (el !== customSelect) el.classList.remove('open');
        });
        customSelect.classList.toggle('open');
    });

    // Listen for native select changes (programmatic or otherwise)
    select.addEventListener('change', () => {
        const selected = select.options[select.selectedIndex];
        if (selected) {
            trigger.querySelector('span').textContent = selected.textContent;
            // Update highlight
            optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
                if (opt.dataset.value === select.value) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
    });
}

function populateOptions(select, container, trigger) {
    container.innerHTML = '';
    Array.from(select.options).forEach(opt => {
        const div = document.createElement('div');
        div.className = 'custom-option';
        if (opt.selected) div.classList.add('selected');
        div.textContent = opt.textContent;
        div.dataset.value = opt.value;

        div.addEventListener('click', (e) => {
            e.stopPropagation();

            // Update native select
            select.value = opt.value;

            // Trigger change event manually
            select.dispatchEvent(new Event('change'));

            // Close dropdown
            container.parentElement.classList.remove('open');
        });

        container.appendChild(div);
    });
}

function updateCustomDropdownOptions(select) {
    const wrapper = select.nextElementSibling;
    if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
        const container = wrapper.querySelector('.custom-options');
        const trigger = wrapper.querySelector('.custom-select__trigger');
        populateOptions(select, container, trigger);

        // Sync trigger text to current value
        const selected = select.options[select.selectedIndex];
        if (selected) {
            trigger.querySelector('span').textContent = selected.textContent;
        }
    }
}

// Global Click Listener to close dropdowns
window.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select').forEach(select => {
            select.classList.remove('open');
        });
    }
});

// Auto-init on load
document.addEventListener('DOMContentLoaded', initCustomDropdowns);
