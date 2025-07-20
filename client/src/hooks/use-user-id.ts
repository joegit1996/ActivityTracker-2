import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { getCookie } from "@/lib/utils";

interface UseUserIdResult {
  userId: string | undefined;
  error: string | null;
  loading: boolean;
}

/**
 * Custom hook to robustly extract the userId for the progress page.
 * - Tries to get userId from the URL params first (must be non-empty and not a placeholder).
 * - If not present or is a placeholder, tries to get a token from the _xyzW cookie and fetch userId from the external API.
 * - If userId is resolved from the cookie flow, updates the URL to include it.
 * - Returns { userId, error, loading }.
 */
export function useUserId(): UseUserIdResult {
  // Try to get userId from URL params
  const params = useParams();
  const [location, setLocation] = useLocation();
  const urlUserId = params.userId;
  const isPlaceholder = urlUserId === undefined || urlUserId === "" || urlUserId === "{{userid}}";
  const [userId, setUserId] = useState<string | undefined>(!isPlaceholder ? urlUserId : undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(isPlaceholder);

  useEffect(() => {
    if (!isPlaceholder) {
      setUserId(urlUserId);
      setLoading(false);
      setError(null);
      return;
    }
    // Fallback: get token from cookie and fetch userId from external API
    const token = getCookie("_xyzW");
    console.log("[useUserId] Token from _xyzW cookie:", token);
    if (!token) {
      setError("No token found in _xyzW cookie");
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log('[useUserId] Triggering external API call for userId');
    fetch('/external-api/api/v1/users/auth/user', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'application-source': 'q84sale',
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
        'device-id': 'web_user_0ca45faf-56f8-4ac6-80ef-b5a8e1ebb92b',
        'origin': 'https://www.q84sale.com',
        'priority': 'u=1, i',
        'referer': 'https://www.q84sale.com/',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': navigator.userAgent,
        'version-number': 'web',
        'x-custom-authorization': 'com.forsale.forsale.web 1752574771 e9a6806fa169c33b0345afb4618970377acf6996',
      },
    })
      .then(async (res) => {
        console.log('[useUserId] Response status:', res.status);
        console.log('[useUserId] Response headers:', Array.from(res.headers.entries()));
        let bodyText = await res.text();
        console.log('[useUserId] Response body:', bodyText);
        let data;
        try {
          data = JSON.parse(bodyText);
        } catch (e) {
          throw new Error('Invalid JSON response');
        }
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${data?.message || ''}`);
        }
        const resolvedUserId = data?.data?.user?.user_id;
        if (resolvedUserId) {
          setUserId(String(resolvedUserId));
          setError(null);
          // Update the URL to include the resolved userId if it was a placeholder
          if (isPlaceholder) {
            // Try to preserve campaignId and other params
            const newPath = location.replace(/\/progress\/(?:{{userid}})?\/?(\d+)?/, `/progress/${resolvedUserId}/$1`).replace(/\/\/+/, '/');
            setLocation(newPath, { replace: true });
          }
        } else {
          setError('user_id not found in API response');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useUserId] Error fetching userId from external API:', err);
        setError(err.message || 'Failed to fetch user info from external API');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlUserId, location]);

  return { userId, error, loading };
} 