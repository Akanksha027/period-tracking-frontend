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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import Svg, { Circle, G, Text as SvgText, Path } from 'react-native-svg'
import { Colors } from '../../constants/Colors'
import {
  getPeriods,
  getSettings,
  createPeriod,
  Period,
  UserSettings,
} from '../../lib/api'
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

  // Calculate predictions
  const predictions = useMemo<CyclePredictions>(() => {
    return calculatePredictions(periods, settings)
  }, [periods, settings])

  // Calculate days until next period
  const daysUntilPeriod = useMemo(() => {
    if (!predictions.nextPeriodDate) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextPeriod = new Date(predictions.nextPeriodDate)
    nextPeriod.setHours(0, 0, 0, 0)
    
    const diff = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : null
  }, [predictions.nextPeriodDate])

  // Check if currently on period
  const currentPeriodInfo = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return getPeriodDayInfo(today, periods)
  }, [periods])

  // Check if currently on period
  const isOnPeriod = useMemo(() => {
    return currentPeriodInfo !== null
  }, [currentPeriodInfo])

  // Get pregnancy chance message
  const pregnancyChance = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayInfo = getDayInfo(today, periods, predictions)
    
    if (dayInfo.isFertile) return 'High chance'
    if (dayInfo.isPMS) return 'Very low chance'
    if (dayInfo.phase === 'period') return 'Very low chance'
    if (dayInfo.phase === 'predicted_period') return 'Very low chance'
    return 'Low chance'
  }, [periods, predictions])

  // Generate dates for the circle (next 30 days)
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

    // Check if period already logged for today
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

  const getPhaseColor = (phase: string, confidence: string): string => {
    switch (phase) {
      case 'period':
        return Colors.primary // Pink
      case 'fertile':
        return '#4A90E2' // Blue
      case 'pms':
        return '#FFD93D' // Yellow
      case 'predicted_period':
        return confidence === 'low' ? '#CCCCCC' : Colors.primary // Grey or Pink
      default:
        return 'transparent'
    }
  }

  const getPhaseBackgroundColor = (phase: string, confidence: string): string => {
    switch (phase) {
      case 'period':
        return 'rgba(255, 107, 157, 0.15)' // Light pink
      case 'fertile':
        return 'rgba(74, 144, 226, 0.15)' // Light blue
      case 'pms':
        return 'rgba(255, 217, 61, 0.15)' // Light yellow
      case 'predicted_period':
        return confidence === 'low' ? 'rgba(204, 204, 204, 0.1)' : 'rgba(255, 107, 157, 0.15)'
      default:
        return 'transparent'
    }
  }

  const renderCircleDates = () => {
    const elements: React.ReactElement[] = []
    const centerX = 160
    const centerY = 160
    const radius = 130

    // Group consecutive dates with same phase
    let currentPhase: string | null = null
    let phaseStartIdx = 0

    const addPhaseArc = (startIdx: number, endIdx: number, phase: string, confidence: string) => {
      if (startIdx === endIdx) return

      const startAngle = (startIdx / 30) * 2 * Math.PI - Math.PI / 2
      const endAngle = ((endIdx + 1) / 30) * 2 * Math.PI - Math.PI / 2

      const innerRadius = radius - 25
      const outerRadius = radius + 5

      const startX1 = centerX + innerRadius * Math.cos(startAngle)
      const startY1 = centerY + innerRadius * Math.sin(startAngle)
      const endX1 = centerX + innerRadius * Math.cos(endAngle)
      const endY1 = centerY + innerRadius * Math.sin(endAngle)

      const startX2 = centerX + outerRadius * Math.cos(startAngle)
      const startY2 = centerY + outerRadius * Math.sin(startAngle)
      const endX2 = centerX + outerRadius * Math.cos(endAngle)
      const endY2 = centerY + outerRadius * Math.sin(endAngle)

      const largeArcFlag = endIdx - startIdx > 15 ? 1 : 0

      const pathData = `M ${startX1} ${startY1} 
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endX1} ${endY1}
        L ${endX2} ${endY2}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${startX2} ${startY2}
        Z`

      elements.push(
        <Path
          key={`phase-${startIdx}-${endIdx}`}
          d={pathData}
          fill={getPhaseBackgroundColor(phase, confidence)}
        />
      )
    }

    for (let i = 0; i < circleDates.length; i++) {
      const dateInfo = circleDates[i]
      const phase = dateInfo.phase

      if (phase !== currentPhase) {
        if (currentPhase !== null) {
          addPhaseArc(phaseStartIdx, i - 1, currentPhase, circleDates[phaseStartIdx].confidence)
        }
        currentPhase = phase
        phaseStartIdx = i
      }
    }

    // Add final phase arc
    if (currentPhase !== null) {
      addPhaseArc(phaseStartIdx, circleDates.length - 1, currentPhase, circleDates[phaseStartIdx].confidence)
    }

    // Render date numbers
    for (let i = 0; i < circleDates.length; i++) {
      const dateInfo = circleDates[i]
      const angle = (i / 30) * 2 * Math.PI - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      const isToday = i === 0
      const phaseColor = getPhaseColor(dateInfo.phase, dateInfo.confidence)
      const textColor = isToday ? Colors.primary : dateInfo.phase === 'normal' ? '#CCCCCC' : phaseColor

      elements.push(
        <G key={`date-${i}`}>
          {isToday && (
            <Circle
              cx={x}
              cy={y}
              r="16"
              fill="none"
              stroke={Colors.primary}
              strokeWidth="2"
            />
          )}
          <SvgText
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize={isToday ? '15' : '13'}
            fill={textColor}
            fontWeight={isToday ? '700' : '600'}
          >
            {dateInfo.day}
          </SvgText>
          <Circle
            cx={x}
            cy={y + 20}
            r="5"
            fill={phaseColor === 'transparent' ? '#CCCCCC' : phaseColor}
          />
        </G>
      )
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>

        {/* Circle Calendar */}
        <View style={styles.circleContainer}>
          <View style={styles.circleWrapper}>
            <Svg width="320" height="320" viewBox="0 0 320 320">
              {/* Background circle */}
              <Circle
                cx="160"
                cy="160"
                r="140"
                fill="#F8F8F8"
                opacity={1}
              />

              {/* Phase background arcs and date numbers */}
              {renderCircleDates()}
            </Svg>

            {/* Center Content */}
            <View style={styles.centerContent}>
              {isOnPeriod && currentPeriodInfo ? (
                <>
                  <Text style={styles.periodInText}>Today is the</Text>
                  <Text style={styles.daysText}>{currentPeriodInfo.dayLabel}</Text>
                  <Text style={styles.daysLabel}>of your period</Text>
                  <Text style={styles.chanceText}>Currently on period</Text>
                  <TouchableOpacity style={styles.logButton} onPress={() => router.push('/(tabs)/calendar')}>
                    <Text style={styles.logButtonText}>View Calendar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.periodInText}>Period in</Text>
                  <Text style={styles.daysText}>
                    {daysUntilPeriod !== null ? `${daysUntilPeriod}` : '--'}
                  </Text>
                  <Text style={styles.daysLabel}>{daysUntilPeriod === 1 ? 'Day' : 'Days'}</Text>
                  <Text style={styles.chanceText}>{pregnancyChance} chance of getting</Text>
                  <Text style={styles.chanceText}>pregnant</Text>
                  <TouchableOpacity style={styles.logButton} onPress={handleLogPeriod}>
                    <Text style={styles.logButtonText}>Log Period</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* My Daily Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>My Daily Insights</Text>
          <View style={styles.insightsGrid}>
            <TouchableOpacity
              style={styles.addCard}
              onPress={() => router.push('/(tabs)/calendar')}
            >
              <View style={styles.addIcon}>
                <Text style={styles.addIconText}>+</Text>
              </View>
              <Text style={styles.addText}>Add</Text>
              <Text style={styles.addSubtext}>Symptoms</Text>
            </TouchableOpacity>

            <View style={styles.insightCard}>
              <Text style={styles.cardEmoji}>🥗</Text>
              <Text style={styles.cardTitle}>Food Advice</Text>
              <Text style={styles.cardSubtitle}>Today</Text>
            </View>

            <View style={[styles.insightCard, styles.cycleCard]}>
              <Text style={styles.cycleText}>Cycle</Text>
              <Text style={styles.cycleNumber}>{predictions.cycleLength}</Text>
            </View>

            <View style={[styles.insightCard, styles.chanceCard]}>
              <Text style={styles.chanceEmoji}>😊</Text>
              <Text style={styles.chanceCardText}>Today's chance</Text>
              <Text style={styles.chanceCardText}>of pregnancy</Text>
              <Text style={styles.chanceLevel}>{pregnancyChance}</Text>
            </View>
          </View>
        </View>

        {/* Food Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Food Recommendations</Text>
          <View style={styles.recommendationCards}>
            <View style={styles.recommendationCard}>
              <View style={styles.purpleDot} />
            </View>
            <View style={styles.recommendationCard}>
              <View style={styles.grayDot} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
  },
  circleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  circleWrapper: {
    width: 320,
    height: 320,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  centerContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -70 }],
    alignItems: 'center',
    width: 180,
  },
  periodInText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  daysText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 0,
  },
  daysLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  logButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 15,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#F5F4FF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  addIconText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  addText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  addSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  insightCard: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 15,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F4E8',
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  cycleCard: {
    backgroundColor: '#FFD4C8',
  },
  cycleText: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
  },
  cycleNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  chanceCard: {
    backgroundColor: '#D4DFFF',
  },
  chanceEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  chanceCardText: {
    fontSize: 9,
    color: Colors.text,
    textAlign: 'center',
  },
  chanceLevel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  recommendationCards: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationCard: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purpleDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4C8FF',
  },
  grayDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
})
