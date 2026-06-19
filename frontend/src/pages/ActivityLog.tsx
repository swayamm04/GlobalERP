"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Loader2, RefreshCw, Filter, Calendar } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ActivityLogItem {
    timestamp: string;
    user: string;
    action: string;
    details: string;
    ip: string;
}

const ActivityLog = () => {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = "/api/reports/activity-log";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            
            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const { data } = await api.get(url);
            setLogs(data);
        } catch (error: any) {
            console.error("Error fetching activity logs:", error);
            toast.error(error.response?.data?.message || "Failed to load activity logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [startDate, endDate]);

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ip.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = actionFilter === "all" || log.action === actionFilter;

        return matchesSearch && matchesAction;
    });

    const getActionBadgeColor = (action: string) => {
        const act = action.toUpperCase();
        if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("ADD")) {
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        }
        if (act.includes("UPDATE") || act.includes("EDIT")) {
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        }
        if (act.includes("DELETE") || act.includes("REMOVE")) {
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
        }
        if (act.includes("LOGIN")) {
            return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
        }
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Activity Logs</h1>
                    <p className="text-muted-foreground">Monitor administrative actions and sign-ins across the platform</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Refresh</span>
                </Button>
            </div>

            {/* Filter Section */}
            <Card className="border-sidebar-border/40 bg-sidebar/30 backdrop-blur-sm shadow-md">
                <CardContent className="p-4 grid gap-4 md:grid-cols-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="relative flex items-center">
                        <Filter className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select
                            className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                        >
                            <option value="all">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="relative flex items-center">
                        <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="date"
                            className="pl-9"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Start Date"
                        />
                    </div>

                    {/* End Date */}
                    <div className="relative flex items-center">
                        <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="date"
                            className="pl-9"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="End Date"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Audit Trail Table */}
            <Card className="border-sidebar-border/40 shadow-xl bg-card">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Audit Trail</CardTitle>
                    <CardDescription>
                        {filteredLogs.length} action logs found
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px] pl-6">Timestamp</TableHead>
                                    <TableHead className="w-[200px]">User</TableHead>
                                    <TableHead className="w-[150px]">Action</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="w-[130px] pr-6">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <span className="text-muted-foreground">Loading audit log entries...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            No logs matching filters found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-xs pl-6">{log.timestamp}</TableCell>
                                            <TableCell className="font-medium text-sm">{log.user}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-md truncate md:max-w-xl">{log.details}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground pr-6">{log.ip}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ActivityLog;
