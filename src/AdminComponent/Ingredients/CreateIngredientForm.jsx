import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createIngredient } from "../../component/State/Ingredients/Action";

const CreateIngredientForm = () => {
  const dispatch = useDispatch(); 
  const jwt = localStorage.getItem("jwt");
   const {restaurant,ingredients} = useSelector((store) => store);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const restId = restaurant?.usersRestaurants?.[0]?.id;
    const catId = formData.categoryId ? Number(formData.categoryId) : null;
    if (!restId || !catId) {
      console.warn("Missing restaurantId or categoryId", { restId, catId });
      return;
    }
    // Include multiple shapes to satisfy unknown backend DTO field names
    // Backend trace shows null id when loading category; most likely expects `ingredientCategoryId` OR `categoryId` only.
    // We'll send a concise payload with both simple keys (no nested objects) so controller binder picks one.
    const data = {
      name: formData.name,
      ingredientCategoryId: catId,
      categoryId: catId,
      restaurantId: restId,
    };
    console.log("Create ingredient payload", data);
    dispatch(createIngredient({ data, jwt }));
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  return (
    <div className="">
      <div className="p-5">
        <h1 className="text-gray-400 text-center text-xl pb-10">
          Create Ingredient
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Name"
            variant="outlined"
            onChange={handleInputChange}
            value={formData.name}
          ></TextField>
          <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
            <InputLabel id="demo-select-small-label">Category</InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={formData.categoryId}
              label="Category"
              onChange={handleInputChange}
              name="categoryId"
            >
              {ingredients.category.map((item) => (
                <MenuItem  value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">
            {" "}
            Create Ingredient
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateIngredientForm;
