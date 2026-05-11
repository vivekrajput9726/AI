import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from 'redux'

import authReducer from './slices/authSlice'
import doctorReducer from './slices/doctorSlice'
import appointmentReducer from './slices/appointmentSlice'
import aiReducer from './slices/aiSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  doctors: doctorReducer,
  appointments: appointmentReducer,
  ai: aiReducer,
})

const persistConfig = {
  key: 'aihealthcare',
  storage,
  whitelist: ['auth'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)
