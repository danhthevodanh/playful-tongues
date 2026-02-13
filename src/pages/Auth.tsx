import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Check your email! 📧",
          description: "We sent you a verification link. Click it to get started!",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Oops!",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" }}
        className="w-full max-w-md"
      >
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center">
            <motion.span
              className="mx-auto mb-2 text-5xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌍
            </motion.span>
            <CardTitle className="font-fredoka text-2xl">
              {isLogin ? "Welcome Back!" : "Join SpeakWorld!"}
            </CardTitle>
            <CardDescription className="font-nunito">
              {isLogin
                ? "Sign in to continue your child's adventure"
                : "Create a parent account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-nunito">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Parent name"
                    required={!isLogin}
                    className="rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-nunito">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-nunito">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl font-fredoka text-lg"
                size="lg"
                disabled={loading}
              >
                {loading ? "Loading..." : isLogin ? "Sign In 🎮" : "Create Account 🚀"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-nunito text-sm text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
        <button
          onClick={() => navigate("/")}
          className="mt-4 block w-full text-center font-nunito text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to home
        </button>
      </motion.div>
    </div>
  );
}
