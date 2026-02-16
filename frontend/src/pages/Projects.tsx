import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, Plus, CreditCard, History, MoreVertical, XCircle, CheckCircle2, Download } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generatePaymentStatement } from "@/lib/invoiceGenerator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
    _id: string;
    projectName: string;
    customerName: string;
    location: string;
    numLabours: number;
    grandAmount: number;
    paidAmount: number;
    balanceDue: number;
    status: string;
    paymentHistory: Array<{
        amount: number;
        date: string;
        method: string;
    }>;
    createdAt: string;
}

const Projects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment Modal State
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [newPaymentAmount, setNewPaymentAmount] = useState("");
    const [newPaymentMethod, setNewPaymentMethod] = useState("Cash");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [isDownloadingStatement, setIsDownloadingStatement] = useState(false);

    const [formData, setFormData] = useState({
        projectName: "",
        customerName: "",
        location: "",
        numLabours: "",
        grandAmount: "",
        paidAmount: "0",
        paymentMethod: "Cash"
    });

    const fetchProjects = async () => {
        try {
            const { data } = await api.get("/api/projects");
            setProjects(data);
        } catch (error) {
            console.error("Error fetching projects:", error);
            toast.error("Failed to load projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const filteredProjects = useMemo(() => {
        return projects.filter(p =>
            p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [projects, searchTerm]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/api/projects", {
                ...formData,
                numLabours: Number(formData.numLabours),
                grandAmount: Number(formData.grandAmount),
                paidAmount: Number(formData.paidAmount)
            });
            toast.success("Project created successfully");
            setIsCreateModalOpen(false);
            setFormData({
                projectName: "",
                customerName: "",
                location: "",
                numLabours: "",
                grandAmount: "",
                paidAmount: "0",
                paymentMethod: "Cash"
            });
            fetchProjects();
        } catch (error) {
            toast.error("Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (projectId: string, status: string) => {
        try {
            await api.patch(`/api/projects/${projectId}/status`, { status });
            toast.success(`Project marked as ${status}`);
            fetchProjects();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleAddPayment = async () => {
        if (!selectedProject || !newPaymentAmount || parseFloat(newPaymentAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const amount = parseFloat(newPaymentAmount);
        if (amount > selectedProject.balanceDue) {
            toast.error("Payment amount exceeds balance due");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            await api.patch(`/api/projects/${selectedProject._id}/payment`, {
                amount,
                method: newPaymentMethod
            });
            toast.success("Payment recorded successfully");
            setIsPaymentModalOpen(false);
            setNewPaymentAmount("");
            fetchProjects();
        } catch (error) {
            toast.error("Failed to add payment");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleDownloadStatement = async (project: Project) => {
        setIsDownloadingStatement(true);
        try {
            const { data: companyDetails } = await api.get("/api/company-settings");

            await generatePaymentStatement({
                customerName: project.customerName,
                contact: project.location, // Using location as a substitute if contact is missing
                address: project.location,
                orderId: project._id,
                totalAmount: project.grandAmount,
                paymentHistory: project.paymentHistory || [],
                companyDetails: companyDetails,
                projectName: project.projectName,
                isProject: true
            });
            toast.success("Payment statement downloaded");
        } catch (error) {
            console.error("Error generating statement:", error);
            toast.error("Failed to generate statement");
        } finally {
            setIsDownloadingStatement(false);
        }
    };

    const openPaymentModal = (project: Project) => {
        setSelectedProject(project);
        setNewPaymentAmount("");
        setIsPaymentModalOpen(true);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Completed": return "default";
            case "Processing": return "secondary";
            case "Cancelled": return "destructive";
            default: return "outline";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects Management</h1>
                    <p className="text-muted-foreground">Track ongoing projects, labor, and payments</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Project
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">Project Name</TableHead>
                                    <TableHead className="whitespace-nowrap">Customer</TableHead>
                                    <TableHead className="whitespace-nowrap">Location</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Labours</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Grand Amount</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Balance Due</TableHead>
                                    <TableHead className="whitespace-nowrap">Status</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No projects found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <TableRow key={project._id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium whitespace-nowrap">{project.projectName}</TableCell>
                                            <TableCell className="whitespace-nowrap">{project.customerName}</TableCell>
                                            <TableCell className="whitespace-nowrap">{project.location}</TableCell>
                                            <TableCell className="text-center whitespace-nowrap">{project.numLabours}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap">₹{project.grandAmount.toLocaleString()}</TableCell>
                                            <TableCell className={cn("text-right font-semibold whitespace-nowrap", project.balanceDue > 0 ? "text-destructive" : "text-green-600")}>
                                                ₹{project.balanceDue.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Badge variant={getStatusVariant(project.status)}>
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {project.balanceDue > 0 && (
                                                            <DropdownMenuItem onClick={() => openPaymentModal(project)} className="text-blue-600">
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                                Add Payment
                                                            </DropdownMenuItem>
                                                        )}
                                                        {project.status !== "Completed" && (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(project._id, "Completed")} className="text-green-600">
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Mark Completed
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(project._id, "Cancelled")} className="text-destructive">
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancel Project
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Project Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Add New Project</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Project Name</Label>
                                    <Input
                                        required
                                        value={formData.projectName}
                                        onChange={e => setFormData(f => ({ ...f, projectName: e.target.value }))}
                                        placeholder="e.g. Metro Station Gate"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Customer Name</Label>
                                    <Input
                                        required
                                        value={formData.customerName}
                                        onChange={e => setFormData(f => ({ ...f, customerName: e.target.value }))}
                                        placeholder="Client Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input
                                        required
                                        value={formData.location}
                                        onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                                        placeholder="Site Location"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>No. of Labours</Label>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.numLabours}
                                        onChange={e => setFormData(f => ({ ...f, numLabours: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Grand Amount (₹)</Label>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.grandAmount}
                                        onChange={e => setFormData(f => ({ ...f, grandAmount: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Advance Paid (₹)</Label>
                                    <Input
                                        type="number"
                                        value={formData.paidAmount}
                                        onChange={e => setFormData(f => ({ ...f, paidAmount: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={formData.paymentMethod} onValueChange={v => setFormData(f => ({ ...f, paymentMethod: v }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Project"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Project Payment Details</DialogTitle>
                    </DialogHeader>
                    {selectedProject && (
                        <>
                            <div className="p-6 pt-4 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4 bg-primary/5 text-center col-span-2">
                                        <p className="text-sm text-muted-foreground uppercase font-semibold mb-1">Grand Total</p>
                                        <p className="text-3xl font-bold text-primary">₹{selectedProject.grandAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-green-50/50 text-center">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Total Paid</p>
                                        <p className="text-xl font-bold text-green-600">₹{selectedProject.paidAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-red-50/50 text-center">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Balance Due</p>
                                        <p className="text-xl font-bold text-destructive">₹{selectedProject.balanceDue.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-lg p-4">
                                    <h3 className="font-semibold flex items-center gap-2">Add New Payment</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Method</Label>
                                            <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Online">Online</SelectItem>
                                                    <SelectItem value="Card">Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount</Label>
                                            <Input
                                                type="number"
                                                placeholder="Enter amount"
                                                value={newPaymentAmount}
                                                onChange={(e) => setNewPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button className="w-full" disabled={isSubmittingPayment} onClick={handleAddPayment}>
                                        {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                                        Record Payment
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <History className="h-4 w-4" /> Payment History (Recent First)
                                        </h3>
                                        {selectedProject.paymentHistory && selectedProject.paymentHistory.length > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-2"
                                                onClick={() => handleDownloadStatement(selectedProject)}
                                                disabled={isDownloadingStatement}
                                            >
                                                {isDownloadingStatement ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                                Download Ledger
                                            </Button>
                                        )}
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="bg-muted/50 sticky top-0">
                                                <TableRow>
                                                    <TableHead className="py-2">Date</TableHead>
                                                    <TableHead className="py-2">Method</TableHead>
                                                    <TableHead className="py-2 text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedProject.paymentHistory.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No history found</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    [...selectedProject.paymentHistory]
                                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                        .map((history, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell className="py-2">{format(new Date(history.date), 'dd/MM/yyyy')}</TableCell>
                                                                <TableCell className="py-2">{history.method}</TableCell>
                                                                <TableCell className="py-2 text-right font-medium">₹{history.amount.toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 pt-0 border-t bg-muted/5">
                                <DialogFooter className="sm:justify-start">
                                    <Button variant="outline" className="w-full" onClick={() => setIsPaymentModalOpen(false)}>Close</Button>
                                </DialogFooter>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Projects;
