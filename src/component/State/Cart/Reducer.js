import { LOGOUT } from "../Authentication/ActionType";
import * as actionTypes from "./ActionTypes";

const initialState = {
  cart: null,
  cartItems: [],
  loading: false,
  error: null,
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.FIND_CART_REQUEST:
    case actionTypes.GET_ALL_CART_ITEMS_REQUEST:
    case actionTypes.UPDATE_CARTITEM_REQUEST:
    case actionTypes.REMOVE_CARTITEM_REQUEST:
      return {
        ...state,

        loading: true,
        error: null,
      };
    case actionTypes.FIND_CART_SUCCESS:
    case actionTypes.CLEAR_CART_SUCCESS:
      return {
        ...state,
        loading: false,
        cart: action.payload,
        cartItems: action.payload.items,
      };
    case actionTypes.ADD_ITEM_TO_CART_SUCCESS: {
      const payload = action.payload || {};
      // If server returned full cart, replace
      if (payload.items && Array.isArray(payload.items)) {
        const priceSum = payload.items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
        return {
          ...state,
          loading: false,
          cart: { ...payload, price: priceSum, total: payload.total ?? priceSum },
          cartItems: payload.items,
        };
      }

      // Otherwise payload may be an optimistic single cartItem (merge)
      const addedItem = payload;
      const existsIndex = state.cartItems.findIndex((i) => i.id === addedItem.id || (i.food && i.food.id === addedItem.food?.id));
      let newCartItems;
      if (existsIndex !== -1) {
        newCartItems = state.cartItems.map((i) =>
          i.id === addedItem.id || (i.food && i.food.id === addedItem.food?.id) ? { ...i, ...addedItem } : i
        );
      } else {
        newCartItems = [addedItem, ...state.cartItems];
      }
      const priceSum = newCartItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
      return {
        ...state,
        loading: false,
        cartItems: newCartItems,
        cart: { ...state.cart, price: priceSum, total: priceSum },
      };
    }
    case actionTypes.UPDATE_CARTITEM_SUCCESS:
      {
        const updatedItems = state.cartItems.map((item) => (item.id === action.payload.id ? action.payload : item));
        const priceSum = updatedItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
        return {
          ...state,
          loading: false,
          cartItems: updatedItems,
          cart: { ...state.cart, price: priceSum, total: priceSum },
        };
      }
  case actionTypes.REMOVE_CARTITEM_SUCCESS:
      {
        const newCartItems = state.cartItems.filter((item) => item.id !== action.payload);
        const priceSum = newCartItems.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
        return {
          ...state,
          loading: false,
          cartItems: newCartItems,
          cart: { ...state.cart, price: priceSum, total: priceSum },
        };
      }
    case actionTypes.FIND_CART_FAILURE:
    case actionTypes.UPDATE_CARTITEM_FAILURE:
    case actionTypes.REMOVE_CARTITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case LOGOUT:
      localStorage.removeItem("jwt");
      return {
        ...state,
        cartItems: [],
        cart: null,
        success: "logout successfully",
      };
    default:
      return state;
  }
};
export default cartReducer;