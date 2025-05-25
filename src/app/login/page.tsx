
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Landmark, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // If already logged in, redirect from login page
    if (localStorage.getItem('isLoggedIn') === 'true') {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === 'JMD' && password === '311976') {
      localStorage.setItem('isLoggedIn', 'true');
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/');
      router.refresh(); // Refresh to ensure layout re-renders with auth state
    } else {
      setError('Invalid username or password.');
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const [error, setError] = useState(''); // Renamed for clarity

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <LogIn className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Landmark className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">JMD Enterprises</CardTitle>
          <CardDescription>Please login to access your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-secondary/50 focus:bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50 focus:bg-secondary"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full shadow-md" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LogIn className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
