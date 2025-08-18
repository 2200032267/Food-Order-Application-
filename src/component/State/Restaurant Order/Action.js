import {
  UPDATE_ORDER_STATUS_REQUEST,
  UPDATE_ORDER_STATUS_SUCCESS,
  UPDATE_ORDER_STATUS_FAILURE,
  UPDATE_ORDER_STATUS_OPTIMISTIC,
  GET_RESTAURANTS_ORDER_REQUEST,
  GET_RESTAURANTS_ORDER_SUCCESS,
  GET_RESTAURANTS_ORDER_FAILURE,
} from "./ActionTypes";
import { api } from "../../config/api";



export const updateOrderStatus = ({ orderId, orderStatus, jwt }) => {
  return async (dispatch) => {
    try {
      // Immediate optimistic update
      dispatch({
        type: UPDATE_ORDER_STATUS_OPTIMISTIC,
        payload: { orderId, orderStatus },
      });
      dispatch({ type: UPDATE_ORDER_STATUS_REQUEST });
      const response = await api.put(
        `api/admin/order/${orderId}/${orderStatus}`,
        {},

        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      const updatedOrder = response.data;
      console.log("Order updated successfully:", updatedOrder);
      dispatch({ type: UPDATE_ORDER_STATUS_SUCCESS, payload: updatedOrder });
    } catch (error) {
      console.error("Error updating order status:", error);
      dispatch({
        type: UPDATE_ORDER_STATUS_FAILURE,
        error,
      });
  // Optionally could refetch orders here to rollback optimistic change
    }
  };
};

export const fetchRestaurantsOrder = ({ restaurantId, orderStatus, jwt }) => {
  return async (dispatch) => {
    try {
      dispatch({ type: GET_RESTAURANTS_ORDER_REQUEST });
      const { data } = await api.get(
        `/api/admin/order/restaurant/${restaurantId}`,
        {
          params: {
            order_status: orderStatus,
          },
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      const orders = data;
      console.log("Orders fetched successfully:", orders);
      dispatch({ type: GET_RESTAURANTS_ORDER_SUCCESS, payload: orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      dispatch({
        type: GET_RESTAURANTS_ORDER_FAILURE,
        error,
      });
    }
  };
};
