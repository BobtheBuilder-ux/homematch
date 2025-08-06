"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, Mail } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
            <Wrench className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Under Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 leading-relaxed">
            We're currently performing scheduled maintenance to improve your experience. 
            We'll be back online shortly.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Expected downtime: 30-60 minutes</span>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              Need immediate assistance?
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@homematch.com" className="hover:underline">
                support@homematch.com
              </a>
            </div>
          </div>
          
          <div className="pt-4">
            <p className="text-xs text-gray-400">
              Thank you for your patience!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenancePage;