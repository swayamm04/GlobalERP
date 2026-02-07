import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  customer: string;
  items: number;
  amount: number;
  status: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Completed":
      return "default";
    case "Processing":
      return "secondary";
    case "Pending":
      return "outline";
    case "Shipped":
      return "default";
    default:
      return "secondary";
  }
};

export const RecentOrders = ({ orders }: RecentOrdersProps) => {
  return (
    <Card className="flex flex-col h-full border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">Recent Orders</CardTitle>
          <CardDescription>Latest customer transactions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="/orders">View All</a>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[100px] hidden sm:table-cell">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium hidden sm:table-cell text-muted-foreground">
                    #{typeof order.id === 'string' ? order.id.substring(Math.max(0, order.id.length - 6)).toUpperCase() : "N/A"}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{order.customer}</TableCell>
                  <TableCell className="whitespace-nowrap">{order.items} Items</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">₹{(order.amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Badge variant={getStatusVariant(order.status)} className="font-medium">
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No recent orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
