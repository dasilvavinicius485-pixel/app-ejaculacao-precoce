"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Timer, TrendingUp, BookOpen, Award, Lock, Play, Pause, RotateCcw, Calendar, Target, Brain, Heart, Dumbbell, Droplet, Wind, Zap, LogOut, ClipboardList } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SessionData {
  date: string
  duration: number
  success: boolean
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [streak, setStreak] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale")
  const [breathingCount, setBreathingCount] = useState(0)

  // Check authentication
  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
    
    if (user) {
      loadUserSessions(user.id)
    }
  }

  const loadUserSessions = async (userId: string) => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) {
      const formattedSessions = data.map(session => ({
        date: session.created_at,
        duration: session.duration,
        success: session.duration >= 180
      }))
      setSessions(formattedSessions)
      calculateStreak(formattedSessions)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Load sessions from localStorage (fallback for non-logged users)
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("wellness-sessions")
      if (saved) {
        const parsed = JSON.parse(saved)
        setSessions(parsed)
        calculateStreak(parsed)
      }
    }
  }, [user])

  const calculateStreak = (sessionData: SessionData[]) => {
    if (sessionData.length === 0) return
    
    const today = new Date().toDateString()
    const sortedSessions = [...sessionData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    let currentStreak = 0
    let checkDate = new Date()
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date).toDateString()
      const checkDateStr = checkDate.toDateString()
      
      if (sessionDate === checkDateStr) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    
    setStreak(currentStreak)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartPause = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const handleReset = () => {
    setIsTimerRunning(false)
    setTimerSeconds(0)
  }

  const handleSaveSession = async () => {
    const newSession: SessionData = {
      date: new Date().toISOString(),
      duration: timerSeconds,
      success: timerSeconds >= 180
    }
    
    if (user) {
      // Save to Supabase
      await supabase
        .from('training_sessions')
        .insert({
          user_id: user.id,
          duration: timerSeconds,
          exercise_type: 'start-stop',
          notes: timerSeconds >= 180 ? 'Sessão bem-sucedida' : 'Continue praticando'
        })
      
      loadUserSessions(user.id)
    } else {
      // Save to localStorage
      const updatedSessions = [...sessions, newSession]
      setSessions(updatedSessions)
      localStorage.setItem("wellness-sessions", JSON.stringify(updatedSessions))
      calculateStreak(updatedSessions)
    }
    
    handleReset()
  }

  // Breathing exercise
  useEffect(() => {
    if (activeTab === "breathing") {
      const breathingInterval = setInterval(() => {
        setBreathingCount(prev => {
          const next = prev + 1
          
          if (next <= 4) {
            setBreathingPhase("inhale")
          } else if (next <= 7) {
            setBreathingPhase("hold")
          } else if (next <= 15) {
            setBreathingPhase("exhale")
          } else {
            return 0
          }
          
          return next
        })
      }, 1000)
      
      return () => clearInterval(breathingInterval)
    }
  }, [activeTab])

  const getBreathingText = () => {
    switch (breathingPhase) {
      case "inhale": return "Inspire profundamente..."
      case "hold": return "Segure o ar..."
      case "exhale": return "Expire lentamente..."
    }
  }

  const weeklyProgress = Math.min((sessions.length / 7) * 100, 100)
  const avgDuration = sessions.length > 0 
    ? Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length)
    : 0

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Bem-Estar Íntimo
              </CardTitle>
            </div>
            <CardDescription className="text-center">
              Seu espaço privado para saúde e controle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Entre ou crie uma conta para acessar suas informações de forma segura e sincronizada.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              >
                Entrar / Criar Conta
              </Button>
              <Button 
                onClick={() => router.push('/quiz')}
                variant="outline"
                className="w-full"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Fazer Questionário Primeiro
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
              <Lock className="w-4 h-4" />
              <span>Seus dados são privados e criptografados</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Bem-Estar Íntimo
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mb-4">
            Seu espaço privado para saúde e controle
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Sequência Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{streak} dias</div>
              <p className="text-xs text-muted-foreground mt-1">Continue praticando!</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                Sessões Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{sessions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Exercícios realizados</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4 text-purple-600" />
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{formatTime(avgDuration)}</div>
              <p className="text-xs text-muted-foreground mt-1">Por sessão</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 h-auto p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <TabsTrigger value="home" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
              <Timer className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Timer</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
              <Dumbbell className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Exercícios</span>
            </TabsTrigger>
            <TabsTrigger value="breathing" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
              <Brain className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Respiração</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Progresso</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Educação</span>
            </TabsTrigger>
          </TabsList>

          {/* Timer Tab */}
          <TabsContent value="home" className="space-y-4">
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-600" />
                  Exercício Start-Stop
                </CardTitle>
                <CardDescription>
                  Técnica comprovada para melhorar o controle. Pratique regularmente para melhores resultados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-7xl font-bold text-blue-600 mb-6 font-mono">
                    {formatTime(timerSeconds)}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleStartPause}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Iniciar
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleReset}
                      size="lg"
                      variant="outline"
                      className="border-2"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reiniciar
                    </Button>
                  </div>

                  {timerSeconds > 0 && !isTimerRunning && (
                    <Button 
                      onClick={handleSaveSession}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Salvar Sessão
                    </Button>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Como usar:
                  </h4>
                  <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                    <li>Inicie o timer quando começar o exercício</li>
                    <li>Pause quando sentir que está próximo do limite</li>
                    <li>Respire profundamente e relaxe por 30 segundos</li>
                    <li>Continue o exercício quando se sentir confortável</li>
                    <li>Repita o processo para aumentar o controle</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exercícios de Kegel */}
              <Card className="border-2 border-purple-200 dark:border-purple-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Dumbbell className="w-5 h-5" />
                    Exercícios de Kegel
                  </CardTitle>
                  <CardDescription>
                    Fortaleça os músculos do assoalho pélvico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h4 className="font-semibold mb-2">Como fazer:</h4>
                    <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Identifique o músculo: pare o fluxo de urina (apenas para identificar)</li>
                      <li>Contraia o músculo por 3-5 segundos</li>
                      <li>Relaxe por 3-5 segundos</li>
                      <li>Repita 10-15 vezes, 3x ao dia</li>
                    </ol>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      ⏱️ Frequência: 3 séries por dia
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Resultados visíveis em 4-6 semanas
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Técnica Squeeze */}
              <Card className="border-2 border-orange-200 dark:border-orange-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Zap className="w-5 h-5" />
                    Técnica Squeeze
                  </CardTitle>
                  <CardDescription>
                    Método de compressão para controle imediato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900">
                    <h4 className="font-semibold mb-2">Como fazer:</h4>
                    <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Quando sentir que vai ejacular, pare</li>
                      <li>Pressione a glande por 10-20 segundos</li>
                      <li>Aguarde a sensação diminuir</li>
                      <li>Continue após 30 segundos</li>
                    </ol>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                      💡 Dica: Pratique sozinho primeiro
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Eficácia de 60-90% com prática regular
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Métodos Caseiros - Alimentação */}
              <Card className="border-2 border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Droplet className="w-5 h-5" />
                    Alimentação e Suplementos
                  </CardTitle>
                  <CardDescription>
                    Nutrientes que podem ajudar naturalmente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                    <h4 className="font-semibold mb-2">Alimentos benéficos:</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                      <li><strong>Zinco:</strong> Ostras, carne vermelha, sementes de abóbora</li>
                      <li><strong>Magnésio:</strong> Espinafre, amêndoas, abacate</li>
                      <li><strong>Ômega-3:</strong> Salmão, sardinha, chia</li>
                      <li><strong>Vitamina D:</strong> Ovos, cogumelos, exposição solar</li>
                    </ul>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                      🥗 Evite: Álcool em excesso e alimentos processados
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Métodos Caseiros - Chás e Ervas */}
              <Card className="border-2 border-teal-200 dark:border-teal-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-teal-600">
                    <Wind className="w-5 h-5" />
                    Chás e Ervas Naturais
                  </CardTitle>
                  <CardDescription>
                    Remédios naturais com propriedades calmantes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-lg border border-teal-200 dark:border-teal-900">
                    <h4 className="font-semibold mb-2">Opções naturais:</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                      <li><strong>Chá de Camomila:</strong> Reduz ansiedade (2x ao dia)</li>
                      <li><strong>Ashwagandha:</strong> Adaptógeno que reduz estresse</li>
                      <li><strong>Ginseng:</strong> Melhora energia e controle</li>
                      <li><strong>Passiflora:</strong> Efeito calmante natural</li>
                    </ul>
                  </div>
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">
                      ⚠️ Consulte um médico antes de usar suplementos
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Exercício de Edging */}
              <Card className="border-2 border-indigo-200 dark:border-indigo-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-600">
                    <Target className="w-5 h-5" />
                    Técnica de Edging
                  </CardTitle>
                  <CardDescription>
                    Treino avançado de controle e consciência
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <h4 className="font-semibold mb-2">Como praticar:</h4>
                    <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                      <li>Estimule-se até 80-90% do clímax</li>
                      <li>Pare completamente e respire fundo</li>
                      <li>Aguarde 30-60 segundos</li>
                      <li>Repita o ciclo 3-5 vezes</li>
                      <li>Aumente gradualmente o tempo</li>
                    </ol>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                      🎯 Meta: Aumentar controle em 50-100%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pratique 2-3x por semana
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dicas de Estilo de Vida */}
              <Card className="border-2 border-rose-200 dark:border-rose-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-600">
                    <Heart className="w-5 h-5" />
                    Estilo de Vida Saudável
                  </CardTitle>
                  <CardDescription>
                    Hábitos diários que fazem diferença
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-200 dark:border-rose-900">
                    <h4 className="font-semibold mb-2">Práticas recomendadas:</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
                      <li><strong>Exercícios físicos:</strong> 30 min, 3-4x por semana</li>
                      <li><strong>Sono adequado:</strong> 7-9 horas por noite</li>
                      <li><strong>Redução de estresse:</strong> Meditação, yoga</li>
                      <li><strong>Hidratação:</strong> 2-3 litros de água por dia</li>
                      <li><strong>Evite tabaco:</strong> Prejudica circulação</li>
                    </ul>
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                      💪 Corpo saudável = Melhor controle
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aviso importante */}
            <Card className="border-2 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                      Importante: Consistência é a chave
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Resultados significativos geralmente aparecem após 4-8 semanas de prática regular. 
                      Combine múltiplas técnicas para melhores resultados. Se os sintomas persistirem, 
                      consulte um urologista ou sexólogo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breathing Tab */}
          <TabsContent value="breathing" className="space-y-4">
            <Card className="border-2 border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-600" />
                  Exercício de Respiração
                </CardTitle>
                <CardDescription>
                  Técnica 4-7-8 para reduzir ansiedade e melhorar o controle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className={`w-32 h-32 rounded-full mb-8 transition-all duration-1000 ${
                    breathingPhase === "inhale" ? "bg-gradient-to-br from-blue-400 to-blue-600 scale-110" :
                    breathingPhase === "hold" ? "bg-gradient-to-br from-purple-400 to-purple-600 scale-110" :
                    "bg-gradient-to-br from-green-400 to-green-600 scale-90"
                  } shadow-2xl flex items-center justify-center`}>
                    <Brain className="w-16 h-16 text-white" />
                  </div>
                  
                  <div className="text-3xl font-bold text-center mb-4">
                    {getBreathingText()}
                  </div>
                  
                  <div className="text-6xl font-mono font-bold text-muted-foreground">
                    {breathingPhase === "inhale" ? breathingCount + 1 :
                     breathingPhase === "hold" ? breathingCount - 3 :
                     16 - breathingCount}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                  <h4 className="font-semibold mb-2">Benefícios:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Reduz ansiedade de desempenho</li>
                    <li>Melhora o controle corporal</li>
                    <li>Promove relaxamento profundo</li>
                    <li>Aumenta a consciência corporal</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Seu Progresso
                </CardTitle>
                <CardDescription>
                  Acompanhe sua evolução ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Meta Semanal (7 sessões)</span>
                    <span className="text-sm text-muted-foreground">{sessions.length}/7</span>
                  </div>
                  <Progress value={weeklyProgress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="text-2xl font-bold text-blue-600">{sessions.filter(s => s.success).length}</div>
                    <div className="text-sm text-muted-foreground">Sessões bem-sucedidas</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="text-2xl font-bold text-green-600">{streak}</div>
                    <div className="text-sm text-muted-foreground">Dias consecutivos</div>
                  </div>
                </div>

                {sessions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Últimas Sessões</h4>
                    <div className="space-y-2">
                      {sessions.slice(-5).reverse().map((session, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${session.success ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-sm">
                              {new Date(session.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span className="text-sm font-mono font-semibold">
                            {formatTime(session.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma sessão registrada ainda.</p>
                    <p className="text-sm">Comece seu primeiro exercício na aba Timer!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  Educação e Recursos
                </CardTitle>
                <CardDescription>
                  Informações baseadas em evidências científicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">O que é Ejaculação Precoce?</h4>
                    <p className="text-sm text-muted-foreground">
                      Condição comum que afeta 30-40% dos homens em algum momento da vida. 
                      Caracteriza-se pela ejaculação que ocorre antes do desejado, causando desconforto pessoal ou interpessoal.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
                    <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">Técnicas Eficazes</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li><strong>Start-Stop:</strong> Pausar estimulação antes do clímax</li>
                      <li><strong>Squeeze:</strong> Pressionar a glande para reduzir excitação</li>
                      <li><strong>Exercícios de Kegel:</strong> Fortalecer músculos pélvicos</li>
                      <li><strong>Mindfulness:</strong> Aumentar consciência corporal</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">Mitos vs. Fatos</h4>
                    <div className="text-sm space-y-2">
                      <div>
                        <p className="font-medium text-red-600">❌ Mito: É um problema psicológico apenas</p>
                        <p className="text-muted-foreground">✅ Fato: Pode ter causas físicas e psicológicas</p>
                      </div>
                      <div>
                        <p className="font-medium text-red-600">❌ Mito: Não tem solução</p>
                        <p className="text-muted-foreground">✅ Fato: 95% dos casos melhoram com tratamento adequado</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <h4 className="font-semibold mb-2 text-orange-900 dark:text-orange-100">Quando Procurar Ajuda Profissional</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Se o problema persistir por mais de 6 meses</li>
                      <li>Se causar sofrimento significativo</li>
                      <li>Se afetar relacionamentos</li>
                      <li>Para orientação personalizada e tratamento médico</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-900">
                    <h4 className="font-semibold mb-2 text-teal-900 dark:text-teal-100 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Privacidade e Segurança
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Todos os seus dados são armazenados de forma segura e criptografada no Supabase. 
                      Você tem controle total sobre suas informações e pode excluí-las a qualquer momento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="w-4 h-4" />
            <span>Seus dados são privados e seguros</span>
          </div>
          <p className="text-xs">
            Este app é uma ferramenta educacional. Consulte um profissional de saúde para orientação personalizada.
          </p>
        </footer>
      </div>
    </div>
  )
}
