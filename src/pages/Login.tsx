import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Form */}
      <div className="flex flex-1 flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Zap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                FOTZ<span className="text-primary">.</span>Studio
              </h1>
              <p className="text-sm text-muted-foreground">Portal klienta</p>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Witaj z powrotem</h2>
            <p className="text-muted-foreground">
              Zaloguj się do swojego panelu klienta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.pl"
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Hasło</Label>
                <a
                  href="#"
                  className="text-sm text-primary hover:underline"
                >
                  Zapomniałeś hasła?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="xl"
              variant="gradient"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Logowanie...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Zaloguj się
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Nie masz konta?{" "}
            <a href="#" className="font-medium text-primary hover:underline">
              Skontaktuj się z nami
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:bg-gradient-to-br lg:from-primary/5 lg:via-background lg:to-primary/10 lg:p-12">
        <div className="mx-auto max-w-lg space-y-8">
          <div className="space-y-4">
            <h3 className="text-4xl font-bold tracking-tight">
              Zarządzaj swoimi
              <br />
              <span className="text-gradient">projektami</span> w jednym miejscu
            </h3>
            <p className="text-lg text-muted-foreground">
              Śledź postępy, akceptuj materiały i komunikuj się z zespołem FOTZ Studio
              bez zbędnych e-maili.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Podgląd wszystkich projektów w czasie rzeczywistym",
              "Łatwa akceptacja materiałów i grafik",
              "Historia współpracy i plików w jednym miejscu",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
