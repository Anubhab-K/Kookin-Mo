// Initialize Firebase (replace with your own config)
const firebaseConfig = {
    apiKey: "AIzaSyBrh_qEpi_6yNptx-ziRAeL9x15VaZ_vBg",
    authDomain: "kookin-mo.firebaseapp.com",
    projectId: "kookin-mo",
    storageBucket: "kookin-mo.appspot.com",
    messagingSenderId: "425114220630",
    appId: "1:425114220630:web:0283f3c7a26f7291e963f7",
    measurementId: "G-GBMJ6WBWKS"
  };

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

let currentUser = null;
let recipes = [];

document.getElementById('login-button').addEventListener('click', signInWithGoogle);
document.getElementById('logout-button').addEventListener('click', signOut);
document.getElementById('createRecipe').addEventListener('click', createNewRecipe);

function signInWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .catch((error) => {
            console.error("Error signing in: ", error);
        });
}

function signOut() {
    auth.signOut()
        .catch((error) => {
            console.error("Error signing out: ", error);
        });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('logout-button').style.display = 'inline';
        document.getElementById('recipe-container').style.display = 'block';
        fetchRecipes();
    } else {
        currentUser = null;
        document.getElementById('login-button').style.display = 'inline';
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('recipe-container').style.display = 'none';
        document.getElementById('recipe-list').innerHTML = '';
    }
});

function createNewRecipe() {
    const title = prompt("Enter recipe title:");
    if (title) {
        const recipe = { 
            title, 
            ingredients: [], 
            process: "",
            userId: currentUser.uid
        };
        db.collection("recipes").add(recipe)
            .then(() => {
                fetchRecipes();
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
    }
}

function fetchRecipes() {
    db.collection("recipes")
        .where("userId", "==", currentUser.uid)
        .get()
        .then((querySnapshot) => {
            recipes = [];
            querySnapshot.forEach((doc) => {
                recipes.push({ id: doc.id, ...doc.data() });
            });
            updateRecipeList();
        })
        .catch((error) => {
            console.error("Error fetching recipes: ", error);
        });
}

function updateRecipeList() {
    const recipeList = document.getElementById("recipe-list");
    recipeList.innerHTML = "";
    recipes.forEach((recipe, index) => {
        const card = document.createElement("div");
        card.className = "recipe-card";
        card.innerHTML = `
            <div class="recipe-header">
                <h2 class="recipe-title">${recipe.title}</h2>
                <div class="button-group">
                    <button class="button" onclick="toggleRecipe(${index})">View</button>
                    <button class="button" onclick="editRecipe('${recipe.id}')">Edit</button>
                    <button class="button delete-button" onclick="deleteRecipe('${recipe.id}')">Delete</button>
                </div>
            </div>
            <div id="recipe-${index}" class="recipe-content" style="display: none;"></div>
        `;
        recipeList.appendChild(card);
    });
}

function toggleRecipe(index) {
    const recipeContent = document.getElementById(`recipe-${index}`);
    if (recipeContent.style.display === "none") {
        viewRecipe(index);
        recipeContent.style.display = "block";
    } else {
        recipeContent.style.display = "none";
    }
}


function viewRecipe(index) {
    const recipe = recipes[index];
    const recipeContent = document.getElementById(`recipe-${index}`);
    recipeContent.innerHTML = `
        <h3>Ingredients:</h3>
        <table class="ingredients-table">
            <tr><th>Ingredient</th><th>Quantity</th></tr>
            ${recipe.ingredients.map(ing => `<tr><td>${ing.ingredient}</td><td>${ing.quantity}</td></tr>`).join('')}
        </table>
        <h3>Process:</h3>
        <p>${recipe.process}</p>
    `;
    recipeContent.style.display = "block";
}

function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    const index = recipes.indexOf(recipe);
    const recipeContent = document.getElementById(`recipe-${index}`);
    recipeContent.innerHTML = `
        <input type="text" class="edit-title" value="${recipe.title}" oninput="updateTitle('${id}', this.value)">
        <h3>Ingredients</h3>
        <table class="ingredients-table" id="ingredients-${index}">
            <tr><th>Ingredient</th><th>Quantity</th><th>Action</th></tr>
            ${recipe.ingredients.map((ing, i) => `
                <tr>
                    <td><input type="text" value="${ing.ingredient}" oninput="updateIngredient('${id}', ${i}, this)"></td>
                    <td><input type="text" value="${ing.quantity}" oninput="updateIngredient('${id}', ${i}, this)"></td>
                    <td><button class="button delete-button" onclick="removeIngredient('${id}', ${i})">Remove</button></td>
                </tr>
            `).join('')}
        </table>
        <button class="button" onclick="addIngredientRow('${id}')">Add Ingredient</button>
        <h3>Process</h3>
        <textarea class="process-box" oninput="updateProcess('${id}', this.value)">${recipe.process}</textarea>
        <button class="button" onclick="saveRecipe('${id}')">Save</button>
    `;
    recipeContent.style.display = "block";
}

function updateTitle(id, value) {
    const recipe = recipes.find(r => r.id === id);
    recipe.title = value;
}

function deleteRecipe(id) {
    if (confirm("Are you sure you want to delete this recipe?")) {
        db.collection("recipes").doc(id).get()
            .then((doc) => {
                if (doc.exists && doc.data().userId === currentUser.uid) {
                    return db.collection("recipes").doc(id).delete();
                } else {
                    throw new Error("You don't have permission to delete this recipe");
                }
            })
            .then(() => {
                fetchRecipes();
            })
            .catch((error) => {
                console.error("Error removing document: ", error);
            });
    }
}

function addIngredientRow(id) {
    const recipe = recipes.find(r => r.id === id);
    recipe.ingredients.push({ ingredient: "", quantity: "" });
    editRecipe(id);
}

function updateIngredient(id, ingredientIndex, input) {
    const recipe = recipes.find(r => r.id === id);
    const isIngredient = input.parentElement.cellIndex === 0;
    recipe.ingredients[ingredientIndex][isIngredient ? 'ingredient' : 'quantity'] = input.value;
}

function removeIngredient(id, ingredientIndex) {
    const recipe = recipes.find(r => r.id === id);
    recipe.ingredients.splice(ingredientIndex, 1);
    editRecipe(id);
}

function updateProcess(id, value) {
    const recipe = recipes.find(r => r.id === id);
    recipe.process = value;
}

function saveRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (recipe.userId !== currentUser.uid) {
        console.error("You don't have permission to edit this recipe");
        return;
    }
    db.collection("recipes").doc(id).update(recipe)
        .then(() => {
            fetchRecipes();
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
}









