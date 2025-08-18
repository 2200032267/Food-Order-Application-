import { api } from "../../config/api";
import { getUserFriendlyErrorMessage, isConstraintViolation } from "../../config/errorHandler";

// import {
//   createRestaurantFailure,
//   createRestaurantRequest,
//   createRestaurantSuccess,
//   deleteRestaurantFailure,
//   deleteRestaurantRequest,
//   deleteRestaurantSuccess,
//   getAllRestaurantsFailure,
//   getAllRestaurantsRequest,
//   getAllRestaurantsSuccess,
//   getRestaurantByIdFailure,
//   getRestaurantByIdRequest,
//   getRestaurantByIdSuccess,
//   updateRestaurantFailure,
//   updateRestaurantRequest,
//   updateRestaurantSuccess,
// } from "./ActionCreateros";

import {
  CREATE_CATEGORY_FAILURE,
  CREATE_CATEGORY_REQUEST,
  CREATE_CATEGORY_SUCCESS,
  CREATE_EVENTS_FAILURE,
  CREATE_EVENTS_REQUEST,
  CREATE_EVENTS_SUCCESS,
  GET_ALL_EVENTS_FAILURE,
  GET_ALL_EVENTS_REQUEST,
  GET_ALL_EVENTS_SUCCESS,
  GET_RESTAURANTS_EVENT_FAILURE,
  GET_RESTAURANTS_EVENT_REQUEST,
  GET_RESTAURANTS_EVENT_SUCCESS,
  GET_RESTAURANTS_CATEGORY_FAILURE,
  GET_RESTAURANTS_CATEGORY_REQUEST,
  GET_RESTAURANTS_CATEGORY_SUCCESS,
  GET_RESTAURANT_BY_USER_ID_FAILURE,
  GET_RESTAURANT_BY_USER_ID_REQUEST,
  GET_RESTAURANT_BY_USER_ID_SUCCESS,
  UPDATE_RESTAURANT_STATUS_FAILURE,
  UPDATE_RESTAURANT_STATUS_REQUEST,
  UPDATE_RESTAURANT_STATUS_SUCCESS,
  GET_ALL_RESTAURANTS_REQUEST,
  GET_ALL_RESTAURANTS_SUCCESS,
  GET_ALL_RESTAURANTS_FAILURE,
  GET_RESTAURANT_BY_ID_REQUEST,
  GET_RESTAURANT_BY_ID_FAILURE,
  GET_RESTAURANT_BY_ID_SUCCESS,
  CREATE_RESTAURANT_REQUEST,
  CREATE_RESTAURANT_SUCCESS,
  CREATE_RESTAURANT_FAILURE,
  DELETE_RESTAURANT_REQUEST,
  DELETE_RESTAURANT_SUCCESS,
  DELETE_EVENTS_FAILURE,
  DELETE_EVENTS_REQUEST,
  DELETE_EVENTS_SUCCESS,
} from "./ActionTypes";

export const getAllRestaurantsAction = (token) => {
  return async (dispatch) => {
    dispatch({ type: GET_ALL_RESTAURANTS_REQUEST });
    try {
      const { data } = await api.get("api/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: GET_ALL_RESTAURANTS_SUCCESS, payload: data });
      console.log("All Restaurants:", data);
    } catch (error) {
      console.error("Error fetching all restaurants:", error);
      dispatch({
        type: GET_ALL_RESTAURANTS_FAILURE,
        payload: error,
      });
    }
  };
};

export const getRestaurantByID = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: GET_RESTAURANT_BY_ID_REQUEST });
    try {
      console.log("Fetching restaurant with ID:", reqData.restaurantId);
      const response = await api.get(
        `api/restaurants/${reqData.restaurantId}`,
        {
          headers: { Authorization: `Bearer ${reqData.jwt}` },
        }
      );
      dispatch({
        type: GET_RESTAURANT_BY_ID_SUCCESS,
        payload: response.data,
      });
      console.log("Restaurant fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching restaurant by ID:", error);
      console.error("Error response:", error.response?.data);
      console.error("Request URL:", `api/restaurants/${reqData.restaurantId}`);
      dispatch({
        type: GET_RESTAURANT_BY_ID_FAILURE,
        payload: error,
      });
    }
  };
};
export const getRestaurantByUserId = (jwt) => {
  return async (dispatch) => {
    dispatch({ type: GET_RESTAURANT_BY_USER_ID_REQUEST });
    try {
      const { data } = await api.get(`api/admin/restaurants/user`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Restaurant by User ID:", data);
      dispatch({
        type: GET_RESTAURANT_BY_USER_ID_SUCCESS,
        payload: data,
      });
    } catch (error) {
      if (error?.response?.status === 404) {
        console.warn("No restaurant found for user (404)");
        // treat as success with null payload -> reducer normalizes to []
        dispatch({
          type: GET_RESTAURANT_BY_USER_ID_SUCCESS,
          payload: null,
        });
      } else {
        console.error("Error fetching restaurant by user ID:", error);
        dispatch({
          type: GET_RESTAURANT_BY_USER_ID_FAILURE,
          payload: error.message,
        });
      }
    }
  };
};

export const createRestaurant = (reqData) => {
  console.log("Creating restaurant with data:", reqData.token);
  return async (dispatch) => {
    dispatch({ type: CREATE_RESTAURANT_REQUEST });
    try {
      // log outgoing payload for debugging server 500s
      // eslint-disable-next-line no-console
      console.log("POST api/admin/restaurants payload:", reqData.data);
      const { data } = await api.post("api/admin/restaurants", reqData.data, {
        headers: { Authorization: `Bearer ${reqData.token}` },
      });
      dispatch({
        type: CREATE_RESTAURANT_SUCCESS,
        payload: data,
      });
      console.log("Restaurant created successfully:", data);
  // return created restaurant so callers can await and react
  return data;
    } catch (error) {
      console.log("Error creating restaurant:", error);
      console.log("Error response data:", error.response?.data);
      console.log("Error status:", error.response?.status);
      
      // Handle specific constraint violation errors
      if (isConstraintViolation(error)) {
        console.error("DUPLICATE RESTAURANT ERROR: A restaurant with this information already exists");
        console.error("Constraint violation:", error.response?.data?.message);
        
        // Create a more user-friendly error message
        const userFriendlyError = {
          ...error,
          message: getUserFriendlyErrorMessage(error, "restaurant"),
          isConstraintViolation: true
        };
        
        dispatch({
          type: CREATE_RESTAURANT_FAILURE,
          payload: userFriendlyError,
        });
  // propagate to caller
  throw userFriendlyError;
      } else {
        dispatch({
          type: CREATE_RESTAURANT_FAILURE,
          payload: error,
        });
  throw error;
      }
    }
  };
};

export const updateRestaurant = ({ restaurantId, restaurantData, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_RESTAURANT_STATUS_REQUEST });
    try {
      const res = await api.put(
        `api/admin/restaurant/${restaurantId}`,
        restaurantData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      dispatch({
        type: UPDATE_RESTAURANT_STATUS_SUCCESS,
        payload: res.data,
      });
      console.log("Restaurant updated successfully:", res);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      dispatch({
        type: UPDATE_RESTAURANT_STATUS_FAILURE,
        payload: error,
      });
    }
  };
};

export const deleteRestaurant = ({ restaurantId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: DELETE_RESTAURANT_REQUEST });
    try {
      const res = await api.delete(`api/admin/restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Delete response:", res.data);
      dispatch({
        type: DELETE_RESTAURANT_SUCCESS,
        payload: restaurantId,
      });
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      dispatch({
        type: DELETE_EVENTS_FAILURE,
        payload: error,
      });
    }
  };
};

export const updateRestaurantStatus = ({ restaurantId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_RESTAURANT_STATUS_REQUEST });
    try {
      const res = await api.put(
        `api/admin/restaurants/${restaurantId}/status`,
        {},
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("Update response:", res.data);
      dispatch({
        type: UPDATE_RESTAURANT_STATUS_SUCCESS,
        payload: res.data,
      });
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      dispatch({
        type: UPDATE_RESTAURANT_STATUS_FAILURE,
        payload: error,
      });
    }
  };
};

export const createEventAction = ({ data, jwt, restaurantId }) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_EVENTS_REQUEST });
    try {
      const res = await api.post(
        `api/admin/events/restaurant/${restaurantId}`,
        data,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("Event created successfully:", res.data);
      dispatch({
        type: CREATE_EVENTS_SUCCESS,
        payload: res.data,
      });
    } catch (error) {
      console.error("Error creating event:", error);
      dispatch({
        type: CREATE_EVENTS_FAILURE,
        payload: error,
      });
    }
  };
};

export const getAllEvents = ({ jwt }) => {
  return async (dispatch) => {
    dispatch({ type: GET_ALL_EVENTS_REQUEST });
    try {
      const res = await api.get(`api/events`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("All events fetched successfully:", res.data);
      dispatch({
        type: GET_ALL_EVENTS_SUCCESS,
        payload: res.data,
      });
    } catch (error) {
      console.error("Error fetching all events:", error);
      dispatch({
        type: GET_ALL_EVENTS_FAILURE,
        payload: error,
      });
    }
  };
};

export const deleteEventAction = ({ eventId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: DELETE_EVENTS_REQUEST });
    try {
      const res = await api.delete(`api/admin/events/${eventId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Event deleted successfully:", res.data);
      dispatch({
        type: DELETE_EVENTS_SUCCESS,
        payload: eventId,
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      dispatch({
        type: DELETE_EVENTS_FAILURE,
        payload: error,
      });
    }
  };
};

export const getRestaurantsEvents = ({ restaurantId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: GET_RESTAURANTS_EVENT_REQUEST });
    try {
      const res = await api.get(`api/admin/events/restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Restaurants events fetched successfully:", res.data);
      dispatch({
        type: GET_RESTAURANTS_EVENT_SUCCESS,
        payload: res.data,
      });
    } catch (error) {
      console.error("Error fetching restaurants events:", error);
      dispatch({
        type: GET_RESTAURANTS_EVENT_FAILURE,
        payload: error,
      });
    }
  };
};

export const createCategoryAction = ({ reqData, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_CATEGORY_REQUEST });
    try {
      // Ensure restaurantId is present in the payload when available
      const payload = { ...reqData };
      // some callers may use restaurantId or restaurantID camelCase, normalize both
      if (!payload.restaurantId && payload.restaurantID) {
        payload.restaurantId = payload.restaurantID;
      }

      const res = await api.post(`api/admin/category`, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Category created successfully:", res.data);
      dispatch({
        type: CREATE_CATEGORY_SUCCESS,
        payload: res.data,
      });

      // Verification step: if we have a restaurantId, re-fetch categories for that restaurant
      // and verify the created category appears in the list. This guards against backend
      // mis-association issues (e.g. category saved to wrong restaurant).
      const restaurantId = payload.restaurantId;
      if (restaurantId) {
        try {
          const fetchRes = await api.get(`api/category/restaurant/${restaurantId}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          const categories = fetchRes.data || [];
          const created = res.data;
          const found = categories.some((c) => String(c.id ?? c._id ?? c.id) === String(created.id ?? created._id ?? created.id) || String(c.name) === String(created.name));
          if (!found) {
            console.warn(`Created category (${created.id ?? created._id ?? created.name}) not found in categories for restaurant ${restaurantId}. Backend may have associated it with a different restaurant.`);
            // Attach a debug flag to the store via CREATE_CATEGORY_FAILURE-like signal but keep success action
            dispatch({
              type: GET_RESTAURANTS_CATEGORY_FAILURE,
              payload: {
                message: `Category created but not attached to restaurant ${restaurantId}`,
                createdCategory: created,
                fetchedCategories: categories,
              },
            });
          } else {
            // if found, update the categories state by re-dispatching GET_RESTAURANTS_CATEGORY_SUCCESS
            dispatch({
              type: GET_RESTAURANTS_CATEGORY_SUCCESS,
              payload: categories,
            });
          }
        } catch (verifyErr) {
          console.error("Error verifying created category:", verifyErr);
        }
      }
    } catch (error) {
      console.error("Error creating category:", error);
      dispatch({
        type: CREATE_CATEGORY_FAILURE,
        payload: error,
      });
    }
  };
};

export const getRestaurantsCategory = ({ jwt, restaurantId }) => {
  return async (dispatch) => {
    dispatch({ type: GET_RESTAURANTS_CATEGORY_REQUEST });
    try {
      const res = await api.get(`api/category/restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("Restaurants categories fetched successfully:", res.data);
      dispatch({
        type: GET_RESTAURANTS_CATEGORY_SUCCESS,
        payload: res.data,
      });
    } catch (error) {
      console.error("Error fetching restaurants categories:", error);
      console.error("Error response:", error);
      dispatch({
        type: GET_RESTAURANTS_CATEGORY_FAILURE,
        payload: error,
      });
    }
  };
};
