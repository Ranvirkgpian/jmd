"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Landmark, LogIn, Loader2, User, Lock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { loginAction } from './actions';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  // Initialize state from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('isLoggedIn') === 'true') {
      router.push('/');
    }

    const storedAttempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    const storedLockout = localStorage.getItem('loginLockoutTime');

    if (storedLockout) {
      const lockout = parseInt(storedLockout, 10);
      if (Date.now() < lockout) {
        setLockoutTime(lockout);
      } else {
        // Lockout expired while away
        localStorage.removeItem('loginLockoutTime');
        localStorage.removeItem('loginAttempts');
        setAttempts(0);
      }
    } else {
      setAttempts(storedAttempts);
    }
  }, [router]);

  // Check for lockout expiration periodically
  useEffect(() => {
    if (!lockoutTime) return;

    const interval = setInterval(() => {
      if (Date.now() >= lockoutTime) {
        setLockoutTime(null);
        setAttempts(0);
        setError('');
        localStorage.removeItem('loginLockoutTime');
        localStorage.removeItem('loginAttempts');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Double check lockout just in case
    if (lockoutTime) {
      if (Date.now() < lockoutTime) {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 60000);
        setError(`Too many failed attempts. Try again in ${remaining} minutes.`);
        return;
      } else {
        // Should be handled by useEffect, but safe fallback
        setLockoutTime(null);
        setAttempts(0);
        localStorage.removeItem('loginLockoutTime');
        localStorage.removeItem('loginAttempts');
      }
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const result = await loginAction(formData);

    if (result.success) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockoutTime');

      toast({
        title: "Welcome to JMD Enterprises",
        description: "You have successfully logged in.",
      });
      router.push('/');
      router.refresh();
    } else {
      // Use callback to ensure we have latest attempts value if multiple rapid clicks were possible (though disabled while loading)
      const currentAttempts = attempts + 1;
      setAttempts(currentAttempts);
      localStorage.setItem('loginAttempts', currentAttempts.toString());

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION;
        setLockoutTime(lockTime);
        localStorage.setItem('loginLockoutTime', lockTime.toString());
        setError(`Too many failed attempts. Try again in 15 minutes.`);
        toast({
          title: "Account Locked",
          description: "Too many failed login attempts.",
          variant: "destructive",
        });
      } else {
        const remaining = MAX_ATTEMPTS - currentAttempts;
        setError(`Invalid credentials. ${remaining} attempts remaining.`);
        toast({
          title: "Authentication Failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate remaining minutes for display
  const remainingMinutes = lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 60000) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" /> {/* Top Accent Bar */}

          <CardHeader className="text-center space-y-4 pt-8 pb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mx-auto"
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg inline-block">
                <Landmark className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                JMD Enterprises
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Secure access for authorized personnel
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 px-8">
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-2"
              >
                <Label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Username
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={!!lockoutTime}
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                  />
                </div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center ml-1">
                   <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!!lockoutTime}
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                  />
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 py-2 px-3 rounded-md border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2">
                       {lockoutTime ? <AlertTriangle className="h-4 w-4" /> : null}
                       {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="pb-8 px-8 pt-2">
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="w-full"
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isLoading || !!lockoutTime}
                >
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </motion.div>
                  ) : lockoutTime ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <Lock className="mr-2 h-5 w-5" />
                      Locked ({remainingMinutes}m)
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </form>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400"
        >
          &copy; {new Date().getFullYear()} JMD Enterprises. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
