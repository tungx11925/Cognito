const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
    try {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const finalUrl = normalizedEndpoint.startsWith('/api/')
            ? `${API_BASE_URL.replace(/\/api$/, '')}${normalizedEndpoint}`
            : `${API_BASE_URL}${normalizedEndpoint}`;

        console.log('>>> [apiFetch] calling:', finalUrl);
        const res = await fetch(finalUrl, options);
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
