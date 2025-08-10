"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGetAgentClientsQuery } from "@/state/api";
import { Phone, Mail, Eye, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Clients = () => {
  const {
    data: clients,
    isLoading,
    isError,
  } = useGetAgentClientsQuery();

  if (isLoading) return <Loading />;
  if (isError || !clients) return <div>Error loading clients</div>;

  return (
    <div className="dashboard-container">
      <Header
        title="Client Management"
        subtitle="Manage your assigned clients and their properties"
      />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client: any) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/landing-i1.png"
                      alt={client.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={client.type === "landlord" ? "default" : "secondary"}>
                    {client.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.propertiesCount} properties</div>
                    <div className="text-sm text-gray-500">
                      ₦{client.totalValue?.toLocaleString()} total value
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={client.status === "active" ? "default" : "secondary"}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(client.lastContact).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Link href={`/agent/clients/${client.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clients;