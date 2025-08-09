'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Home, ArrowRight } from 'lucide-react';

const ComingSoonPage = () => {
  const [selectedUserType, setSelectedUserType] = useState<'tenant' | 'landlord' | null>(null);

  const tenantPainPoints = [
    "Fake listings that waste your time and money",
    "Outrageous agent fees that drain your savings",
    "Endless trips to see properties that don't exist",
    "Unreliable agents who disappear after payment",
    "Hidden costs that appear at the last minute",
    "Properties that look nothing like the photos"
  ];

  const landlordPainPoints = [
    "Unreliable agents who don't screen tenants properly",
    "Empty apartments costing you money every month",
    "Late rent payments and difficult tenants",
    "High agent commissions eating into your profits",
    "Poor property marketing and low visibility",
    "Lack of direct communication with potential tenants"
  ];

  if (selectedUserType === 'tenant') {
    return <TenantPage onBack={() => setSelectedUserType(null)} />;
  }

  if (selectedUserType === 'landlord') {
    return <LandlordPage onBack={() => setSelectedUserType(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
            Coming Soon
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-primary-800 mb-6">
            Homematch
          </h1>
          <p className="text-xl md:text-2xl text-primary-600 mb-8 max-w-3xl mx-auto">
            Nigeria&apos;s direct rental platform connecting tenants and landlords without the middleman
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Tenant Card */}
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-secondary-500">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Users className="w-8 h-8 text-secondary-600" />
              </div>
              <CardTitle className="text-2xl text-primary-800">I&apos;m a Tenant</CardTitle>
              <CardDescription className="text-primary-600">
                Looking for a place to rent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {tenantPainPoints.slice(0, 3).map((point, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-primary-700">{point}</span>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => setSelectedUserType('tenant')}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white"
                size="lg"
              >
                Get Started as Tenant
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Landlord Card */}
          <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-secondary-500">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Home className="w-8 h-8 text-secondary-600" />
              </div>
              <CardTitle className="text-2xl text-primary-800">I&apos;m a Landlord</CardTitle>
              <CardDescription className="text-primary-600">
                I have properties to rent out
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                {landlordPainPoints.slice(0, 3).map((point, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-primary-700">{point}</span>
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => setSelectedUserType('landlord')}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white"
                size="lg"
              >
                Get Started as Landlord
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-primary-600">
          <p className="mb-2">Join thousands of Nigerians who are ready for change</p>
          <p className="text-sm">Be the first to know when we launch</p>
        </div>
      </div>
    </div>
  );
};

// Tenant Page Component
const TenantPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={onBack}
          variant="outline" 
          className="mb-8"
        >
          ← Back to Home
        </Button>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-800 mb-6">
            House Hunting in Nigeria is Broken. Let&apos;s Fix It Together.
          </h1>
          <p className="text-xl md:text-2xl text-primary-600 mb-8">
            No more fake listings. No more outrageous agent fees. No more wasted trips.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-800">We Know Your Pain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Fake listings that waste your time and money",
                "Outrageous agent fees that drain your savings",
                "Endless trips to see properties that don't exist",
                "Unreliable agents who disappear after payment",
                "Hidden costs that appear at the last minute",
                "Properties that look nothing like the photos"
              ].map((point, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-primary-700">{point}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/coming-soon/tenant-survey">
            <Button 
              className="bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-4 text-lg"
              size="lg"
            >
              I&apos;m a Tenant – Start Survey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Landlord Page Component
const LandlordPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={onBack}
          variant="outline" 
          className="mb-8"
        >
          ← Back to Home
        </Button>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-800 mb-6">
            Finding Good Tenants Shouldn&apos;t Be This Hard. Let&apos;s Change That.
          </h1>
          <p className="text-xl md:text-2xl text-primary-600 mb-8">
            No more unreliable agents. No more empty apartments. No more late rent headaches.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-800">We Understand Your Struggles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Unreliable agents who don't screen tenants properly",
                "Empty apartments costing you money every month",
                "Late rent payments and difficult tenants",
                "High agent commissions eating into your profits",
                "Poor property marketing and low visibility",
                "Lack of direct communication with potential tenants"
              ].map((point, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <span className="text-primary-700">{point}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/coming-soon/landlord-survey">
            <Button 
              className="bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-4 text-lg"
              size="lg"
            >
              I&apos;m a Landlord – Start Survey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;