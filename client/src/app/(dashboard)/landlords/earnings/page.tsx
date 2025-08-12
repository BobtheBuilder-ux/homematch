"use client";

import { useState } from "react";
import { useGetAuthUserQuery, useGetLandlordEarningsQuery, useCreateWithdrawalRequestMutation, useGetWithdrawalHistoryQuery } from "@/state/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Banknote, TrendingUp, Home, CreditCard, Download } from "lucide-react";
// Currency formatting using toLocaleString()

const EarningsPage = () => {
  const { data: user } = useGetAuthUserQuery();
  const { data: earnings, isLoading: earningsLoading, error: earningsError } = useGetLandlordEarningsQuery(
    user?.cognitoInfo?.userId || "",
    { skip: !user?.cognitoInfo?.userId }
  );
  const { data: withdrawalHistory, isLoading: withdrawalsLoading } = useGetWithdrawalHistoryQuery(
    user?.cognitoInfo?.userId || "",
    { skip: !user?.cognitoInfo?.userId }
  );
  const [createWithdrawal, { isLoading: withdrawalCreating }] = useCreateWithdrawalRequestMutation();

  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);

  const handleWithdrawalSubmit = async () => {
    if (!user?.cognitoInfo?.userId || !withdrawalAmount) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0) {
      toast.error("Withdrawal amount must be greater than 0");
      return;
    }

    if (earnings && amount > earnings.availableBalance) {
      toast.error("Insufficient balance for withdrawal");
      return;
    }

    try {
      await createWithdrawal({
        cognitoId: user.cognitoInfo.userId,
        amount,
        notes: withdrawalNotes || undefined,
      }).unwrap();
      
      toast.success("Withdrawal request submitted successfully");
      setWithdrawalAmount("");
      setWithdrawalNotes("");
      setIsWithdrawalDialogOpen(false);
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Failed to submit withdrawal request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (earningsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (earningsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading earnings data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Monitor your rental income and manage withdrawals</p>
        </div>
        <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Submit a request to withdraw funds from your available balance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Withdrawal Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {earnings && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Available balance: ₦{earnings.availableBalance.toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsWithdrawalDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdrawalSubmit}
                disabled={withdrawalCreating || !withdrawalAmount}
              >
                {withdrawalCreating ? "Processing..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings ? `₦${earnings.totalEarnings.toLocaleString()}` : "₦0.00"}
            </div>
            <p className="text-xs text-muted-foreground">All-time rental income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings ? `₦${earnings.availableBalance.toLocaleString()}` : "₦0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties Rented</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings ? `${earnings.rentedProperties}/${earnings.totalProperties}` : "0/0"}
            </div>
            <p className="text-xs text-muted-foreground">Currently occupied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings ? `₦${earnings.currentMonthEarnings.toLocaleString()}` : "₦0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Current month income</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            Track your withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
            <div className="space-y-4">
              {withdrawalHistory.map((withdrawal: any) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">₦{withdrawal.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested on {new Date(withdrawal.requestDate).toLocaleDateString()}
                        </p>
                        {withdrawal.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{withdrawal.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(withdrawal.status)}>
                      {withdrawal.status}
                    </Badge>
                    {withdrawal.processedDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Processed: {new Date(withdrawal.processedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No withdrawal requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Submit your first withdrawal request to see it here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsPage;