
import { api } from "../../config/api";
import {
  CREATE_ORDER_FAILURE,
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  GET_USERS_NOTIFICATION_FAILURE,
  GET_USERS_NOTIFICATION_SUCCESS,
  GET_USERS_ORDERS_FAILURE,
  GET_USERS_ORDERS_REQUEST,
  GET_USERS_ORDERS_SUCCESS,
} from "./ActionTypes";

export const createOrder = (reqData) => {
  return async (dispatch) => {
    dispatch({ type: CREATE_ORDER_REQUEST });
    try {
  console.log("createOrder payload ->", reqData);
      if (!reqData || !reqData.order) {
        const msg = "createOrder failed: missing order payload";
        console.error(msg, reqData);
        dispatch({ type: CREATE_ORDER_FAILURE, payload: msg });
        return;
      }
      if (!reqData.order.restaurantId) {
        const msg = "createOrder failed: missing restaurantId in order payload";
        console.error(msg, reqData.order);
        dispatch({ type: CREATE_ORDER_FAILURE, payload: msg });
        return;
      }
      const { data } = await api.post(`/api/order`, reqData.order, {
        headers: {
          Authorization: `Bearer ${reqData.token}`,
        },
      });
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
      console.log("create order data", data);
      dispatch({ type: CREATE_ORDER_SUCCESS, payload: data });
    } catch (error) {
      const payload = error?.response?.data || error.message || error;
      console.error("createOrder failed ->", error);
      dispatch({ type: CREATE_ORDER_FAILURE, payload });
    }
  };
};

export const getUsersOrders=(jwt)=>{
    return async (dispatch) => {
        dispatch({ type: GET_USERS_ORDERS_REQUEST });
        try {
            const {data} = await api.get(`/api/order/user`, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });
            console.log("get users orders data", data);
            dispatch({ type: GET_USERS_ORDERS_SUCCESS, payload:data });
        } catch (error) {
            console.error("Error fetching user orders:", error);
            dispatch({ type: GET_USERS_ORDERS_FAILURE, payload: error });
        }   
    };
}

