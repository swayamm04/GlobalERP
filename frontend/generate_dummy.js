const fs = require('fs');
const path = require('path');

const sourceFile = path.resolve(__dirname, 'src', 'pages', 'AddPastOrder.tsx');
const targetFile = path.resolve(__dirname, 'src', 'pages', 'DummyOrders.tsx');

let content = fs.readFileSync(sourceFile, 'utf8');

// Replace component name
content = content.replace(/AddPastOrder/g, 'DummyOrders');
content = content.replace(/Add Past Order/g, 'Dummy Orders');

// Replace heading description
content = content.replace(
    'Enter past order details below. The order will be dated according to the Order Date selected.',
    'Create dummy orders for testing or reporting without affecting main stock. Select a manual date. Dummy orders can be deleted later.'
);

// Add imports for Table, format etc.
content = content.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect } from "react";\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";\nimport { format } from "date-fns";\nimport { Loader2 } from "lucide-react";'
);

// Add state for dummy orders
content = content.replace(
    'const [isSubmitting, setIsSubmitting] = useState(false);',
    'const [isSubmitting, setIsSubmitting] = useState(false);\n    const [dummyOrders, setDummyOrders] = useState<any[]>([]);\n    const [loadingOrders, setLoadingOrders] = useState(true);\n    const [deletingId, setDeletingId] = useState<string | null>(null);'
);

// Add fetch dummy orders function
const fetchOrdersFunction = `
    const fetchDummyOrders = async () => {
        try {
            setLoadingOrders(true);
            const { data } = await api.get("/api/orders");
            const dOrders = data.filter((o: any) => o.isDummy === true);
            setDummyOrders(dOrders);
        } catch (error) {
            console.error("Error fetching dummy orders:", error);
            toast.error("Failed to load dummy orders");
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchDummyOrders();
    }, []);
`;
content = content.replace(
    /useEffect\(\(\) => \{\n\s+fetchData\(\);\n\s+\}, \[\]\);/,
    fetchOrdersFunction
);

// Update orderData to include isDummy and remove isPastOrder
content = content.replace(
    'isPastOrder: true',
    'isDummy: true'
);

// Refresh dummy orders list after creating an order 
content = content.replace(
    'toast.success("Past order saved successfully!");',
    'toast.success("Dummy order saved successfully!");\n            fetchDummyOrders();'
);

// Add delete dummy order handler
const deleteHandler = `
    const handleDeleteOrder = async (id: string) => {
        if (!confirm("Are you sure you want to delete this dummy order?")) return;
        try {
            setDeletingId(id);
            await api.delete(\`/api/orders/\${id}\`);
            toast.success("Dummy order deleted successfully");
            fetchDummyOrders();
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        } finally {
            setDeletingId(null);
        }
    };
`;
content = content.replace(
    'const handleSubmit = async () => {',
    `${deleteHandler}\n\n    const handleSubmit = async () => {`
);

// Add History table
const historyTable = `
            {/* Dummy Orders History Section */}
            <div className="mt-12 space-y-4">
                <h2 className="text-xl font-bold">Dummy Orders History</h2>
                <Card className="shadow-md">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6 py-4">Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingOrders ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">Loading dummy orders...</TableCell>
                                    </TableRow>
                                ) : dummyOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">No dummy orders found</TableCell>
                                    </TableRow>
                                ) : (
                                    dummyOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium px-6">
                                                #{order.id ? order.id.substring(Math.max(0, order.id.length - 6)).toUpperCase() : "N/A"}
                                            </TableCell>
                                            <TableCell>{order.customer}</TableCell>
                                            <TableCell>
                                                {format(new Date(order.date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>{order.itemsCount || 0} Items</TableCell>
                                            <TableCell>₹{(order.amount || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right px-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    disabled={deletingId === order.id}
                                                >
                                                    {deletingId === order.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
`;

content = content.replace('</Card>\n        </div>', `</Card>\n${historyTable}\n        </div>`);

fs.writeFileSync(targetFile, content);
console.log('DummyOrders.tsx generated successfully!');
