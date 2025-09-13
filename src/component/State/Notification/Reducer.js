import {
  GET_NOTIFICATIONS_REQUEST,
  GET_NOTIFICATIONS_SUCCESS,
  GET_NOTIFICATIONS_FAILURE,
  MARK_NOTIFICATION_READ_REQUEST,
  MARK_NOTIFICATION_READ_SUCCESS,
  MARK_NOTIFICATION_READ_FAILURE,
  DELETE_NOTIFICATION_SUCCESS,
  CLEAR_NOTIFICATIONS_SUCCESS,
  ADD_NOTIFICATION,
} from './ActionTypes';

const persisted = (() => {
  try {
    const raw = localStorage.getItem('localNotifications');
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [];
})();

const initialState = {
  loading: false,
  notifications: persisted || [],
  error: null,
};

export const notificationReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_NOTIFICATIONS_REQUEST:
      return { ...state, loading: true, error: null };
    case GET_NOTIFICATIONS_SUCCESS:
      // merge server/local payload with existing notifications, dedupe by id
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const map = new Map();
      // keep incoming first
      incoming.forEach(n => map.set(n.id, n));
      state.notifications.forEach(n => { if (!map.has(n.id)) map.set(n.id, n); });
      return { ...state, loading: false, notifications: Array.from(map.values()), error: null };
    case ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case GET_NOTIFICATIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case MARK_NOTIFICATION_READ_REQUEST:
      return state;
    case MARK_NOTIFICATION_READ_SUCCESS:
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case MARK_NOTIFICATION_READ_FAILURE:
      return state;
    case DELETE_NOTIFICATION_SUCCESS:
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case CLEAR_NOTIFICATIONS_SUCCESS:
      return { ...state, notifications: [] };
    default:
      return state;
  }
};
