import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Log } from "@/types";

export function useLogs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Erro ao carregar histórico");
        } else {
            setLogs(data || []);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, isLoading, refetch: fetchLogs };
}
