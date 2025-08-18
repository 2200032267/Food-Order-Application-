import React from "react";
import { Route, Routes } from "react-router-dom";
import CreateRestaurantForm from "../AdminComponent/CreateRestaurantForm/CreateRestaurantForm";
import Admin from "../AdminComponent/Admin/Admin";
import { useSelector } from "react-redux";

export const AdminRoute = () => {
  const { restaurant } = useSelector((store) => store);
  return (
    <div>
      <Routes>
        <Route
          path="/*"
          element={
            // Show create form if the user has no restaurants yet
            !restaurant.usersRestaurants || restaurant.usersRestaurants.length === 0 ? (
              <CreateRestaurantForm />
            ) : (
              <Admin />
            )
          }
        ></Route>
      </Routes>
    </div>
  );
};
