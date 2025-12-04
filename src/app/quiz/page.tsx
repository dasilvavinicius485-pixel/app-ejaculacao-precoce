"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ClipboardList, Heart, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"

type QuizData = {
  age_range: string
  relationship_status: string
  problem_duration: string
  frequency: string
  anxiety_level: number
  tried_solutions: string[]
  main_concern: string
}

export default function QuizPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  
  const [quizData, setQuizData] = useState<QuizData>({
    age_range: "",
    relationship_status: "",
    problem_duration: "",
    frequency: "",
    anxiety_level: 5,
    tried_solutions: [],
    main_concern: ""
  })

  const totalSteps = 7
  const progress = (step / totalSteps) * 100

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('quiz_responses')
        .insert({
          ...quizData,
          user_id: user?.id || null
        })

      if (error) throw error

      setCompleted(true)
      setTimeout(() => router.push("/"), 3000)
    } catch (error) {
      console.error("Erro ao salvar quiz:", error)
      alert("Erro ao salvar suas respostas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSolutionToggle = (solution: string) => {
    setQuizData(prev => ({
      ...prev,
      tried_solutions: prev.tried_solutions.includes(solution)
        ? prev.tried_solutions.filter(s => s !== solution)
        : [...prev.tried_solutions, solution]
    }))
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-green-200 dark:border-green-900">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-600">Quiz Concluído!</h2>
            <p className="text-muted-foreground">
              Obrigado por compartilhar suas informações. Agora podemos oferecer uma experiência mais personalizada.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o app...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 py-8">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl shadow-lg">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Questionário de Avaliação
            </h1>
          </div>
          <p className="text-muted-foreground">
            Ajude-nos a entender melhor sua situação para oferecer orientações personalizadas
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Passo {step} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Quiz Steps */}
        <Card className="border-2 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Faixa Etária"}
              {step === 2 && "Status de Relacionamento"}
              {step === 3 && "Duração do Problema"}
              {step === 4 && "Frequência"}
              {step === 5 && "Nível de Ansiedade"}
              {step === 6 && "Soluções Tentadas"}
              {step === 7 && "Principal Preocupação"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Qual sua idade?"}
              {step === 2 && "Qual seu status atual?"}
              {step === 3 && "Há quanto tempo você enfrenta essa situação?"}
              {step === 4 && "Com que frequência isso acontece?"}
              {step === 5 && "Quanto isso afeta sua ansiedade? (1-10)"}
              {step === 6 && "Quais soluções você já tentou?"}
              {step === 7 && "Qual sua maior preocupação?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Age Range */}
            {step === 1 && (
              <RadioGroup value={quizData.age_range} onValueChange={(value) => setQuizData({...quizData, age_range: value})}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="18-25" id="age1" />
                  <Label htmlFor="age1" className="flex-1 cursor-pointer">18-25 anos</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="26-35" id="age2" />
                  <Label htmlFor="age2" className="flex-1 cursor-pointer">26-35 anos</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="36-45" id="age3" />
                  <Label htmlFor="age3" className="flex-1 cursor-pointer">36-45 anos</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="46+" id="age4" />
                  <Label htmlFor="age4" className="flex-1 cursor-pointer">46+ anos</Label>
                </div>
              </RadioGroup>
            )}

            {/* Step 2: Relationship Status */}
            {step === 2 && (
              <RadioGroup value={quizData.relationship_status} onValueChange={(value) => setQuizData({...quizData, relationship_status: value})}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="single" id="rel1" />
                  <Label htmlFor="rel1" className="flex-1 cursor-pointer">Solteiro(a)</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="dating" id="rel2" />
                  <Label htmlFor="rel2" className="flex-1 cursor-pointer">Namorando</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="married" id="rel3" />
                  <Label htmlFor="rel3" className="flex-1 cursor-pointer">Casado(a)</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="complicated" id="rel4" />
                  <Label htmlFor="rel4" className="flex-1 cursor-pointer">É complicado</Label>
                </div>
              </RadioGroup>
            )}

            {/* Step 3: Problem Duration */}
            {step === 3 && (
              <RadioGroup value={quizData.problem_duration} onValueChange={(value) => setQuizData({...quizData, problem_duration: value})}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="less-3months" id="dur1" />
                  <Label htmlFor="dur1" className="flex-1 cursor-pointer">Menos de 3 meses</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="3-6months" id="dur2" />
                  <Label htmlFor="dur2" className="flex-1 cursor-pointer">3-6 meses</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="6-12months" id="dur3" />
                  <Label htmlFor="dur3" className="flex-1 cursor-pointer">6-12 meses</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="1year+" id="dur4" />
                  <Label htmlFor="dur4" className="flex-1 cursor-pointer">Mais de 1 ano</Label>
                </div>
              </RadioGroup>
            )}

            {/* Step 4: Frequency */}
            {step === 4 && (
              <RadioGroup value={quizData.frequency} onValueChange={(value) => setQuizData({...quizData, frequency: value})}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="always" id="freq1" />
                  <Label htmlFor="freq1" className="flex-1 cursor-pointer">Sempre (100%)</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="often" id="freq2" />
                  <Label htmlFor="freq2" className="flex-1 cursor-pointer">Frequentemente (75%)</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="sometimes" id="freq3" />
                  <Label htmlFor="freq3" className="flex-1 cursor-pointer">Às vezes (50%)</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                  <RadioGroupItem value="rarely" id="freq4" />
                  <Label htmlFor="freq4" className="flex-1 cursor-pointer">Raramente (25%)</Label>
                </div>
              </RadioGroup>
            )}

            {/* Step 5: Anxiety Level */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="text-6xl font-bold text-blue-600">
                    {quizData.anxiety_level}
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quizData.anxiety_level}
                  onChange={(e) => setQuizData({...quizData, anxiety_level: parseInt(e.target.value)})}
                  className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-900"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 - Nenhuma</span>
                  <span>10 - Extrema</span>
                </div>
              </div>
            )}

            {/* Step 6: Tried Solutions */}
            {step === 6 && (
              <div className="space-y-3">
                {[
                  { id: "kegel", label: "Exercícios de Kegel" },
                  { id: "breathing", label: "Técnicas de respiração" },
                  { id: "startstop", label: "Técnica Start-Stop" },
                  { id: "squeeze", label: "Técnica Squeeze" },
                  { id: "medication", label: "Medicamentos" },
                  { id: "therapy", label: "Terapia/Aconselhamento" },
                  { id: "supplements", label: "Suplementos naturais" },
                  { id: "none", label: "Nenhuma ainda" }
                ].map((solution) => (
                  <div key={solution.id} className="flex items-center space-x-2 p-3 rounded-lg border-2 hover:border-blue-300 transition-colors">
                    <Checkbox
                      id={solution.id}
                      checked={quizData.tried_solutions.includes(solution.id)}
                      onCheckedChange={() => handleSolutionToggle(solution.id)}
                    />
                    <Label htmlFor={solution.id} className="flex-1 cursor-pointer">
                      {solution.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Step 7: Main Concern */}
            {step === 7 && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Descreva sua principal preocupação ou objetivo... (opcional)"
                  value={quizData.main_concern}
                  onChange={(e) => setQuizData({...quizData, main_concern: e.target.value})}
                  className="min-h-[150px] border-2"
                />
                <p className="text-xs text-muted-foreground">
                  Suas informações são privadas e ajudarão a personalizar sua experiência.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                  disabled={
                    (step === 1 && !quizData.age_range) ||
                    (step === 2 && !quizData.relationship_status) ||
                    (step === 3 && !quizData.problem_duration) ||
                    (step === 4 && !quizData.frequency)
                  }
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Concluir"}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Heart className="w-4 h-4 inline mr-2" />
          Suas respostas são confidenciais e criptografadas
        </div>
      </div>
    </div>
  )
}
