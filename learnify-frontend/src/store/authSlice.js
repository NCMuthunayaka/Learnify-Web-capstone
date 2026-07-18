import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../api/authApi'

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await authApi.register(formData)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout(state) {
      state.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const handlePending  = (state) => { state.loading = true;  state.error = null }
    const handleRejected = (state, action) => { state.loading = false; state.error = action.payload }
    const handleFulfilled = (state, action) => {
      state.loading = false
      state.user    = action.payload.user
      localStorage.setItem('access_token',  action.payload.access_token)
      localStorage.setItem('refresh_token', action.payload.refresh_token)
    }

    builder
      .addCase(registerUser.pending,   handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected,  handleRejected)
      .addCase(loginUser.pending,      handlePending)
      .addCase(loginUser.fulfilled,    handleFulfilled)
      .addCase(loginUser.rejected,     handleRejected)
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
