const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiFetch = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(`${API_BASE_URL}${url}`, options);
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        } else {
            const text = await res.text();
            return { error: `Server returned non-JSON response: ${res.status}`, details: text };
        }
    } catch (error: any) {
        return { error: error.message || "Network Error" };
    }
};
