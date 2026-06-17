function getNotificationPrefsStorageKey() {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) {
        try {
            const user = JSON.parse(raw);
            if (user?.id != null) return `notificationPrefs_user_${user.id}`;
        } catch (e) {
            console.error('Failed to parse currentUser for notification prefs', e);
        }
    }
    return 'notificationPrefs_guest';
}

function loadNotificationPrefs() {
    const key = getNotificationPrefsStorageKey();
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object') {
            return {
                discounts: !!parsed.discounts,
                promotions: !!parsed.promotions,
                newRestaurants: !!parsed.newRestaurants
            };
        }
    } catch (e) {
        console.error('Failed to load notification prefs', e);
    }

    return {
        discounts: true,
        promotions: true,
        newRestaurants: true
    };
}

function saveNotificationPrefs(prefs) {
    const key = getNotificationPrefsStorageKey();
    try {
        localStorage.setItem(key, JSON.stringify(prefs));
        return true;
    } catch (e) {
        console.error('Failed to save notification prefs', e);
        return false;
    }
}

function setStatusText(text) {
    const el = document.getElementById('notif-status');
    if (!el) return;
    el.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
    const discounts = document.getElementById('notif-discounts');
    const promotions = document.getElementById('notif-promotions');
    const newRestaurants = document.getElementById('notif-new-restaurants');
    const saveBtn = document.getElementById('notif-save');

    if (!discounts || !promotions || !newRestaurants) return;

    const prefs = loadNotificationPrefs();
    discounts.checked = prefs.discounts;
    promotions.checked = prefs.promotions;
    newRestaurants.checked = prefs.newRestaurants;

    const save = () => {
        const next = {
            discounts: discounts.checked,
            promotions: promotions.checked,
            newRestaurants: newRestaurants.checked
        };

        const ok = saveNotificationPrefs(next);
        setStatusText(ok ? '' : 'Failed to save');
        if (ok && typeof updateHeaderAuthUI === 'function') {
            updateHeaderAuthUI();
        }
    };

    if (saveBtn) {
        saveBtn.addEventListener('click', save);
    }

    discounts.addEventListener('change', save);
    promotions.addEventListener('change', save);
    newRestaurants.addEventListener('change', save);
});
