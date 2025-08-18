

import { api } from "../../config/api";
import {
  ADD_ITEM_TO_CART_FAILURE,
  ADD_ITEM_TO_CART_REQUEST,
  ADD_ITEM_TO_CART_SUCCESS,
  CLEAR_CART_FAILURE,
  CLEAR_CART_REQUEST,
  CLEAR_CART_SUCCESS,
  FIND_CART_FAILURE,
  FIND_CART_REQUEST,
  FIND_CART_SUCCESS,
  GET_ALL_CART_ITEMS_FAILURE,
  GET_ALL_CART_ITEMS_REQUEST,
  GET_ALL_CART_ITEMS_SUCCESS,
  REMOVE_CARTITEM_FAILURE,
  REMOVE_CARTITEM_REQUEST,
  REMOVE_CARTITEM_SUCCESS,
  UPDATE_CARTITEM_FAILURE,
  UPDATE_CARTITEM_REQUEST,
  UPDATE_CARTITEM_SUCCESS,
} from "./ActionTypes";

export const findCart = (token) => {
  return async (dispatch) => {
    dispatch({ type: FIND_CART_REQUEST });
    try {
      const response = await api.get(`api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("my cart ", response.data);
      dispatch({ type: FIND_CART_SUCCESS, payload: response.data });
    } catch (error) {
      console.error("Error finding cart:", error);
      dispatch({ type: FIND_CART_FAILURE, payload: error.message });
    }
  };
};

export const getAllCartItems = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: GET_ALL_CART_ITEMS_REQUEST });
    try {
      const response = await api.get(`/api/carts/${reqData.cartId}/items`, {
        headers: {
          Authorization: `Bearer ${reqData.token}`,
        },
      });
      dispatch({ type: GET_ALL_CART_ITEMS_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: GET_ALL_CART_ITEMS_FAILURE, payload: error });
    }
  };
};
export const addItemToCart = (reqData) => {
  return async (dispatch, getState) => {
    dispatch({ type: ADD_ITEM_TO_CART_REQUEST });
    try {
      // Optimistic update: merge into existing cart items in local state so UI updates immediately
      const state = getState();
      const currentItems = state.cart?.cartItems || [];
      const existing = currentItems.find((it) => it.food?.id === reqData.cartItem.foodId || it.id === reqData.cartItem.cartItemId || it.foodId === reqData.cartItem.foodId);
      let optimisticPayload;
      if (existing) {
        const newQty = (existing.quantity || 0) + (reqData.cartItem.quantity || 1);
        const updated = { ...existing, quantity: newQty, totalPrice: (Number(existing.totalPrice || 0) + (Number(reqData.cartItem.quantity || 1) * (Number(existing.food?.price || existing.price || 0)))) };
        optimisticPayload = updated;
      } else {
        // create a minimal optimistic item
        optimisticPayload = {
          id: Math.random().toString(36).substr(2, 9),
          food: { id: reqData.cartItem.foodId },
          quantity: reqData.cartItem.quantity || 1,
          ingredients: reqData.cartItem.ingredients || [],
          totalPrice: (reqData.cartItem.quantity || 1) * (reqData.cartItem.price || 0),
        };
      }

      // dispatch optimistic success to merge item locally
      dispatch({ type: ADD_ITEM_TO_CART_SUCCESS, payload: optimisticPayload });

      const { data } = await api.put(`/api/cart/add`, reqData.cartItem, {
        headers: {
          Authorization: `Bearer ${reqData.token}`,
        },
      });
      console.log("add item to cart response", data);
      // Refresh cart state from server to ensure totals and merged items are accurate
      await dispatch(findCart(reqData.token));
    } catch (error) {
      console.error("Error adding item to cart:", error);
      dispatch({ type: ADD_ITEM_TO_CART_FAILURE, payload: error.message });
    }
  };
};
export const updateCartItem = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_CARTITEM_REQUEST });
    try {
      const url = `/api/cart-item/update`;
      // Normalize payload: include both id and cartItemId to match different backend conventions
      const body = {
        ...reqData.data,
        id: reqData.data.id || reqData.data.cartItemId,
        cartItemId: reqData.data.cartItemId || reqData.data.id,
      };
      // Accept either `token` or `jwt` from callers; fallback to localStorage
      const token = reqData.token || reqData.jwt || localStorage.getItem("jwt");
      console.log("Updating cart item - URL:", url, "payload:", body, "token present:", !!token);

      const { data } = await api.put(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("update cart item response", data);
  dispatch({ type: UPDATE_CARTITEM_SUCCESS, payload: data });
  // Refresh cart to ensure UI totals and merged quantities reflect server
  dispatch(findCart(token));
    } catch (error) {
      // Log detailed axios error info for debugging
      console.error("Error updating cart item:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      const payload = error.response?.data || error.message || "Unknown error";
      dispatch({ type: UPDATE_CARTITEM_FAILURE, payload });
    }
  };
};

export const removeCartItem = ({ cartItemId, jwt }) => {
  return async (dispatch) => {
    dispatch({ type: REMOVE_CARTITEM_REQUEST });
    // Optimistic remove so UI updates immediately
    dispatch({ type: REMOVE_CARTITEM_SUCCESS, payload: cartItemId });
    try {
  // Call the server's current delete endpoint `/api/cart-item/{id}remove`.
  await api.delete(`/api/cart-item/${cartItemId}remove`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      await dispatch(findCart(jwt));
      return;
    } catch (error) {
      if (error.response?.status === 404) {
        // Silent: server doesn't expose this endpoint version, but we already removed item locally.
        await dispatch(findCart(jwt));
        return;
      }
      // Unexpected error — log and surface failure for monitoring
      console.error("Error removing cart item:", error);
      await dispatch(findCart(jwt));
      dispatch({ type: REMOVE_CARTITEM_FAILURE, payload: error.message || "Unknown error" });
      return;
    }
  };
};
export const clearCartAction = () => {
  return async (dispatch) => {
    dispatch({ type: CLEAR_CART_REQUEST });
    try {
      const { data } = await api.put(
        `/api/cart/clear`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        }
      );
      console.log("clear cart response", data);
      dispatch({ type: CLEAR_CART_SUCCESS, payload: data });
    } catch (error) {
      console.error("Error clearing cart:", error);
      dispatch({ type: CLEAR_CART_FAILURE, payload: error.message });
    }
  };
};
