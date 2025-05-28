document.addEventListener('DOMContentLoaded', async () => {
    try {
      console.log("Загрузка данных...");
      
      // Используем REST API для получения данных
      const response = await fetch('http://localhost:3000/products');
      const products = await response.json();
      
      if (products) {
        const container = document.getElementById('products');
        container.innerHTML = '';
        
        products.forEach(product => {
          const card = document.createElement('div');
          card.className = 'product-card';
          card.innerHTML = `
            <h2>${product.name}</h2>
            <p class="price">₽${product.price}</p>
            <p class="description">${product.description || ''}</p>
          `;
          container.appendChild(card);
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
});