function removeLastIngredient(id) {
    const recipe = recipes.find(r => r.id === id);
    if (recipe.ingredients.length > 0) {
        recipe.ingredients.pop(); // Remove the last element
        editRecipe(id);
        updateIngredientsTable(id);
    }
}

function updateIngredientsTable(id) {
    const recipe = recipes.find(r => r.id === id);
    const table = document.getElementById(`ingredients-${id}`);
    
    // Clear existing rows except the header
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Add updated rows
    recipe.ingredients.forEach((ing, i) => {
        const row = table.insertRow(-1);
        row.innerHTML = `
            <td><input type="text" value="${ing.ingredient}" oninput="updateIngredient('${id}', ${i}, this)"></td>
            <td><input type="text" value="${ing.quantity}" oninput="updateIngredient('${id}', ${i}, this)"></td>
            <td><button class="button delete-button" onclick="removeIngredient('${id}', ${i})">Remove</button></td>
        `;
    });
}