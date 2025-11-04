import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Colors } from '../../constants/Colors'
import {
  getPeriods,
  getSettings,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getSymptoms,
  getMoods,
  Period,
  UserSettings,
  Symptom,
  Mood,
} from '../../lib/api'
import {
  calculatePredictions,
  getDayInfo,
  getPeriodDayInfo,
  getPhaseNote,
  DayInfo,
  CyclePredictions,
} from '../../lib/periodCalculations'
import { Ionicons } from '@expo/vector-icons'
import SymptomTracker from '../../components/SymptomTracker'
import { symptomOptions, symptomData, SymptomType } from '../../lib/symptomTips'

const { width, height: screenHeight } = Dimensions.get('window')
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function CalendarScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<Period[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDayInfo, setSelectedDayInfo] = useState<DayInfo | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [newPeriodDate, setNewPeriodDate] = useState<Date>(new Date())
  const [daySymptoms, setDaySymptoms] = useState<Symptom[]>([])
  const [dayMoods, setDayMoods] = useState<Mood[]>([])
  const [showSymptomTracker, setShowSymptomTracker] = useState(false)
  const [symptomTrackerDate, setSymptomTrackerDate] = useState<Date>(new Date())
  const scrollViewRef = useRef<ScrollView>(null)

  const predictions = useMemo<CyclePredictions>(() => {
    return calculatePredictions(periods, settings)
  }, [periods, settings])

  // Helper function for generating months
  const generateMonths = useCallback(() => {
    const months = []
    const today = new Date()
    
    for (let i = -2; i <= 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      months.push(date)
    }
    
    return months
  }, [])

  const months = useMemo(() => generateMonths(), [generateMonths])
  
  // Create a key that changes when periods or predictions change to force re-render
  const calendarKey = useMemo(() => {
    return `${periods.length}-${periods.map(p => p.id).join('-')}-${predictions.nextPeriodDate?.getTime() || ''}`
  }, [periods, predictions])

  useEffect(() => {
    loadData()
  }, [])

  // Auto-scroll to current month when calendar is loaded
  useEffect(() => {
    if (!loading && months.length > 0 && scrollViewRef.current) {
      // Find the index of the current month (month with index 2, since we start at -2)
      const currentMonthIndex = 2
      // Calculate approximate scroll position (each month is roughly 400px tall)
      const monthHeight = 400
      const scrollOffset = currentMonthIndex * monthHeight
      
      // Delay scroll to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollOffset,
          animated: true,
        })
      }, 300)
    }
  }, [loading, months.length])

  useFocusEffect(
    useCallback(() => {
      loadData()
      // Auto-scroll to current month when screen is focused
      if (months.length > 0 && scrollViewRef.current) {
        const currentMonthIndex = 2
        const monthHeight = 400
        const scrollOffset = currentMonthIndex * monthHeight
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: scrollOffset,
            animated: true,
          })
        }, 300)
      }
    }, [months.length])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  const loadData = async () => {
    // Don't block UI - show calendar immediately with cached/empty data
    setLoading(false)
    
    // Load data in background
    try {
      const [periodsData, settingsData] = await Promise.all([
        getPeriods().catch(() => []),
        getSettings().catch(() => null),
      ])
      setPeriods(periodsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    }
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday=0 to Sunday=6, Monday=0
  }

  const getDayStatus = (date: Date) => {
    const dayInfo = getDayInfo(date, periods, predictions)
    
    // Check if it's an actual period day
    const isPeriodDay = periods.some((period) => {
      const start = new Date(period.startDate)
      start.setHours(0, 0, 0, 0)
      const end = period.endDate ? new Date(period.endDate) : start
      end.setHours(0, 0, 0, 0)
      return date >= start && date <= end
    })

    if (isPeriodDay) {
      // Find position in period (start, middle, end)
      const period = periods.find((p) => {
        const start = new Date(p.startDate)
        start.setHours(0, 0, 0, 0)
        const end = p.endDate ? new Date(p.endDate) : start
        end.setHours(0, 0, 0, 0)
        return date >= start && date <= end
      })
      
      if (period) {
        const start = new Date(period.startDate)
        start.setHours(0, 0, 0, 0)
        const end = period.endDate ? new Date(period.endDate) : start
        end.setHours(0, 0, 0, 0)
        
        const isFirst = date.getTime() === start.getTime()
        const isLast = date.getTime() === end.getTime()
        
        return {
          type: 'period',
          isFirst,
          isLast,
          isSingle: isFirst && isLast,
        }
      }
    }

    // Check if it's ovulation day FIRST (exact day, not just fertile window)
    // This takes precedence over fertile window to show ovulation day distinctly
    if (predictions.ovulationDate) {
      const ovulationDate = new Date(predictions.ovulationDate)
      ovulationDate.setHours(0, 0, 0, 0)
      if (date.getTime() === ovulationDate.getTime()) {
        return { type: 'ovulation' }
      }
    }

    // Check if it's PMS phase
    if (dayInfo.isPMS) {
      return { type: 'pms' }
    }

    // Check fertile window (but exclude ovulation day which is already handled above)
    if (dayInfo.isFertile) {
      // Double check it's not ovulation day
      if (predictions.ovulationDate) {
        const ovulationDate = new Date(predictions.ovulationDate)
        ovulationDate.setHours(0, 0, 0, 0)
        if (date.getTime() !== ovulationDate.getTime()) {
          return { type: 'fertile' }
        }
      } else {
        return { type: 'fertile' }
      }
    }

    if (dayInfo.phase === 'predicted_period') {
      // Check if first or last of predicted period
      const yesterday = new Date(date)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(date)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const yesterdayInfo = getDayInfo(yesterday, periods, predictions)
      const tomorrowInfo = getDayInfo(tomorrow, periods, predictions)
      
      const isFirst = !yesterdayInfo.isPredicted
      const isLast = !tomorrowInfo.isPredicted
      
      return {
        type: dayInfo.confidence === 'low' ? 'predicted_low' : 'predicted',
        isFirst,
        isLast,
        isSingle: isFirst && isLast,
      }
    }

    return { type: 'normal' }
  }

  const loadDaySymptoms = useCallback(async (dateString: string) => {
    // Clear immediately for instant UI response
    setDaySymptoms([])
    setDayMoods([])
    
    try {
      // Convert dateString (YYYY-MM-DD) to ISO format for API
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      date.setHours(0, 0, 0, 0)
      const startOfDay = date.toISOString()
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      const endOfDayISO = endOfDay.toISOString()
      
      const [symptoms, moods] = await Promise.all([
        getSymptoms(startOfDay, endOfDayISO).catch(() => []),
        getMoods(startOfDay, endOfDayISO).catch(() => [])
      ])
      
      // Filter to ensure we only show symptoms for this exact date
      const filteredSymptoms = symptoms.filter(symptom => {
        const symptomDate = new Date(symptom.date)
        symptomDate.setHours(0, 0, 0, 0)
        return symptomDate.getTime() === date.getTime()
      })
      
      const filteredMoods = moods.filter(mood => {
        const moodDate = new Date(mood.date)
        moodDate.setHours(0, 0, 0, 0)
        return moodDate.getTime() === date.getTime()
      })
      
      setDaySymptoms(filteredSymptoms)
      setDayMoods(filteredMoods)
    } catch (error) {
      console.error('Error loading day symptoms:', error)
    }
  }, [])

  const handleDayPress = useCallback((dateString: string, date: Date) => {
    const dayInfo = getDayInfo(date, periods, predictions)
    
    const periodForDay = periods.find((period) => {
      const start = new Date(period.startDate)
      start.setHours(0, 0, 0, 0)
      const end = period.endDate ? new Date(period.endDate) : start
      end.setHours(0, 0, 0, 0)
      return date >= start && date <= end
    })
    
    setSelectedDate(dateString)
    setSelectedDayInfo(dayInfo)
    setShowDayDetail(true)
    loadDaySymptoms(dateString)
  }, [periods, predictions, loadDaySymptoms])

  const renderMonth = useCallback((monthDate: Date) => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' })
    
    const days = []
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      // Create dateString in local timezone to avoid UTC conversion issues
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const status = getDayStatus(date)
      
      let containerStyle: any[] = [styles.dayCell]
      let textStyle: any[] = [styles.dayText]
      
      if (status.type === 'period') {
        containerStyle = [
          styles.dayCell,
          styles.periodDay,
          status.isFirst && styles.periodFirst,
          status.isLast && styles.periodLast,
          status.isSingle && styles.periodSingle,
        ].filter(Boolean)
        textStyle = [styles.dayText, styles.periodText]
      } else if (status.type === 'fertile') {
        containerStyle = [styles.dayCell, styles.fertileDay]
        textStyle = [styles.dayText, styles.fertileText]
      } else if (status.type === 'ovulation') {
        containerStyle = [styles.dayCell, styles.ovulationDay]
        textStyle = [styles.dayText, styles.ovulationText]
      } else if (status.type === 'pms') {
        containerStyle = [styles.dayCell, styles.pmsDay]
        textStyle = [styles.dayText, styles.pmsText]
      } else if (status.type === 'predicted') {
        containerStyle = [
          styles.dayCell,
          styles.predictedDay,
          status.isFirst && styles.periodFirst,
          status.isLast && styles.periodLast,
          status.isSingle && styles.periodSingle,
        ].filter(Boolean)
        textStyle = [styles.dayText, styles.predictedText]
      } else if (status.type === 'predicted_low') {
        containerStyle = [
          styles.dayCell,
          styles.predictedLowDay,
          status.isFirst && styles.periodFirst,
          status.isLast && styles.periodLast,
          status.isSingle && styles.periodSingle,
        ].filter(Boolean)
        textStyle = [styles.dayText, styles.predictedText]
      }
      
      days.push(
        <TouchableOpacity
          key={day}
          style={containerStyle}
          onPress={() => handleDayPress(dateString, date)}
        >
          <Text style={textStyle}>{day}</Text>
          {status.type !== 'normal' && <View style={styles.dotIndicator} />}
        </TouchableOpacity>
      )
    }
    
    return (
      <View key={`${year}-${month}`} style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
    )
  }, [periods, predictions, handleDayPress, getDayStatus])

  const handleEditPeriod = () => {
    if (!editingPeriod) return
    setNewPeriodDate(new Date(editingPeriod.startDate))
    setShowDatePicker(true)
  }

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    
    if (selectedDate) {
      setNewPeriodDate(selectedDate)
      if (Platform.OS !== 'ios') {
        updatePeriodDate(selectedDate)
      }
    }
  }

  const updatePeriodDate = async (newDate: Date) => {
    if (!editingPeriod) return

    try {
      newDate.setHours(0, 0, 0, 0)
      const newDateString = newDate.toISOString()
      
      // Calculate period length - use existing period length or settings
      const oldStart = new Date(editingPeriod.startDate)
      const oldEnd = editingPeriod.endDate ? new Date(editingPeriod.endDate) : oldStart
      oldStart.setHours(0, 0, 0, 0)
      oldEnd.setHours(0, 0, 0, 0)
      
      let periodLength = Math.ceil((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      // If period length seems wrong (e.g., 1 day), use settings default
      if (periodLength < 2) {
        periodLength = settings?.averagePeriodLength ?? 5
      }
      
      const newEndDate = new Date(newDate)
      newEndDate.setDate(newEndDate.getDate() + periodLength - 1)
      newEndDate.setHours(23, 59, 59, 999)
      
      await updatePeriod(editingPeriod.id, {
        startDate: newDateString,
        endDate: newEndDate.toISOString(),
      })

      setShowDayDetail(false)
      setShowDatePicker(false)
      // Force refresh
      setPeriods([])
      await loadData()
      Alert.alert('Success', 'Period date updated successfully!')
    } catch (error: any) {
      console.error('Error updating period:', error)
      Alert.alert('Error', error.message || 'Failed to update period date')
    }
  }

  const handleDeletePeriod = () => {
    if (!editingPeriod) return

    Alert.alert(
      'Delete Period',
      'Are you sure you want to delete this period?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePeriod(editingPeriod.id)
              setShowDayDetail(false)
              // Force refresh by clearing state first
              setPeriods([])
              await loadData()
              // Small delay to ensure state updates
              setTimeout(() => {
                Alert.alert('Success', 'Period deleted successfully!')
              }, 100)
            } catch (error: any) {
              console.error('Error deleting period:', error)
              Alert.alert('Error', error.message || 'Failed to delete period')
            }
          },
        },
      ]
    )
  }

  const handleLogPeriod = async () => {
    if (!selectedDate) return

    try {
      // Parse date string (YYYY-MM-DD) in local timezone to avoid UTC conversion issues
      const [year, month, day] = selectedDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      date.setHours(0, 0, 0, 0)

      const overlappingPeriod = periods.find((period) => {
        const start = new Date(period.startDate)
        start.setHours(0, 0, 0, 0)
        const end = period.endDate ? new Date(period.endDate) : start
        end.setHours(0, 0, 0, 0)
        return date >= start && date <= end
      })

      if (overlappingPeriod) {
        Alert.alert('Already Logged', 'This day is already part of a logged period.')
        setShowDayDetail(false)
        return
      }

      // Use user's average period length from settings, default to 5
      const periodLength = settings?.averagePeriodLength ?? 5
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + periodLength - 1)
      endDate.setHours(23, 59, 59, 999) // End of day

      await createPeriod({
        startDate: date.toISOString(),
        endDate: endDate.toISOString(),
        flowLevel: 'medium',
      })

      await loadData()
      setShowDayDetail(false)
      Alert.alert('Success', 'Period logged successfully!')
    } catch (error: any) {
      console.error('Error logging period:', error)
      Alert.alert('Error', error.message || 'Failed to log period.')
    }
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.headerTitle}>Calendar</Text>
      </View>

      {/* Legend in corner */}
      <View style={styles.legendCorner}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF69B4' }]} />
          <Text style={styles.legendText}>Period</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#87CEEB' }]} />
          <Text style={styles.legendText}>Fertile</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4169E1' }]} />
          <Text style={styles.legendText}>Ovulation</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB6C1' }]} />
          <Text style={styles.legendText}>PMS</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#B0D4F1' }]} />
          <Text style={styles.legendText}>Predicted</Text>
        </View>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((day, index) => (
          <View key={index} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable calendar */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        decelerationRate="normal"
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View key={calendarKey}>
          {months.map((month) => renderMonth(month))}
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <Modal
        visible={showDayDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayDetail(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDayDetail(false)}>
          <Pressable style={styles.dayDetailSheet} onPress={(e) => e.stopPropagation()}>
            {selectedDayInfo && (
              <>
                <View style={styles.dayDetailHeader}>
                  <Text style={styles.dayDetailTitle}>
                    {selectedDate && (() => {
                      // Parse date string in local timezone to avoid UTC conversion issues
                      const [year, month, day] = selectedDate.split('-').map(Number)
                      const date = new Date(year, month - 1, day)
                      return date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    })()}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDayDetail(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.dayDetailContent}
                  contentContainerStyle={styles.dayDetailContentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.phaseIndicator}>
                    <View
                      style={[
                        styles.phaseDot,
                        {
                          backgroundColor:
                            selectedDayInfo.phase === 'period'
                              ? '#FF69B4'
                              : selectedDayInfo.phase === 'fertile'
                              ? '#87CEEB'
                              : selectedDayInfo.phase === 'predicted_period'
                              ? selectedDayInfo.confidence === 'low' ? '#B0D4F1' : '#87CEEB'
                              : Colors.border,
                        },
                      ]}
                    />
                    <Text style={styles.phaseText}>
                      {selectedDayInfo.phase === 'period'
                        ? 'Period Day'
                        : selectedDayInfo.phase === 'fertile'
                        ? 'Fertile Window'
                        : selectedDayInfo.phase === 'predicted_period'
                        ? 'Predicted Period'
                        : 'Normal Day'}
                    </Text>
                  </View>

                  {/* Show period day info if it's a period day */}
                  {editingPeriod && selectedDate && (() => {
                    // Parse date string in local timezone to avoid UTC conversion issues
                    const [year, month, day] = selectedDate.split('-').map(Number)
                    const date = new Date(year, month - 1, day)
                    const periodDayInfo = getPeriodDayInfo(date, periods)
                    return periodDayInfo ? (
                      <View style={styles.periodDayInfo}>
                        <View style={styles.periodDayBadge}>
                          <Text style={styles.periodDayText}>{periodDayInfo.dayLabel}</Text>
                        </View>
                        <Text style={styles.periodDaySubtext}>
                          Day {periodDayInfo.dayNumber} of {periodDayInfo.periodLength} day period
                        </Text>
                      </View>
                    ) : null
                  })()}

                  <Text style={styles.phaseNote}>{getPhaseNote(selectedDayInfo.phase)}</Text>

                  {selectedDayInfo.isPredicted && (
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {selectedDayInfo.confidence === 'high'
                          ? 'High Confidence'
                          : selectedDayInfo.confidence === 'medium'
                          ? 'Medium Confidence'
                          : 'Low Confidence'}
                      </Text>
                    </View>
                  )}

                  {/* Moods Section */}
                  {dayMoods.length > 0 && (
                    <View style={styles.symptomsSection}>
                      <Text style={styles.symptomsTitle}>Mood:</Text>
                      <View style={styles.symptomsList}>
                        {dayMoods.map((mood) => {
                          const moodLabels: Record<string, { label: string; emoji: string }> = {
                            calm: { label: 'Calm', emoji: '😌' },
                            happy: { label: 'Happy', emoji: '😊' },
                            energetic: { label: 'Energetic', emoji: '⚡' },
                            frisky: { label: 'Frisky', emoji: '😏' },
                            mood_swings: { label: 'Mood Swings', emoji: '😔' },
                            irritated: { label: 'Irritated', emoji: '😠' },
                            sad: { label: 'Sad', emoji: '😢' },
                            anxious: { label: 'Anxious', emoji: '😰' },
                            depressed: { label: 'Depressed', emoji: '😞' },
                            feeling_guilty: { label: 'Feeling Guilty', emoji: '😔' },
                            obsessive_thoughts: { label: 'Obsessive Thoughts', emoji: '☁️' },
                            low_energy: { label: 'Low Energy', emoji: '🔋' },
                            apathetic: { label: 'Apathetic', emoji: '😑' },
                            confused: { label: 'Confused', emoji: '😕' },
                            very_self_critical: { label: 'Very Self-Critical', emoji: '❗' },
                          }
                          const moodInfo = moodLabels[mood.type] || { label: mood.type, emoji: '📝' }
                          return (
                            <View key={mood.id} style={styles.symptomBadge}>
                              <Text style={styles.symptomBadgeEmoji}>{moodInfo.emoji}</Text>
                              <Text style={styles.symptomBadgeText}>{moodInfo.label}</Text>
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  )}

                  {/* Symptoms Section */}
                  {daySymptoms.length > 0 && (
                    <View style={styles.symptomsSection}>
                      <Text style={styles.symptomsTitle}>Symptoms logged:</Text>
                      <View style={styles.symptomsList}>
                        {daySymptoms.map((symptom) => {
                          const symptomOption = symptomOptions.find(s => s.type === symptom.type)
                          const symptomInfo = symptomData[symptom.type as SymptomType]
                          const displayLabel = symptomOption?.label || symptomInfo?.title || symptom.type
                          const emoji = symptomOption?.emoji || symptomInfo?.emoji || '📝'
                          
                          return (
                            <TouchableOpacity
                              key={symptom.id}
                              style={styles.symptomBadge}
                              onPress={() => {
                                setShowDayDetail(false)
                                router.push({
                                  pathname: '/chat',
                                  params: {
                                    initialQuestion: `I am having ${displayLabel.toLowerCase()}. Can you help me with tips and advice?`
                                  }
                                })
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.symptomBadgeEmoji}>{emoji}</Text>
                              <Text style={styles.symptomBadgeText}>{displayLabel}</Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    </View>
                  )}

                  {/* Log Symptom Button - Show for ANY date, but only if today or past with no data */}
                  {selectedDate && (() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    // Parse date string in local timezone to avoid UTC conversion issues
                    const [year, month, day] = selectedDate.split('-').map(Number)
                    const selected = new Date(year, month - 1, day)
                    selected.setHours(0, 0, 0, 0)
                    const isToday = today.getTime() === selected.getTime()
                    const isPast = selected.getTime() < today.getTime()
                    const hasNoData = daySymptoms.length === 0 && dayMoods.length === 0
                    
                    if (isToday) {
                      return (
                        <TouchableOpacity
                          style={styles.symptomButton}
                          onPress={() => {
                            setSymptomTrackerDate(selected)
                            setShowSymptomTracker(true)
                          }}
                        >
                          <Ionicons name="medical-outline" size={18} color={Colors.primary} />
                          <Text style={styles.symptomButtonText}>
                            {(daySymptoms.length > 0 || dayMoods.length > 0) ? 'Update Symptoms & Mood' : 'Add Symptoms & Mood'}
                          </Text>
                        </TouchableOpacity>
                      )
                    } else if (isPast && hasNoData) {
                      return (
                        <View style={styles.noSymptomsNote}>
                          <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
                          <Text style={styles.noSymptomsText}>No symptoms or mood logged for this day</Text>
                        </View>
                      )
                    } else if (isPast) {
                      // Past date with data - allow editing
                      return (
                        <TouchableOpacity
                          style={styles.symptomButton}
                          onPress={() => {
                            setSymptomTrackerDate(selected)
                            setShowSymptomTracker(true)
                          }}
                        >
                          <Ionicons name="medical-outline" size={18} color={Colors.primary} />
                          <Text style={styles.symptomButtonText}>Edit Symptoms & Mood</Text>
                        </TouchableOpacity>
                      )
                    }
                    return null
                  })()}

                  {editingPeriod && (
                    <View style={styles.editButtonsContainer}>
                      <TouchableOpacity style={styles.editButton} onPress={handleEditPeriod}>
                        <Ionicons name="create-outline" size={18} color={Colors.primary} />
                        <Text style={styles.editButtonText}>Edit Period Date</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePeriod}>
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        <Text style={[styles.editButtonText, { color: Colors.error }]}>Delete Period</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!editingPeriod && (
                    <TouchableOpacity style={styles.logButton} onPress={handleLogPeriod}>
                      <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
                      <Text style={styles.logButtonText}>Log Period</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.datePickerContainer} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select New Period Date</Text>
                <View style={styles.datePickerActions}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.datePickerButton}>
                    <Text style={styles.datePickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updatePeriodDate(newPeriodDate)}
                    style={[styles.datePickerButton, styles.datePickerButtonPrimary]}
                  >
                    <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextPrimary]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DateTimePicker
                value={newPeriodDate}
                mode="date"
                display="spinner"
                onChange={handleDatePickerChange}
                maximumDate={new Date()}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={newPeriodDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
          maximumDate={new Date()}
        />
      )}

      {/* Symptom Tracker Modal */}
      {showSymptomTracker && (
        <SymptomTracker
          date={symptomTrackerDate}
          onClose={() => {
            setShowSymptomTracker(false)
          }}
          onSave={async () => {
            // Reload data when symptoms are saved
            if (selectedDate) {
              // Parse date string in local timezone to avoid UTC conversion issues
              const [year, month, day] = selectedDate.split('-').map(Number)
              const date = new Date(year, month - 1, day)
              const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              await loadDaySymptoms(dateString)
              await loadData()
            }
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  legendCorner: {
    position: 'absolute',
    top: 80,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  monthContainer: {
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
    textAlign: 'center',
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  periodDay: {
    backgroundColor: '#FF69B4',
  },
  periodText: {
    color: '#FFFFFF',
  },
  periodFirst: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  periodLast: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  periodSingle: {
    borderRadius: 20,
  },
  fertileDay: {
    backgroundColor: '#87CEEB', // Light blue for fertile window
  },
  fertileText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ovulationDay: {
    backgroundColor: '#4169E1', // Royal blue for ovulation day
  },
  ovulationText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pmsDay: {
    backgroundColor: '#FFB6C1', // Light pink for PMS
  },
  pmsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  predictedDay: {
    backgroundColor: '#90EE90', // Light green for predicted periods
  },
  predictedLowDay: {
    backgroundColor: '#B0E0B0', // Lighter green for low confidence predictions
  },
  predictedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dayDetailSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    height: screenHeight * 0.7, // 70% of screen height - more than half
    paddingBottom: 40,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  dayDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  dayDetailContent: {
    flex: 1,
  },
  dayDetailContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  phaseDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  phaseNote: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodDayInfo: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 107, 157, 0.08)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  periodDayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  periodDayText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  periodDaySubtext: {
    fontSize: 15,
    color: Colors.text,
    marginTop: 4,
    fontWeight: '500',
  },
  symptomsSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  symptomsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  symptomBadgeEmoji: {
    fontSize: 18,
  },
  symptomBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  symptomButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  noSymptomsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    backgroundColor: Colors.surface,
  },
  noSymptomsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  logButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  editButtonsContainer: {
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  datePickerHeader: {
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  datePickerButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  datePickerButtonTextPrimary: {
    color: Colors.white,
  },
})