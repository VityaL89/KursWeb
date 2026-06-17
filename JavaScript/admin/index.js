document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!adminRequireAdmin()) return;

        const state = await adminLoadAllData();

        const refreshUI = async () => {
            await adminRefreshUI(state);
        };

        await refreshUI();

        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.addEventListener('click', () => adminSetActiveTab(btn.dataset.tab));
        });
        adminSetActiveTab('restaurants');

        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (typeof logoutUser === 'function') logoutUser();
            });
        }

        adminQs('#admin-modal-close').addEventListener('click', adminCloseModal);
        adminQs('#admin-modal-overlay').addEventListener('click', adminCloseModal);

        await adminBindRestaurants(state, refreshUI);
        await adminBindMenuItems(state, refreshUI);
        await adminBindCategories(state, refreshUI);
        await adminBindOrders(state, refreshUI);
        await adminBindNotifications(state, refreshUI);
    } catch (err) {
        console.error(err);
        alert('Admin panel error. Check console.');
    }
});
