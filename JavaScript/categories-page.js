const categoriesPageCategoryMapping = [
    { name: 'Pizza', slug: 'pizza' },
    { name: 'Burgers', slug: 'burgers' },
    { name: 'Desserts', slug: 'desserts' },
    { name: 'Sushi', slug: 'sushi' },
    { name: 'Asian', slug: 'asian' },
    { name: 'Comfort', slug: 'comfort' }
];

function categoriesPageSetupCategoriesCards() {
    const menuCards = document.querySelectorAll('.menu-card');

    menuCards.forEach((card, index) => {
        if (categoriesPageCategoryMapping[index]) {
            const category = categoriesPageCategoryMapping[index];
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = `CategoriesChild.html?category=${category.slug}`;
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    categoriesPageSetupCategoriesCards();
});
