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
import { addLocalNotification } from '../Notification/Action';
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
    try { 
      await dispatch(getUser(data.jwt));
      // After profile loaded, craft personalized welcome
      // profile will be read from localStorage snapshot instead of store accessor here
      try {
        // Access store via closure import (store not directly available here), so we rely on a quick refetch using api or a second dispatch
        // Simpler: make another getUser call isn't ideal; instead we can read from localStorage user_profile
        let profile = null;
        try { const raw = localStorage.getItem('user_profile'); if (raw) profile = JSON.parse(raw); } catch(e) { /* ignore */ }
        const displayName = profile?.fullName || profile?.name || profile?.username || profile?.email || 'User';
        dispatch(addLocalNotification({ type: 'toast', title: `Welcome back, ${displayName}!`, body: 'Login successful', data: { level: 'success', context: 'login' } }));
      } catch(e) { /* ignore toast errors */ }
    } catch (e) { /* ignore */ }
  if (data.role === "ROLE_RESTAURANT_OWNER") {
      try { await dispatch(getRestaurantByUserId(data.jwt)); } catch(e) { /* ignore */ }
      // owner should always go to admin area
      reqData.navigate("/admin/restaurants");
    } 
    reqData.navigate("/");
    console.log("login sucess", data);
  } catch (error) {
    dispatch({ type: LOGIN_FAILURE, payload: error });
  const status = error?.response?.status;
  const message = (error?.response?.data && (error.response.data.message || error.response.data.error)) || error.message || '';
  const lowerMsg = (message || '').toLowerCase();
  // heuristics
  const userNotFound = status === 404 || /user not found|no such user|not registered|email does not exist/i.test(lowerMsg);
  const wrongPassword = /invalid password|bad credentials|password mismatch|wrong password/i.test(lowerMsg) && !userNotFound;
  const wrongEmailFormat = /invalid email|email format/i.test(lowerMsg);
  const genericInvalid = status === 401 || status === 403 || /invalid credentials|unauthorized/i.test(lowerMsg);
    try {
      if (userNotFound) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Credentials', body: 'User does not exist. Register first.', data: { level: 'error', context: 'login', action: 'suggest-register' } }));
      } else if (wrongPassword) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Password', body: 'Enter correct password.', data: { level: 'error', context: 'login' } }));
      } else if (wrongEmailFormat) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Email', body: 'Enter a valid email address.', data: { level: 'error', context: 'login' } }));
      } else if (genericInvalid) {
        dispatch(addLocalNotification({ type: 'toast', title: 'Invalid Credentials', body: 'Check email & password.', data: { level: 'error', context: 'login' } }));
      } else {
        dispatch(addLocalNotification({ type: 'toast', title: 'Login Error', body: 'Unable to login.', data: { level: 'error', context: 'login' } }));
      }
    } catch (e) { /* ignore */ }
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
      // user id (string) used for scoping favorites key
      const uid = (data && (data.id || data._id || data.userId || data.user_id)) ? String(data.id || data._id || data.userId || data.user_id) : null;
      const legacyRaw = localStorage.getItem('favorites');
      let legacyFavs = [];
      try { legacyFavs = legacyRaw ? JSON.parse(legacyRaw) : []; } catch (e) { legacyFavs = []; }
      const scopedKey = uid ? `favorites_${uid}` : null;
      let scopedFavs = [];
      if (scopedKey) {
        try {
          const scopedRaw = localStorage.getItem(scopedKey);
          scopedFavs = scopedRaw ? JSON.parse(scopedRaw) : [];
        } catch (e) { scopedFavs = []; }
      }
      const serverFavs = Array.isArray(data?.favorites) ? data.favorites : [];
      const keyOf = (it) => {
        if (!it) return '';
        if (typeof it === 'object') return String(it.id || it._id || it.restaurantId || it.restaurant_id || it.rid || '');
        return String(it);
      };
      const map = new Map();
      // server favorites first (authoritative)
      serverFavs.forEach(it => map.set(keyOf(it), it));
      // then scoped stored favorites
      scopedFavs.forEach(it => { const k = keyOf(it); if (k && !map.has(k)) map.set(k, it); });
      // then legacy if still present
      legacyFavs.forEach(it => { const k = keyOf(it); if (k && !map.has(k)) map.set(k, it); });
      mergedFavorites = Array.from(map.values()).filter(x => x && keyOf(x));
      // persist under scoped key only; remove legacy global key (migration)
      if (scopedKey) {
        try { localStorage.setItem(scopedKey, JSON.stringify(mergedFavorites)); } catch (e) { /* ignore */ }
      }
      try { localStorage.removeItem('favorites'); } catch (e) { /* ignore */ }
    } catch (e) {
      mergedFavorites = Array.isArray(data?.favorites) && data.favorites.length > 0 ? data.favorites : [];
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
    // For backward compatibility some components still read 'favorites' directly; write a lightweight copy
    try { localStorage.setItem('favorites', JSON.stringify(mergedFavorites || [])); } catch (e) { /* ignore */ }
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
  // remove auth/profile related keys AND legacy global favorites to avoid leakage to next user
  const keys = ['user_profile','user_role','local_cart_v1','localNotifications','cachedOrders_v1','knownOrderStatuses_v1','seenEvents_v1','favorites'];
  keys.forEach(k => { try { localStorage.removeItem(k); } catch(e){} });
  // remove JWT from both storages
  try { localStorage.removeItem('jwt'); } catch(e) {}
  try { sessionStorage.removeItem('jwt'); } catch(e) {}
  // clear temporary payment flag if any
  try { localStorage.removeItem('payment_in_progress'); } catch(e) {}
  // clear axios default Authorization header if set
  try { if (api && api.defaults && api.defaults.headers) delete api.defaults.headers.common['Authorization']; } catch(e) {}

  // capture profile before clearing so we can personalize message
  let profileName = null;
  try { const raw = localStorage.getItem('user_profile'); if (raw) { const p = JSON.parse(raw); profileName = p.fullName || p.name || p.username || p.email || null; } } catch(e) { /* ignore */ }
  dispatch({ type: LOGOUT });
  try {
    if (profileName) {
      dispatch(addLocalNotification({ type: 'toast', title: `Logout Successful`, body: `${profileName} has been logged out.`, data: { level: 'error', context: 'logout' } }));
    } else {
      dispatch(addLocalNotification({ type: 'toast', title: 'Logout Successful', body: 'Logged out.', data: { level: 'error', context: 'logout' } }));
    }
  } catch(e) { /* ignore */ }
  console.log("logout successful");
  } catch (error) {
    
    console.log("Error in logout action:", error);
  }
};
