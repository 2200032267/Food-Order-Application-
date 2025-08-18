import axios from "axios";
import { api, API_URL } from "../../config/api";
import {
  ADD_TO_FAVORITE_FAILURE,
  ADD_TO_FAVORITE_REQUEST,
  ADD_TO_FAVORITE_SUCCESS,
  GET_USER_FAILURE,
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGOUT,
  REGISTER_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  // we can reuse constants from restaurant slice by dynamic import or hardcode string, but we'll import type
} from "./ActionType";
import { CLEAR_RESTAURANT_STATE } from "../Restaurant/ActionTypes";
import { getRestaurantByUserId } from "../Restaurant/Action";

export const registerUser = (reqData) => async (dispatch) => {
  dispatch({ type: REGISTER_REQUEST });
  try {
    console.log("Sending registration data:", reqData.userData);
    const { data } = await axios.post(
      `${API_URL}/auth/signup`,
      reqData.userData
    );
    if (data.jwt) localStorage.setItem("jwt", data.jwt);
  dispatch({ type: REGISTER_SUCCESS, payload: data.jwt });
  // Clear any stale restaurant state from previous sessions
  dispatch({ type: CLEAR_RESTAURANT_STATE });
    // Immediately perform a login to obtain a fresh token populated with authorities (signup token may lack roles)
    try {
      const loginRes = await axios.post(`${API_URL}/auth/signin`, {
        email: reqData.userData.email,
        password: reqData.userData.password,
      });
      if (loginRes.data?.jwt) {
        localStorage.setItem("jwt", loginRes.data.jwt);
  dispatch({ type: LOGIN_SUCCESS, payload: loginRes.data.jwt });
  dispatch({ type: CLEAR_RESTAURANT_STATE });
        // fetch profile after login
        try {
          const profileRes = await api.get(`/api/users/profile`, {
            headers: { Authorization: `Bearer ${loginRes.data.jwt}` },
          });
          dispatch({ type: GET_USER_SUCCESS, payload: profileRes.data });
        } catch (profileErr) {
          console.warn("Failed to fetch profile after auto-login", profileErr);
        }
        if (loginRes.data.role === "ROLE_RESTAURANT_OWNER") {
          // fetch existing restaurant (if any); new owner gets none and will see create form
            try { await dispatch(getRestaurantByUserId(loginRes.data.jwt)); } catch(e) { /* ignore */ }
          reqData.navigate("/admin/restaurants");
        } else {
          reqData.navigate("/");
        }
      } else {
        // fallback navigation if login token missing
        if (data.role === "ROLE_RESTAURANT_OWNER") {
          reqData.navigate("/admin/restaurants");
        } else {
          reqData.navigate("/");
        }
      }
    } catch (autoLoginErr) {
      console.warn("Auto-login after signup failed", autoLoginErr);
      // attempt profile fetch with signup token as last resort
      try {
        const profileRes = await api.get(`/api/users/profile`, {
          headers: { Authorization: `Bearer ${data.jwt}` },
        });
        dispatch({ type: GET_USER_SUCCESS, payload: profileRes.data });
      } catch (profileErr) {
        console.warn("Profile fetch with signup token failed", profileErr);
      }
      if (data.role === "ROLE_RESTAURANT_OWNER") {
        try { await dispatch(getRestaurantByUserId(data.jwt)); } catch(e) { /* ignore */ }
        reqData.navigate("/admin/restaurants");
      } else {
        reqData.navigate("/");
      }
    }
    console.log("register sucess", data);
  } catch (error) {
    dispatch({ type: REGISTER_FAILURE, payload: error });
    console.log("Error in registerUser action:", error);
    console.log("Error response:", error.response?.data);
  }
};

export const loginUser = (reqData) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/signin`,
      reqData.userData
    );
    if (data.jwt) localStorage.setItem("jwt", data.jwt);
    dispatch({ type: LOGIN_SUCCESS, payload: data.jwt });
    dispatch({ type: CLEAR_RESTAURANT_STATE });
    if (data.role === "ROLE_RESTAURANT_OWNER") {
      try { await dispatch(getRestaurantByUserId(data.jwt)); } catch(e) { /* ignore */ }
      reqData.navigate("/admin/restaurants");
    } else {
      reqData.navigate("/");
    }
    console.log("login sucess", data);
  } catch (error) {
        dispatch({ type: LOGIN_FAILURE, payload: error });

    console.log("Error in loginUser action:", error);
  }
};

export const getUser = (jwt) => async (dispatch) => {
  dispatch({ type: GET_USER_REQUEST });
  try {
    const { data } = await api.get(`/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    dispatch({ type: GET_USER_SUCCESS, payload: data });
    console.log("user profile data:", data);
  } catch (error) {
    dispatch({ type: GET_USER_FAILURE, payload: error });
    console.log("Error in getUser action:", error);
  }
};
export const addToFavorite = ({ jwt, restaurantId }) => async (dispatch) => {
  dispatch({ type: ADD_TO_FAVORITE_REQUEST });
  try {
    const { data } = await api.put(`/api/restaurants/${restaurantId}/add-favorites`, {}, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    dispatch({ type: ADD_TO_FAVORITE_SUCCESS, payload: data });
    console.log("Added to favorites:", data);
  } catch (error) {
    dispatch({ type: ADD_TO_FAVORITE_FAILURE, payload: error });
    console.log("Error in addToFavorite action:", error);
  }
};
 
export const logout = () => async (dispatch) => {
 
  try {
    localStorage.clear();
  

    dispatch({ type:LOGOUT})
    console.log("logout successful");
  } catch (error) {
    
    console.log("Error in logout action:", error);
  }
};
