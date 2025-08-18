import { Button, TextField } from "@mui/material";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createIngredientCategory } from "../../component/State/Ingredients/Action";

const CreateIngredientCategoryForm = () => {
    const dispatch = useDispatch();
    const jwt = localStorage.getItem("jwt");
  const [formData, setFormData] = useState({ name: ""});
  const {restaurant} = useSelector((store) => store);
  const handleSubmit = (e) => {
    e.preventDefault();
  const restaurantId = restaurant?.usersRestaurants?.[0]?.id;
  if (!restaurantId) return; // guard if not yet loaded
  const data={name:formData.name,restaurantId}
    dispatch(createIngredientCategory({data,jwt}))

    console.log(formData);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,[name]:value
    })
  }
  return (
    <div className="">
      <div className="p-5">
        <h1 className="text-gray-400 text-center text-xl pb-10">
          Create Ingredient Category
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="category"
            variant="outlined"
            onChange={handleInputChange}
            value={formData.name}
          ></TextField>
          <Button type="submit" variant="contained"> Create Category</Button>
        </form>
      </div>
    </div>
  );
};

export default CreateIngredientCategoryForm;
