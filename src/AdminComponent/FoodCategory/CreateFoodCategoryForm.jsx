import { Button, TextField } from "@mui/material";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCategoryAction } from "../../component/State/Restaurant/Action";

const CreateFoodCategoryForm = () => {
  const { restaurant } = useSelector((store) => store);
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const restaurantId = restaurant?.usersRestaurants?.[0]?.id;
  const [formData, setFormData] = useState({ categoryName: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!restaurantId) return;
    const data = {
      name: formData.categoryName,
      restaurantId,
    };
    dispatch(createCategoryAction({ reqData: data, jwt }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div className="">
      <div className="p-5">
        <h1 className="text-gray-400 text-center text-xl pb-10">
          Create Food Category
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="categoryName"
            name="categoryName"
            label="Food Category"
            variant="outlined"
            onChange={handleInputChange}
            value={formData.categoryName}
          ></TextField>
          <Button type="submit" variant="contained"> Create Category</Button>
        </form>
      </div>
    </div>
  );
};

export default CreateFoodCategoryForm;
