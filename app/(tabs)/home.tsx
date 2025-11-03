import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import Svg, { Circle, G, Text as SvgText, Path, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { Colors } from '../../constants/Colors'
import {
  getPeriods,
  getSettings,
  createPeriod,
  getSymptoms,
  Period,
  UserSettings,
  Symptom,
} from '../../lib/api'
import SymptomTracker from '../../components/SymptomTracker'
import { symptomData, SymptomType } from '../../lib/symptomTips'
import { Ionicons } from '@expo/vector-icons'
import {
  calculatePredictions,
  getDayInfo,
  getPeriodDayInfo,
  CyclePredictions,
} from '../../lib/periodCalculations'

const { width } = Dimensions.get('window')

interface DateInfo {
  day: number
  date: Date
  phase: 'period' | 'fertile' | 'pms' | 'predicted_period' | 'normal'
  confidence: 'high' | 'medium' | 'low'
}

export default function HomeScreen() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [greeting, setGreeting] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<Period[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [showSymptomTracker, setShowSymptomTracker] = useState(false)
  const [todaySymptoms, setTodaySymptoms] = useState<Symptom[]>([])

  const predictions = useMemo<CyclePredictions>(() => {
    return calculatePredictions(periods, settings)
  }, [periods, settings])

  const currentPeriodInfo = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getPeriodDayInfo(today, periods)
  }, [periods])

  const isOnPeriod = useMemo(() => {
    return currentPeriodInfo !== null
  }, [currentPeriodInfo])

  const currentCycleInfo = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dayInfo = getDayInfo(today, periods, predictions)
    
    const sortedPeriods = [...periods].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )
    
    let cycleDay = 1
    let phaseName = 'Normal'
    let phaseEmoji = '😊'
    let phaseDisplayName = 'Cycle'
    
    if (sortedPeriods.length > 0) {
      const lastPeriodStart = new Date(sortedPeriods[0].startDate)
      lastPeriodStart.setHours(0, 0, 0, 0)
      
      const daysSinceLastPeriod = Math.floor(
        (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
      )
      cycleDay = daysSinceLastPeriod + 1
    }
    
    if (dayInfo.isPeriod) {
      phaseName = 'Period Phase'
      phaseEmoji = '🩸'
      phaseDisplayName = 'Periods'
    } else if (dayInfo.isFertile) {
      phaseName = 'Ovulation Phase'
      phaseEmoji = '💕'
      phaseDisplayName = 'Ovulation'
    } else if (dayInfo.isPMS) {
      phaseName = 'Luteal Phase'
      phaseEmoji = '😌'
      phaseDisplayName = 'Luteal'
    } else {
      phaseName = 'Follicular Phase'
      phaseEmoji = '🌸'
      phaseDisplayName = 'Follicular'
    }
    
    return {
      cycleDay,
      phaseName,
      phaseEmoji,
      phaseDisplayName,
      dayInfo,
    }
  }, [periods, predictions])

  // Phase-specific scientific information
  const phaseInfo = useMemo(() => {
    const phase = currentCycleInfo.phaseName
    
    if (phase === 'Period Phase') {
      return {
        title: 'Menstrual Phase',
        scientificExplanation: 'During menstruation, progesterone (PG) and estrogen (E2) levels are at their lowest. The uterine lining sheds, marking the start of a new cycle. Hormone levels begin to rise as the body prepares for the next cycle.',
        hormoneStatus: [
          { name: 'E2', status: 'Low, rising' },
          { name: 'PG', status: 'Low' },
          { name: 'FSH', status: 'Rising' },
          { name: 'LH', status: 'Low' },
        ],
        commonExperiences: [
          'You may experience cramps, bloating, and fatigue as your body sheds the uterine lining.',
          'Mood may feel more sensitive, with some experiencing irritability, sadness, or emotional fluctuations.',
          'Energy levels are typically lower during this time - rest is important for your body.',
          'Some experience headaches, lower back pain, or disrupted sleep patterns.',
        ],
        moodInfo: 'Mood can be more sensitive during this phase. You might feel introspective, emotional, or need more alone time. This is completely normal as hormones fluctuate.',
        foodInfo: 'Focus on iron-rich foods (leafy greens, lean meats, legumes) to replenish lost iron. Warm, comforting foods and herbal teas can help with cramps. Stay hydrated and avoid excessive caffeine.',
        exerciseInfo: 'Gentle movement like light walking, stretching, or gentle yoga can help with cramps. Listen to your body - rest when needed. Avoid intense workouts if you feel low energy.',
      }
    } else if (phase === 'Ovulation Phase') {
      return {
        title: 'Ovulation Phase',
        scientificExplanation: 'Ovulation occurs when a mature egg is released from the ovary. Estrogen (E2) peaks just before ovulation, and luteinizing hormone (LH) surges, triggering the release of the egg. This is your most fertile window.',
        hormoneStatus: [
          { name: 'E2', status: 'Peak' },
          { name: 'PG', status: 'Low, rising' },
          { name: 'FSH', status: 'Peak' },
          { name: 'LH', status: 'Surge' },
        ],
        commonExperiences: [
          'Many experience increased energy, confidence, and a natural glow during this phase.',
          'Libido often increases, and you may feel more sociable and outgoing.',
          'Some experience mild cramping or spotting around ovulation (mittelschmerz).',
          'Cervical mucus becomes clear and stretchy, similar to egg white.',
        ],
        moodInfo: 'Mood is typically upbeat and confident during ovulation. You may feel more extroverted, creative, and energized. This is often called your "power phase" of the cycle.',
        foodInfo: 'Focus on nutrient-dense foods to support hormone production. Include healthy fats, proteins, and complex carbs. Foods rich in zinc and vitamin B support healthy ovulation.',
        exerciseInfo: 'This is an ideal time for more intense workouts! Your body has higher energy reserves. Engage in strength training, cardio, or activities you enjoy most.',
      }
    } else if (phase === 'Luteal Phase') {
      return {
        title: 'Late Luteal Phase',
        scientificExplanation: 'If no pregnancy occurs, progesterone (PG) and estrogen (E2) levels drop sharply. This hormone fall triggers menstruation, marking the start of a new cycle.',
        hormoneStatus: [
          { name: 'E2', status: 'Falling' },
          { name: 'PG', status: 'Falling' },
          { name: 'FSH', status: 'Low' },
          { name: 'LH', status: 'Low' },
        ],
        commonExperiences: [
          'The fall in PG and E2 can lead to premenstrual symptoms (PMS).',
          'Mood may feel more sensitive, alongside irritability, low energy, or cravings.',
          'Some experience bloating, cramps, headaches, or disrupted sleep. These symptoms ease as menstruation begins.',
          'Breast tenderness and food cravings (especially for sweets or carbs) are common.',
        ],
        moodInfo: 'Mood changes are common due to hormone fluctuations. You might feel more sensitive, anxious, or emotional. Increased irritability and mood swings are normal PMS symptoms.',
        foodInfo: 'Cravings for carbs and sweets are common. Include magnesium-rich foods (dark chocolate, nuts, seeds) and complex carbs. Small, frequent meals can help stabilize blood sugar and mood.',
        exerciseInfo: 'Gentle to moderate exercise can help with mood and bloating. Yoga, walking, or light cardio may feel better than intense workouts. Movement helps manage PMS symptoms.',
      }
    } else {
      // Follicular Phase
      return {
        title: 'Follicular Phase',
        scientificExplanation: 'After menstruation, estrogen (E2) and follicle-stimulating hormone (FSH) levels rise. This phase prepares the ovaries for ovulation, with follicles developing and the uterine lining rebuilding.',
        hormoneStatus: [
          { name: 'E2', status: 'Rising' },
          { name: 'PG', status: 'Low' },
          { name: 'FSH', status: 'Rising' },
          { name: 'LH', status: 'Low, rising' },
        ],
        commonExperiences: [
          'Energy levels gradually increase as estrogen rises throughout this phase.',
          'You may feel more optimistic, creative, and ready to take on new challenges.',
          'The body is rebuilding the uterine lining, and you may notice increased stamina.',
          'Skin may appear clearer, and overall mood tends to be more positive and stable.',
        ],
        moodInfo: 'Mood typically improves as estrogen rises. You may feel more optimistic, clear-headed, and motivated. This is a great time for planning, socializing, and creative projects.',
        foodInfo: 'Support hormone production with balanced meals rich in protein, healthy fats, and fiber. Include foods high in iron, B vitamins, and antioxidants to support the rebuilding phase.',
        exerciseInfo: 'Energy levels are building, so gradually increase workout intensity. This is a great time for building strength and trying new fitness activities as your stamina improves.',
      }
    }
  }, [currentCycleInfo.phaseName])

  const daysUntilPeriod = useMemo(() => {
    if (isOnPeriod) return null
    
    if (!predictions.nextPeriodDate) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextPeriod = new Date(predictions.nextPeriodDate)
    nextPeriod.setHours(0, 0, 0, 0)
    
    const diff = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : null
  }, [predictions.nextPeriodDate, isOnPeriod])

  const pregnancyChance = useMemo(() => {
    const dayInfo = currentCycleInfo.dayInfo
    
    if (dayInfo.isFertile) return { level: 'HIGH', color: '#FF6B9D' }
    if (dayInfo.isPMS) return { level: 'LOW', color: '#66BB6A' }
    if (dayInfo.phase === 'period') return { level: 'LOW', color: '#66BB6A' }
    if (dayInfo.phase === 'predicted_period') return { level: 'LOW', color: '#66BB6A' }
    return { level: 'LOW', color: '#66BB6A' }
  }, [currentCycleInfo])

  const lastPeriodStart = useMemo(() => {
    const sortedPeriods = [...periods].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )
    
    if (sortedPeriods.length > 0) {
      return new Date(sortedPeriods[0].startDate)
    }
    return null
  }, [periods])

  // Get theme colors based on phase
  const themeColors = useMemo(() => {
    const phase = currentCycleInfo.phaseName
    
    if (phase === 'Period Phase') {
      return {
        background: '#FFE5ED',
        primary: '#FF6B9D',
        secondary: '#FFC1D6',
        card: '#FFFFFF',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FFE5ED',
        heartColor: '#FFC1D6', // Light pink for period
      }
    } else if (phase === 'Ovulation Phase') {
      return {
        background: '#E3F2FD',
        primary: '#4A90E2',
        secondary: '#90CAF9',
        card: '#FFFFFF',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E3F2FD',
        heartColor: '#FFD1DC', // Light pink for ovulation (fertile window)
      }
    } else if (phase === 'Luteal Phase') {
      return {
        background: '#E8F5E9',
        primary: '#66BB6A',
        secondary: '#A5D6A7',
        card: '#FFFFFF',
        gradientStart: '#FFFFFF',
        gradientEnd: '#E8F5E9',
        heartColor: '#FFE4E1', // Very light peach for luteal
      }
    } else {
      // Follicular Phase
      return {
        background: '#FFF9E6',
        primary: '#FFD54F',
        secondary: '#FFE082',
        card: '#FFFFFF',
        gradientStart: '#FFFFFF',
        gradientEnd: '#FFF4CC',
        heartColor: '#FFE5ED', // Very light pink/yellow for follicular
      }
    }
  }, [currentCycleInfo.phaseName])

  // Calculate ovulation date
  const ovulationDate = useMemo(() => {
    if (!predictions.nextPeriodDate) return null
    const nextPeriod = new Date(predictions.nextPeriodDate)
    const ovulation = new Date(nextPeriod)
    ovulation.setDate(ovulation.getDate() - 14)
    return ovulation
  }, [predictions.nextPeriodDate])

  // Calculate fertile window start
  const fertileWindowStart = useMemo(() => {
    if (!ovulationDate) return null
    const fertile = new Date(ovulationDate)
    fertile.setDate(fertile.getDate() - 5)
    return fertile
  }, [ovulationDate])

  // Calculate fertile window end
  const fertileWindowEnd = useMemo(() => {
    if (!ovulationDate) return null
    const fertile = new Date(ovulationDate)
    fertile.setDate(fertile.getDate() + 1)
    return fertile
  }, [ovulationDate])

  // Calculate current phase day
  const currentPhaseDay = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayInfo = currentCycleInfo.dayInfo
    
    if (dayInfo.isPeriod && lastPeriodStart) {
      const periodStart = new Date(lastPeriodStart)
      periodStart.setHours(0, 0, 0, 0)
      const diff = Math.floor((today.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      return diff + 1
    } else if (dayInfo.isFertile && fertileWindowStart) {
      const fertileStart = new Date(fertileWindowStart)
      fertileStart.setHours(0, 0, 0, 0)
      const diff = Math.floor((today.getTime() - fertileStart.getTime()) / (1000 * 60 * 60 * 24))
      return diff + 1
    } else if (dayInfo.isPMS && ovulationDate) {
      const ovDate = new Date(ovulationDate)
      ovDate.setHours(0, 0, 0, 0)
      const diff = Math.floor((today.getTime() - ovDate.getTime()) / (1000 * 60 * 60 * 24))
      return diff + 1
    } else if (lastPeriodStart) {
      // Follicular phase - days since period ended
      const sortedPeriods = [...periods].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
      if (sortedPeriods.length > 0) {
        const lastPeriod = new Date(sortedPeriods[0].startDate)
        lastPeriod.setHours(0, 0, 0, 0)
        // Assuming average period length of 5 days
        const periodEnd = new Date(lastPeriod)
        periodEnd.setDate(periodEnd.getDate() + 5)
        const diff = Math.floor((today.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24))
        return diff + 1
      }
    }
    return null
  }, [currentCycleInfo.dayInfo, lastPeriodStart, fertileWindowStart, ovulationDate, periods])

  // Get ordinal suffix for day number
  const getOrdinalSuffix = (day: number) => {
    if (day % 100 >= 11 && day % 100 <= 13) {
      return 'th'
    }
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  const circleDates = useMemo<DateInfo[]>(() => {
    const dates: DateInfo[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      const dayInfo = getDayInfo(date, periods, predictions)
      
      dates.push({
        day: date.getDate(),
        date,
        phase: dayInfo.phase,
        confidence: dayInfo.confidence,
      })
    }
    
    return dates
  }, [periods, predictions])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const hour = currentTime.getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning👋')
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon👋')
    } else {
      setGreeting('Good evening👋')
    }
  }, [currentTime])

  const loadData = async () => {
    try {
      const [periodsData, settingsData] = await Promise.all([
        getPeriods().catch((err) => {
          console.error('[Home] Error loading periods:', err)
          return []
        }),
        getSettings().catch((err) => {
          console.error('[Home] Error loading settings:', err)
          return null
        }),
      ])
      setPeriods(periodsData)
      setSettings(settingsData)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const symptoms = await getSymptoms(
        today.toISOString(),
        endOfDay.toISOString()
      ).catch(() => [])
      setTodaySymptoms(symptoms)
    } catch (error) {
      console.error('[Home] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadData()
    }, [])
  )

  const handleLogPeriod = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayPeriod = periods.find((period) => {
      const start = new Date(period.startDate)
      start.setHours(0, 0, 0, 0)
      const end = period.endDate ? new Date(period.endDate) : start
      end.setHours(0, 0, 0, 0)
      return today >= start && today <= end
    })

    if (todayPeriod) {
      Alert.alert('Already Logged', 'Your period is already logged for today.')
      return
    }

    try {
      const periodLength = settings?.averagePeriodLength ?? 5
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + periodLength - 1)

      await createPeriod({
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        flowLevel: 'medium',
      })

      await loadData()
      Alert.alert('Success', 'Period logged successfully!')
    } catch (error: any) {
      console.error('Error logging period:', error)
      Alert.alert('Error', 'Failed to log period. Please try again.')
    }
  }

  const renderCircleCalendar = () => {
    const elements: React.ReactElement[] = []
    const centerX = 200
    const centerY = 200
    const radius = 155
    const totalDays = 30

    // Draw tick marks
    for (let i = 0; i < totalDays; i++) {
      const angle = (i / totalDays) * 2 * Math.PI - Math.PI / 2
      const innerRadius = radius - 15
      const outerRadius = radius - 5
      
      const x1 = centerX + innerRadius * Math.cos(angle)
      const y1 = centerY + innerRadius * Math.sin(angle)
      const x2 = centerX + outerRadius * Math.cos(angle)
      const y2 = centerY + outerRadius * Math.sin(angle)
      
      elements.push(
        <Line
          key={`tick-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#E0E0E0"
          strokeWidth="2"
        />
      )
    }

    // Draw period indicator (pink drop)
    if (lastPeriodStart) {
      const periodAngle = -Math.PI / 2 - 0.3
      const periodX = centerX + (radius - 40) * Math.cos(periodAngle)
      const periodY = centerY + (radius - 40) * Math.sin(periodAngle)
      
      elements.push(
        // <G key="period-indicator">
        //   <Circle cx={periodX} cy={periodY} r="8" fill="#FF69B4" />
        //   <SvgText
        //     x={periodX}
        //     y={periodY - 20}
        //     textAnchor="middle"
        //     fontSize="12"
        //     fill="#666"
        //     fontWeight="500"
        //   >
        //     Periods
        //   </SvgText>
        // </G>
      )
    }

    // Helper function to draw an arc
    const drawArc = (startIdx: number, endIdx: number, color: string, strokeWidth: number, key: string) => {
      if (startIdx < 0 || endIdx < 0 || startIdx > endIdx) return

      const startAngle = (startIdx / totalDays) * 2 * Math.PI - Math.PI / 2
      const endAngle = ((endIdx + 1) / totalDays) * 2 * Math.PI - Math.PI / 2
      const arcRadius = radius + 10

      const startX = centerX + arcRadius * Math.cos(startAngle)
      const startY = centerY + arcRadius * Math.sin(startAngle)
      const endX = centerX + arcRadius * Math.cos(endAngle)
      const endY = centerY + arcRadius * Math.sin(endAngle)

      const largeArcFlag = endIdx - startIdx > 15 ? 1 : 0
      const pathData = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`

      elements.push(
        <Path
          key={key}
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )

      // Add end circle for yellow (ovulation) arc
      if (color === '#FFD93D') {
        elements.push(
          <Circle
            key={`${key}-end`}
            cx={endX}
            cy={endY}
            r="10"
            fill="#FFD93D"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        )
      }
    }

    // Helper function to find index in circleDates for a given date
    const findDateIndex = (targetDate: Date) => {
      const targetTime = targetDate.getTime()
      for (let i = 0; i < circleDates.length; i++) {
        const dateTime = circleDates[i].date.getTime()
        if (dateTime >= targetTime) {
          return i
        }
      }
      return -1
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Draw Pink Arc - Period (current period if active, or next predicted period)
    let periodStartIdx = -1
    let periodEndIdx = -1
    
    if (isOnPeriod && lastPeriodStart && currentPeriodInfo) {
      // Current period - show remaining days (arc decreases daily)
      const periodStart = new Date(lastPeriodStart)
      periodStart.setHours(0, 0, 0, 0)
      const periodLength = predictions.periodLength || 5
      const currentDay = currentPeriodInfo.dayNumber || 1
      const remainingDays = periodLength - currentDay
      
      if (remainingDays > 0) {
        // Show from today to period end (remaining days)
        const todayIdx = findDateIndex(today)
        const periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + periodLength - 1)
        const periodEndIdxCalc = findDateIndex(periodEnd)
        
        periodStartIdx = todayIdx >= 0 ? todayIdx : findDateIndex(periodStart)
        periodEndIdx = periodEndIdxCalc
        
        if (periodStartIdx >= 0 && periodEndIdx >= periodStartIdx && periodEndIdx < totalDays) {
          drawArc(periodStartIdx, periodEndIdx, '#FF69B4', 14, 'period-arc')
        }
      }
    } else if (predictions.nextPeriodDate) {
      // Next predicted period
      const nextPeriodStart = new Date(predictions.nextPeriodDate)
      nextPeriodStart.setHours(0, 0, 0, 0)
      const nextPeriodEnd = new Date(nextPeriodStart)
      nextPeriodEnd.setDate(nextPeriodEnd.getDate() + (predictions.periodLength || 5))
      
      periodStartIdx = findDateIndex(nextPeriodStart)
      periodEndIdx = findDateIndex(nextPeriodEnd) - 1
      
      if (periodStartIdx >= 0 && periodEndIdx >= periodStartIdx && periodEndIdx < totalDays) {
        drawArc(periodStartIdx, periodEndIdx, '#FF69B4', 14, 'period-arc')
      }
    }

    // 2. Draw Blue Arc - Fertility Window (always show if it's in the next 30 days)
    if (fertileWindowStart && fertileWindowEnd) {
      const fertileStart = new Date(fertileWindowStart)
      fertileStart.setHours(0, 0, 0, 0)
      const fertileEnd = new Date(fertileWindowEnd)
      fertileEnd.setHours(0, 0, 0, 0)

      // Check if fertility window is within the 30-day range (current day to 30 days ahead)
      const firstCircleDate = circleDates[0]?.date
      const lastCircleDate = circleDates[circleDates.length - 1]?.date
      
      if (firstCircleDate && lastCircleDate) {
        const firstDate = new Date(firstCircleDate)
        firstDate.setHours(0, 0, 0, 0)
        const lastDate = new Date(lastCircleDate)
        lastDate.setHours(0, 0, 0, 0)

        // If fertility window overlaps with our 30-day range, draw it
        if (fertileEnd.getTime() >= firstDate.getTime() && fertileStart.getTime() <= lastDate.getTime()) {
          const fertileStartIdx = findDateIndex(fertileStart)
          let fertileEndIdx = findDateIndex(fertileEnd)
          
          // If start is before our range, start from beginning
          const actualStartIdx = fertileStartIdx >= 0 ? fertileStartIdx : 0
          
          // If end is after our range, extend to end
          if (fertileEndIdx < 0) {
            fertileEndIdx = totalDays - 1
          }

          if (actualStartIdx >= 0 && fertileEndIdx >= actualStartIdx && fertileEndIdx < totalDays) {
            drawArc(actualStartIdx, fertileEndIdx, '#4A90E2', 14, 'fertility-window-arc')
          }
        }
      }
    }

    // 3. Draw Yellow Arc - Ovulation
    if (ovulationDate) {
      const ovDate = new Date(ovulationDate)
      ovDate.setHours(0, 0, 0, 0)
      
      const ovStartIdx = findDateIndex(ovDate)
      const ovEndIdx = ovStartIdx // Ovulation is a single day, but we'll show it as a small arc

      if (ovStartIdx >= 0 && ovStartIdx < totalDays) {
        drawArc(ovStartIdx, ovEndIdx, '#FFD93D', 14, 'ovulation-arc')
      }
    }

    return elements
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ExpoLinearGradient
      colors={[themeColors.gradientStart, themeColors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Circle */}
        <View style={styles.circleContainer}>
          {/* Heart Image - Background layer */}
          <View style={styles.heartImageContainer}>
            <Image
              source={require('../../assets/images/heart.png')}
              style={[styles.heartImage, { tintColor: themeColors.heartColor }]}
              resizeMode="contain"
            />
          </View>

          {/* Giraffe mascot - Middle layer (above heart, below text) */}
          <View style={styles.mascotContainer}>
            <Text style={styles.mascotEmoji}>🦒</Text>
          </View>

          {/* SVG - Foreground layer with text and arcs */}
          <View style={styles.svgContainer}>
            <Svg width="400" height="400" viewBox="0 0 400 400">
              <Circle
                cx="200"
                cy="200"
                r="175"
                fill="#FFFFFF"
                opacity={0.7}
              />
              
              {renderCircleCalendar()}
              
              {/* Blood Drop Icon at Top */}
              <G>
                <Path
                  d="M 200 95
                     L 197 103
                     Q 197 105, 198.5 105
                     Q 200 105, 201.5 105
                     Q 203 105, 203 103
                     Z"
                  fill="#E91E63"
                />
                <Circle cx="200" cy="97" r="2.5" fill="#E91E63" />
              </G>
              
              {/* Text: Phase Name */}
              <SvgText
                x="200"
                y="122"
                textAnchor="middle"
                fontSize="14"
                fill="#333"
                fontWeight="600"
              >
                {currentCycleInfo.phaseDisplayName}
              </SvgText>
              
              {/* Center content - Show days left if 4 or less, otherwise show phase day */}
              {daysUntilPeriod !== null && daysUntilPeriod <= 4 && daysUntilPeriod > 0 ? (
                <>
                  <SvgText
                    x="200"
                    y="200"
                    textAnchor="middle"
                    fontSize="60"
                    fill="#000"
                    fontWeight="bold"
                  >
                    {daysUntilPeriod}
                  </SvgText>
                  <SvgText
                    x="200"
                    y="222"
                    textAnchor="middle"
                    fontSize="14"
                    fill="#666"
                    fontWeight="500"
                  >
                    days left
                  </SvgText>
                </>
              ) : (
                <>
                  <SvgText
                    x="175"
                    y="200"
                    textAnchor="middle"
                    fontSize="60"
                    fill="#000"
                    fontWeight="bold"
                  >
                    {currentPhaseDay !== null ? currentPhaseDay : (isOnPeriod && currentPeriodInfo ? currentPeriodInfo.dayNumber : '—')}
                  </SvgText>
                  <SvgText
                    x="205"
                    y="200"
                    textAnchor="start"
                    fontSize="14"
                    fill="#666"
                    fontWeight="500"
                  >
                    {currentPhaseDay !== null ? `${getOrdinalSuffix(currentPhaseDay)} day` : ''}
                  </SvgText>
                </>
              )}
              
              {/* Next Period Label */}
              <SvgText
                x="200"
                y="250"
                textAnchor="middle"
                fontSize="15"
                fill="#666"
                fontWeight="600"
              >
                Next Period
              </SvgText>
              
              {/* Next Period Date */}
              <SvgText
                x="200"
                y="272"
                textAnchor="middle"
                fontSize="14"
                fill="#666"
                fontWeight="500"
              >
                {predictions.nextPeriodDate 
                  ? `will start on - ${new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'Calculating...'}
              </SvgText>
            </Svg>

            {/* Log Period Button inside circle */}
            <TouchableOpacity 
              style={styles.logPeriodCircleButton}
              onPress={handleLogPeriod}
              activeOpacity={0.7}
            >
              <Text style={styles.logPeriodCircleText}>Log Period</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phase Cards Row */}
        <View style={styles.phaseCardsContainer}>
          {/* Fertility Window Card */}
          {fertileWindowStart && fertileWindowEnd && (
            <View style={[styles.phaseCard, styles.fertileCard]}>
              <View style={styles.phaseCardTextContainer}>
                <Text style={styles.phaseCardTitle}>Fertility Window</Text>
                <Text style={styles.phaseCardDate}>
                  {fertileWindowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {fertileWindowEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.phaseCardIconBottom}>
                <Image 
                  source={require('../../assets/images/heart_icon.png.jpeg')}
                  style={styles.phaseIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Ovulation Card */}
          {ovulationDate && (
            <View style={[styles.phaseCard, styles.ovulationCard]}>
              <View style={styles.phaseCardTextContainer}>
                <Text style={styles.phaseCardTitle}>Ovulation</Text>
                <Text style={styles.phaseCardDate}>
                  {ovulationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.phaseCardIconBottom}>
                <Image 
                  source={require('../../assets/images/flower_icon.png')}
                  style={styles.phaseIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Next Period Card */}
          {predictions.nextPeriodDate && (
            <View style={[styles.phaseCard, styles.periodCard]}>
              <View style={styles.phaseCardTextContainer}>
                <Text style={styles.phaseCardTitle}>Next Period</Text>
                <Text style={styles.phaseCardDate}>
                  {daysUntilPeriod !== null ? `in ${daysUntilPeriod} days` : new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.phaseCardIconBottom}>
                <Image 
                  source={require('../../assets/images/drop_icon.png')}
                  style={styles.phaseIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
        </View>

        {/* Daily Insights Section */}
        <View style={styles.dailyInsightsSection}>
          <Text style={styles.dailyInsightsTitle}>My daily insights</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.insightsScrollView}
            contentContainerStyle={styles.insightsScrollContent}
          >
            {/* Add Symptoms Card */}
            <TouchableOpacity 
              style={[styles.insightCard, styles.addSymptomCard]}
              onPress={() => setShowSymptomTracker(true)}
              activeOpacity={0.8}
            >
              <View style={styles.addSymptomIcon}>
                <View style={styles.addSymptomCircle}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Symptom Cards */}
            {todaySymptoms.length > 0 ? (
              todaySymptoms.map((symptom) => {
                const symptomInfo = symptomData[symptom.type as SymptomType]
                if (!symptomInfo) return null
                
                // Get label from symptomOptions for display
                const symptomOption = symptomOptions.find(opt => opt.type === symptom.type)
                const displayLabel = symptomOption?.label || symptomInfo.title
                
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.insightCard, styles.symptomCard]}
                    onPress={() => {
                      router.push({
                        pathname: '/chat',
                        params: {
                          initialQuestion: `I am having ${displayLabel.toLowerCase()}. Can you help me with tips and advice?`
                        }
                      })
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.symptomCardHeader}>
                      <Text style={styles.symptomEmoji}>{symptomInfo.emoji}</Text>
                      {symptom.severity && (
                        <View style={styles.severityBadge}>
                          <Text style={styles.severityText}>
                            {symptom.severity}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.symptomCardContent}>
                      <Text style={styles.symptomCardTitle} numberOfLines={2}>
                        {displayLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })
            ) : null}

            {/* "Is it okay?" Card */}
            <TouchableOpacity
              style={[styles.insightCard, styles.questionCard]}
              onPress={() => {
                router.push({
                  pathname: '/chat',
                  params: {
                    initialQuestion: 'Is it okay?'
                  }
                })
              }}
              activeOpacity={0.8}
            >
              <View style={styles.questionCardContent}>
                <View style={styles.questionIconCircle}>
                  <Ionicons name="help-circle" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.questionTextBox}>
                  <Text style={styles.questionText}>Is it normal?</Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Phase Scientific Information Section */}
        <View style={styles.phaseInfoSection}>
          <View style={styles.phaseInfoHeader}>
            <Text style={styles.phaseInfoTitle}>Your Current Cycle</Text>
          </View>

          <View style={styles.phaseInfoCard}>
            <Text style={styles.phaseInfoPhaseTitle}>{phaseInfo.title}</Text>
            
            {/* Scientific Explanation */}
            <Text style={styles.phaseInfoExplanation}>{phaseInfo.scientificExplanation}</Text>

            {/* Separator Line */}
            <View style={styles.sectionSeparator} />

            {/* Hormone Status */}
            <View style={styles.hormoneStatusContainer}>
              {phaseInfo.hormoneStatus.map((hormone, index) => (
                <View key={index} style={styles.hormoneStatusItem}>
                  <Text style={styles.hormoneName}>{hormone.name}:</Text>
                  <Text style={styles.hormoneStatus}>{hormone.status}</Text>
                </View>
              ))}
            </View>

            {/* Separator Line */}
            <View style={styles.sectionSeparator} />

            {/* Common Experiences */}
            <View style={styles.commonExperiencesContainer}>
              <Text style={styles.commonExperiencesTitle}>Common Experiences</Text>
              {phaseInfo.commonExperiences.map((experience, index) => (
                <View key={index} style={styles.experienceItem}>
                  <Text style={styles.experienceBullet}>•</Text>
                  <Text style={styles.experienceText}>{experience}</Text>
                </View>
              ))}
            </View>

            {/* Separator Line */}
            <View style={styles.sectionSeparator} />

            {/* Meaningful Information Sections */}
            <View style={styles.meaningfulInfoContainer}>
              <View style={styles.meaningfulInfoBox}>
                <Text style={styles.meaningfulInfoTitle}>💭 Mood</Text>
                <Text style={styles.meaningfulInfoText}>{phaseInfo.moodInfo}</Text>
              </View>

              <View style={styles.meaningfulInfoBox}>
                <Text style={styles.meaningfulInfoTitle}>🍎 Food</Text>
                <Text style={styles.meaningfulInfoText}>{phaseInfo.foodInfo}</Text>
              </View>

              <View style={styles.meaningfulInfoBox}>
                <Text style={styles.meaningfulInfoTitle}>🏃 Exercise</Text>
                <Text style={styles.meaningfulInfoText}>{phaseInfo.exerciseInfo}</Text>
              </View>
            </View>

            {/* Separator Line */}
            <View style={styles.sectionSeparator} />

            {/* Predictions Section */}
            <View style={styles.predictionsContainer}>
              <Text style={styles.predictionsText}>
                As you track cramps over time, we will help you learn your patterns and give you predictions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Symptom Tracker Modal */}
      {showSymptomTracker && (
        <SymptomTracker
          date={new Date()}
          onClose={() => {
            setShowSymptomTracker(false)
          }}
          onSave={() => {
            loadData()
          }}
        />
      )}
      </SafeAreaView>
    </ExpoLinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5FF',
  },
  scrollView: {
    flex: 1,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
    width: '100%',
    height: 400,
  },
  heartImageContainer: {
    position: 'absolute',
    top: 15,
    left: 0,
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heartImage: {
    width: 340,
    height: 340,
    opacity: 0.7,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: 50,
    right: 10,
    zIndex: 7,
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 400,
    height: 400,
    zIndex: 6,
    pointerEvents: 'box-none',
  },
  mascotEmoji: {
    fontSize: 150,
  },
  phaseCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 6,
  },
  phaseCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 16,
    minHeight: 65,
    // 3D Rising Effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'space-between',
  },
  fertileCard: {
    backgroundColor: '#E3F2FD', // Light blue
  },
  ovulationCard: {
    backgroundColor: '#FFE8D6', // Light peach/orange
  },
  periodCard: {
    backgroundColor: '#FFE5ED', // Light pink
  },
  phaseCardTextContainer: {
    flex: 1,
  },
  phaseCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  phaseCardDate: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  phaseCardIconBottom: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  phaseIconImage: {
    width: 40,
    height: 40,
  },
  dailyInsightsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  dailyInsightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  insightsScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  insightsScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  insightCard: {
    width: 140,
    height: 160,
    borderRadius: 16,
    backgroundColor: Colors.white,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addSymptomCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  addSymptomIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSymptomCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symptomCard: {
    justifyContent: 'space-between',
  },
  symptomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  symptomEmoji: {
    fontSize: 32,
  },
  severityBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  symptomCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  symptomCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionCardContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  questionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9B8EE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionTextBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  logPeriodCircleButton: {
    position: 'absolute',
    top: 290,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logPeriodCircleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  careSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  careHeader: {
    marginBottom: 20,
  },
  careTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  careSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  combinedCareCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)',
  },
  motivationalSection: {
    marginBottom: 15,
    gap: 10,
  },
  encouragingCard: {
    backgroundColor: 'rgba(255, 107, 157, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  encouragingCardText: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quickTipsContainer: {
    marginBottom: 15,
  },
  quickTipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  tipsScroll: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  quickTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
    maxWidth: 200,
  },
  quickTipText: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 6,
    flex: 1,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationBox: {
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  motivationalClosing: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  motivationalClosingText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  phaseInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  phaseInfoHeader: {
    marginBottom: 16,
  },
  phaseInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  phaseInfoCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  phaseInfoPhaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  phaseInfoExplanation: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  hormoneStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  hormoneStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  hormoneName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 6,
  },
  hormoneStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  commonExperiencesContainer: {
    marginBottom: 20,
  },
  commonExperiencesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 4,
  },
  experienceBullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  experienceText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    flex: 1,
  },
  meaningfulInfoContainer: {
    gap: 14,
    marginBottom: 20,
  },
  meaningfulInfoBox: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
  },
  meaningfulInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  meaningfulInfoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  predictionsContainer: {
    marginTop: 0,
    paddingTop: 0,
  },
  predictionsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: Colors.border || '#E0E0E0',
    marginVertical: 16,
    width: '100%',
  },
})