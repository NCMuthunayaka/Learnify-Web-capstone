import { createSlice } from "@reduxjs/toolkit"

const feedbackSlice = createSlice({
    name: "feedback",
    initialState: {
        items:   [],
        loading: false,
        error:   null,
    },
    reducers: {
        setFeedback(state, action)  { state.items   = action.payload },
        addFeedback(state, action)  { state.items.unshift(action.payload) },
        setLoading(state, action)   { state.loading = action.payload },
        setError(state, action)     { state.error   = action.payload },
    },
})

export const { setFeedback, addFeedback, setLoading, setError } = feedbackSlice.actions
export default feedbackSlice.reducer
