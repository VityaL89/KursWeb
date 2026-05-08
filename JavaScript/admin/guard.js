function adminRequireAdmin() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'Login.html';
        return false;
    }
    if (user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
