import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { PlusCircle, Search, Download, Eye, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Certificate } from "@shared/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Certificates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Determine if this is the "My Certificates" view
  const isMyCertificates = location === "/my-certificates";

  // Set page title and description based on route
  const pageTitle = isMyCertificates ? "My Certificates" : "Certificates";
  const pageDescription = isMyCertificates 
    ? "View and download your achievement certificates" 
    : "Generate and manage training certificates";

  // Query for either all certificates or just user's certificates
  const queryKey = isMyCertificates 
    ? ["/api/certificates", { userId: user?.id }] 
    : ["/api/certificates"];

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey,
  });

  // Filter certificates based on search query
  const filteredCertificates = certificates.filter(
    (certificate) =>
      certificate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              {pageTitle}
            </h1>
            <p className="text-neutral-dark dark:text-neutral-light">
              {pageDescription}
            </p>
          </div>
          {!isMyCertificates && (user?.role === "admin" || user?.role === "trainer") && (
            <Link href="/create-certificate">
              <Button className="inline-flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Certificate
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-dark dark:text-neutral-light" />
            <Input
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Certificates</TabsTrigger>
            {!isMyCertificates && (user?.role === "admin" || user?.role === "trainer") && (
              <>
                <TabsTrigger value="templates">Certificate Templates</TabsTrigger>
                <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
              </>
            )}
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isMyCertificates ? "Your Certificates" : "Certificate Management"}
                </CardTitle>
                <CardDescription>
                  {isMyCertificates 
                    ? "View and download your earned certificates" 
                    : "View, download and manage all training certificates"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate</TableHead>
                      {!isMyCertificates && <TableHead>Recipient</TableHead>}
                      <TableHead>Program</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.length > 0 ? (
                      filteredCertificates.map((certificate) => (
                        <TableRow key={certificate.id}>
                          <TableCell className="font-medium">
                            {certificate.title}
                          </TableCell>
                          {!isMyCertificates && <TableCell>{certificate.recipient}</TableCell>}
                          <TableCell>{certificate.program}</TableCell>
                          <TableCell>{formatDate(certificate.issueDate)}</TableCell>
                          <TableCell>
                            {certificate.expiryDate
                              ? formatDate(certificate.expiryDate)
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                certificate.status === "Active"
                                  ? "text-green-700 dark:text-green-500"
                                  : certificate.status === "Expired"
                                  ? "text-orange-600 dark:text-orange-500"
                                  : "text-neutral-dark dark:text-neutral-light"
                              }
                            >
                              {certificate.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isMyCertificates ? 6 : 7} className="text-center py-6">
                          No certificates found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-neutral-dark dark:text-neutral-light">
                  Showing {filteredCertificates.length} of {certificates.length} certificates
                </div>
                {certificates.length > 10 && (
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          {!isMyCertificates && (
            <>
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle>Certificate Templates</CardTitle>
                    <CardDescription>Manage certificate templates for different training programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                      Certificate templates coming soon
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>Certificates waiting for approval before issuing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-neutral-dark dark:text-neutral-light">
                      No certificates pending approval
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
