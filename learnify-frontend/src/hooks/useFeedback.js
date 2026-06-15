import { useState, useEffect } from "react"
import { getMyFeedback, submitFeedback as apiSubmit } from "../api/feedbackApi"

export default function useFeedback() {
    const [items,   setItems]   = useState([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)

    useEffect(() => {
        getMyFeedback()
            .then(res  => setItems(res.data || []))
            .catch(err => setError(err.response?.data?.message || "Failed to load feedback"))
            .finally(() => setLoading(false))
    }, [])

    async function submitFeedback(formData) {
        const res = await apiSubmit(formData)
        setItems(prev => [res.data, ...prev])
        return res.data
    }

    return { items, loading, error, submitFeedback }
}