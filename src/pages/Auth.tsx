import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Zap, Mail, Lock, User, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Nieprawidłowy adres email");
const passwordSchema = z.string().min(6, "Hasło musi mieć minimum 6 znaków");

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signIn, signUp } = useAuthContext();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Check for invitation token
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (inviteToken) {
      setIsLogin(false);
    }
  }, [inviteToken]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Błąd logowania",
              description: "Nieprawidłowy email lub hasło",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Błąd",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Zalogowano",
            description: "Witaj w FOTZ Studio!",
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Konto już istnieje",
              description: "Ten email jest już zarejestrowany. Spróbuj się zalogować.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Błąd rejestracji",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Konto utworzone",
            description: "Możesz się teraz zalogować",
          });
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-fotz shadow-glow mb-4">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              FOTZ<span className="text-primary">.</span>Studio
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Zaloguj się do portalu" : "Utwórz nowe konto"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Imię i nazwisko</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jan Kowalski"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className="pl-10"
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? "Zaloguj się" : "Zarejestruj się"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Nie masz konta?" : "Masz już konto?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </div>

          {inviteToken && !isLogin && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Zostałeś zaproszony do FOTZ Studio. Utwórz konto, aby uzyskać dostęp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-fotz p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Portal klienta
          </h2>
          <p className="text-lg opacity-90">
            Zarządzaj projektami, przeglądaj pliki i śledź postępy prac w jednym miejscu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
