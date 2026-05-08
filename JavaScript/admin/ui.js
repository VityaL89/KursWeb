function adminSetActiveTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('[data-tab-panel]').forEach(panel => {
        panel.style.display = panel.dataset.tabPanel === tab ? 'block' : 'none';
    });
}

function adminOpenModal(title, bodyHtml) {
    adminQs('#admin-modal-title').textContent = title;
    adminQs('#admin-modal-body').innerHTML = bodyHtml;
    adminQs('#admin-modal-overlay').style.display = 'block';
    adminQs('#admin-modal').style.display = 'block';
}

function adminCloseModal() {
    adminQs('#admin-modal-overlay').style.display = 'none';
    adminQs('#admin-modal').style.display = 'none';
    adminQs('#admin-modal-body').innerHTML = '';
}
