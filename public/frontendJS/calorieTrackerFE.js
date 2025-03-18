const form = document.getElementById("calorieForm");
const ingredientsInput = document.getElementById("ingredientsInput");
const ingredientFields = document.getElementById("ingredientFields");
const addIngredientBtn = document.getElementById("addIngredient");

addIngredientBtn.addEventListener("click", () => {
    const newField = document.createElement("div");
    newField.className = "ingredient-field";
    newField.innerHTML = `<input type="text" class="form-control" name="ingredient" placeholder="e.g., 50g pancetta">`;
    ingredientFields.appendChild(newField);
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const foodText = document.getElementById("foodText").value;
    const ingredientInputs = ingredientFields.querySelectorAll("input[name='ingredient']");
    const ingredients = Array.from(ingredientInputs).map(input => input.value).filter(i => i.trim());

    try {
        const response = await fetch("/calorieTracker/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ foodText, ingredients })
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById("foodText").value = "";
            ingredientFields.innerHTML = `<div class="ingredient-field"><input type="text" class="form-control" name="ingredient" placeholder="e.g., 200g spaghetti"></div>`;
            bootstrap.Collapse.getOrCreateInstance(ingredientsInput).hide();
            window.location.reload();
        } else if (data.needsIngredients) {
            bootstrap.Collapse.getOrCreateInstance(ingredientsInput).show();
            alert(data.error);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to log calories");
    }
});