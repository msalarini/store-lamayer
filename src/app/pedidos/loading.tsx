import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function PedidosLoading() {
    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Header Skeleton */}
            <header className="border-b h-16 flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-9 w-24" />
            </header>

            {/* Content Skeleton */}
            <div className="flex-1 flex overflow-hidden">
                {/* Products Grid */}
                <div className="flex-1 p-4 space-y-4">
                    <div className="flex gap-4 mb-6">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-48" />
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-3">
                                        <Skeleton className="h-6 w-3/4" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar Skeleton (Desktop) */}
                <div className="hidden lg:flex w-96 border-l flex-col">
                    <div className="p-4 border-b">
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="flex-1 p-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                    <div className="p-4 border-t space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
