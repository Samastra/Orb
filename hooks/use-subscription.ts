import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserSubscription } from "@/types/types";

export function useSubscription() {
    const { user, isLoaded: isUserLoaded } = useUser();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!isUserLoaded || !user?.id) {
                // If user is not loaded yet, keep loading true? Or false?
                // If isUserLoaded is true but no user, then we are done loading (not logged in).
                if (isUserLoaded && !user) setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/user/subscription?clerk_user_id=${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setSubscription(data);
                }
            } catch (error) {
                console.error("Error checking user subscription:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [user, isUserLoaded]);

    const isPaid = subscription &&
        (subscription.payment_status === 'paid' ||
            subscription.plan_type === 'premium' ||
            subscription.plan_type === 'lifetime');

    return { subscription, loading, isPaid };
}
