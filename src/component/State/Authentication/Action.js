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
          // use centralized getUser so favorites are merged/persisted consistently
          await dispatch(getUser(loginRes.data.jwt));
        } catch (profileErr) {
          console.warn("Failed to fetch profile after auto-login", profileErr);
        }
  if (loginRes.data.role === "ROLE_RESTAURANT_OWNER") {
          // fetch existing restaurant (if any); new owner gets none and will see create form
            try { await dispatch(getRestaurantByUserId(loginRes.data.jwt)); } catch(e) { /* ignore */ }
          reqData.navigate("/admin/restaurants");
    } 
    reqData.navigate("/");
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
        await dispatch(getUser(data.jwt));
      } catch (profileErr) {
        console.warn("Profile fetch with signup token failed", profileErr);
      }
      const returnTo2 = reqData.returnTo;
      if (data.role === "ROLE_RESTAURANT_OWNER") {
        try { await dispatch(getRestaurantByUserId(data.jwt)); } catch(e) { /* ignore */ }
        reqData.navigate("/admin/restaurants");
      } else {
        if (returnTo2) reqData.navigate(returnTo2); else reqData.navigate("/");
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
    // Fetch full user profile immediately so client favorites and other
    // profile fields are populated after login.
    try { await dispatch(getUser(data.jwt)); } catch (e) { /* ignore */ }
  if (data.role === "ROLE_RESTAURANT_OWNER") {
      try { await dispatch(getRestaurantByUserId(data.jwt)); } catch(e) { /* ignore */ }
      // owner should always go to admin area
      reqData.navigate("/admin/restaurants");
    } 
    reqData.navigate("/");
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
    // Merge server-provided favorites with locally stored favorites.
    // - If server returns a non-empty array, union it with local favorites (server first).
    // - If server returns an empty array or no favorites, preserve local favorites.
    let mergedFavorites = [];
    try {
      const localRaw = localStorage.getItem('favorites');
      const localFavs = localRaw ? JSON.parse(localRaw) : [];
      const serverFavs = Array.isArray(data?.favorites) ? data.favorites : [];
      if (Array.isArray(serverFavs) && serverFavs.length > 0) {
        // union by common id keys
        const keyOf = (it) => {
          if (!it) return '';
          if (typeof it === 'object') return String(it.id || it._id || it.restaurantId || it.restaurant_id || it.rid || '');
          return String(it);
        };
        const map = new Map();
        serverFavs.forEach(it => map.set(keyOf(it), it));
        Array.isArray(localFavs) && localFavs.forEach(it => { const k = keyOf(it); if (!map.has(k)) map.set(k, it); });
        mergedFavorites = Array.from(map.values()).filter(x => x != null && keyOf(x) !== '');
      } else {
        mergedFavorites = Array.isArray(localFavs) ? localFavs : [];
      }
    } catch (e) {
      mergedFavorites = Array.isArray(data?.favorites) && data.favorites.length > 0 ? data.favorites : (localStorage.getItem('favorites') ? JSON.parse(localStorage.getItem('favorites')) : []);
    }

    // attach merged favorites to the profile payload so Redux receives the canonical list
  const profilePayload = { ...(data || {}), favorites: Array.isArray(mergedFavorites) ? mergedFavorites : [] };
    dispatch({ type: GET_USER_SUCCESS, payload: profilePayload });

    // persist lightweight profile for client-side guards
    try {
      localStorage.setItem('user_profile', JSON.stringify(profilePayload));
      if (profilePayload && profilePayload.role) localStorage.setItem('user_role', profilePayload.role);
    } catch (e) { /* ignore */ }
    // persist the merged favorites (if any)
    try {
      if (Array.isArray(mergedFavorites) && mergedFavorites.length > 0) {
        localStorage.setItem('favorites', JSON.stringify(mergedFavorites));
      }
    } catch (e) { /* ignore */ }
    console.log("user profile data:", data);
  } catch (error) {
    dispatch({ type: GET_USER_FAILURE, payload: error });
    console.log("Error in getUser action:", error);
  }
};
export const addToFavorite = ({ jwt, restaurantId }) => async (dispatch, getState) => {
  dispatch({ type: ADD_TO_FAVORITE_REQUEST });
  try {
    // capture previous favorites so we can correctly report whether this
    // toggle resulted in an add or a removal (server endpoint toggles)
    const prevFavorites = (getState && getState().auth && getState().auth.favorites) || [];
    // Let the `api` axios instance attach the Authorization header via interceptor.
    const { data } = await api.put(`/api/restaurants/${restaurantId}/add-favorites`);
    // dispatch the toggle payload to update state
    dispatch({ type: ADD_TO_FAVORITE_SUCCESS, payload: data });
    // Read the canonical favorites array from the updated store and persist that
    try {
      const updatedFavorites = (getState && getState().auth && getState().auth.favorites) || [];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));

      // Decide whether the toggle added or removed the item using available clues.
  const payloadIsArray = Array.isArray(data);
  const payloadId = data && (data.id || data._id || null);

  let actionWas = 'updated favorites';

  if (payloadIsArray) {
        // compare lengths as a best-effort heuristic
        if (updatedFavorites.length > (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Added to favorites';
        else if (updatedFavorites.length < (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Removed from favorites';
        else actionWas = 'Updated favorites';
      } else if (payloadId) {
        const present = updatedFavorites.some(item => item && (item.id || item._id) && (item.id || item._id).toString() === payloadId.toString());
        actionWas = present ? 'Added to favorites' : 'Removed from favorites';
      } else {
        // fallback to length comparison
        if (updatedFavorites.length > (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Added to favorites';
        else if (updatedFavorites.length < (Array.isArray(prevFavorites) ? prevFavorites.length : 0)) actionWas = 'Removed from favorites';
      }

  console.log(actionWas + ':', data);
    } catch (e) { /* ignore */ }
  } catch (error) {
  // Improve error logging to include HTTP status and response body when available
  const status = error?.response?.status;
  const respData = error?.response?.data;
  console.error("Error in addToFavorite action:", { message: error.message, status, respData });
  dispatch({ type: ADD_TO_FAVORITE_FAILURE, payload: respData || error });
  }
};
 
export const logout = () => async (dispatch) => {
 
  try {
  // remove only auth/profile related keys so app-level caches remain intact
  // Keep 'favorites' persisted so users don't lose their saved favorites across
  // logout/login cycles. The server-stored favorites are fetched on login via getUser.
  const keys = ['user_profile','user_role','local_cart_v1','localNotifications','cachedOrders_v1','knownOrderStatuses_v1','seenEvents_v1'];
  // remove localStorage keys (keep 'favorites')
  keys.forEach(k => { try { localStorage.removeItem(k); } catch(e){} });
  // remove JWT from both storages
  try { localStorage.removeItem('jwt'); } catch(e) {}
  try { sessionStorage.removeItem('jwt'); } catch(e) {}
  // clear temporary payment flag if any
  try { localStorage.removeItem('payment_in_progress'); } catch(e) {}
  // clear axios default Authorization header if set
  try { if (api && api.defaults && api.defaults.headers) delete api.defaults.headers.common['Authorization']; } catch(e) {}

  dispatch({ type: LOGOUT });
    console.log("logout successful");
  } catch (error) {
    
    console.log("Error in logout action:", error);
  }
};
