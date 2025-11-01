import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { Calendar } from 'react-native-calendars'
import { useFocusEffect } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Colors } from '../../constants/Colors'
import {
  getPeriods,
  getSettings,
  createPeriod,
  updatePeriod,
  deletePeriod,
  Period,
  UserSettings,
} from '../../lib/api'
import {
  calculatePredictions,
  getDayInfo,
  getPhaseNote,
  DayInfo,
  CyclePredictions,
} from '../../lib/periodCalculations'
import { Ionicons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<Period[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [markedDates, setMarkedDates] = useState<any>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDayInfo, setSelectedDayInfo] = useState<DayInfo | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [showEditDate, setShowEditDate] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [newPeriodDate, setNewPeriodDate] = useState<Date>(new Date())

  // Calculate predictions
  const predictions = useMemo<CyclePredictions>(() => {
    return calculatePredictions(periods, settings)
  }, [periods, settings])

  useEffect(() => {
    loadData()
  }, [])

  // Refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  useEffect(() => {
    if (periods.length > 0 || settings) {
      markCalendarDates()
    }
  }, [periods, settings, predictions])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [])

  const loadData = async () => {
    try {
      const [periodsData, settingsData] = await Promise.all([
        getPeriods().catch(() => []),
        getSettings().catch(() => null),
      ])
      setPeriods(periodsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markCalendarDates = () => {
    const marked: any = {}
    const today = new Date()

    // Mark actual period days
    periods.forEach((period) => {
      const startDate = new Date(period.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = period.endDate ? new Date(period.endDate) : startDate
      endDate.setHours(0, 0, 0, 0)

      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0]
        marked[dateString] = {
          dots: [
            {
              key: 'period',
              color: Colors.primary,
              selectedDotColor: Colors.primary,
            },
          ],
          marked: true,
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    // Mark predictions for next 90 days
    if (predictions.nextPeriodDate) {
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 90)

      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dayInfo = getDayInfo(currentDate, periods, predictions)
        const dateString = currentDate.toISOString().split('T')[0]

        // Don't override actual period days
        if (!marked[dateString]) {
          const dots: any[] = []

          if (dayInfo.isFertile) {
            dots.push({
              key: 'fertile',
              color: '#4A90E2', // Blue
              selectedDotColor: '#4A90E2',
            })
          }

          if (dayInfo.isPMS) {
            dots.push({
              key: 'pms',
              color: '#FFD93D', // Yellow
              selectedDotColor: '#FFD93D',
            })
          }

          if (dayInfo.phase === 'predicted_period') {
            dots.push({
              key: 'predicted',
              color: dayInfo.confidence === 'low' ? '#CCCCCC' : Colors.primary, // Grey for low confidence
              selectedDotColor:
                dayInfo.confidence === 'low' ? '#CCCCCC' : Colors.primary,
            })
          }

          if (dots.length > 0) {
            marked[dateString] = {
              dots,
              marked: true,
            }
          }
        } else {
          // Add other dots to existing period days if needed
          const dayInfo = getDayInfo(currentDate, periods, predictions)
          const existingDots = marked[dateString].dots || []

          if (dayInfo.isFertile && !existingDots.find((d: any) => d.key === 'fertile')) {
            existingDots.push({
              key: 'fertile',
              color: '#4A90E2',
            })
          }

          if (dayInfo.isPMS && !existingDots.find((d: any) => d.key === 'pms')) {
            existingDots.push({
              key: 'pms',
              color: '#FFD93D',
            })
          }

          marked[dateString].dots = existingDots
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    setMarkedDates(marked)
  }

  const handleDayPress = (day: any) => {
    const date = new Date(day.dateString)
    const dayInfo = getDayInfo(date, periods, predictions)
    
    // Find if this day is part of an actual period
    const periodForDay = periods.find((period) => {
      const start = new Date(period.startDate)
      start.setHours(0, 0, 0, 0)
      const end = period.endDate ? new Date(period.endDate) : start
      end.setHours(0, 0, 0, 0)
      return date >= start && date <= end
    })
    
    setSelectedDate(day.dateString)
    setSelectedDayInfo(dayInfo)
    setEditingPeriod(periodForDay || null)
    setShowDayDetail(true)
  }

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
      
      if (Platform.OS === 'ios') {
        // On iOS, we'll update immediately after user confirms
      } else {
        // On Android, update immediately
        updatePeriodDate(selectedDate)
      }
    }
  }

  const updatePeriodDate = async (newDate: Date) => {
    if (!editingPeriod) return

    try {
      const newDateString = newDate.toISOString()
      
      // Calculate end date (keep the same period length)
      const oldStart = new Date(editingPeriod.startDate)
      const oldEnd = editingPeriod.endDate ? new Date(editingPeriod.endDate) : oldStart
      const periodLength = Math.ceil((oldEnd.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      const newEndDate = new Date(newDate)
      newEndDate.setDate(newEndDate.getDate() + periodLength - 1)
      
      await updatePeriod(editingPeriod.id, {
        startDate: newDateString,
        endDate: newEndDate.toISOString(),
      })

      setShowDayDetail(false)
      setShowDatePicker(false)
      
      // Reload data to update predictions
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePeriod(editingPeriod.id)
              setShowDayDetail(false)
              await loadData()
              Alert.alert('Success', 'Period deleted successfully!')
            } catch (error: any) {
              console.error('Error deleting period:', error)
              Alert.alert('Error', error.message || 'Failed to delete period')
            }
          },
        },
      ]
    )
  }

  const getPeriodDayInfo = (date: Date, period: Period | null) => {
    if (!period) return null
    
    const startDate = new Date(period.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = period.endDate ? new Date(period.endDate) : startDate
    endDate.setHours(0, 0, 0, 0)
    
    date.setHours(0, 0, 0, 0)
    
    if (date < startDate || date > endDate) return null
    
    const diff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayNumber = diff + 1 // Day 1, 2, 3, etc.
    
    const periodLength = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const isStart = dayNumber === 1
    const isEnd = dayNumber === periodLength
    const isMiddle = dayNumber > 1 && dayNumber < periodLength
    
    let dayLabel = ''
    if (isStart) {
      dayLabel = '1st day (Start)'
    } else if (isMiddle) {
      dayLabel = `${dayNumber}th day`
    } else if (isEnd) {
      dayLabel = `${dayNumber}th day (End)`
    } else {
      dayLabel = `${dayNumber}th day`
    }
    
    return { dayNumber, dayLabel, periodLength, isStart, isMiddle, isEnd }
  }

  const handleLogPeriod = async () => {
    if (!selectedDate) return

    try {
      const date = new Date(selectedDate)
      date.setHours(0, 0, 0, 0)

      // Check if there's already a period that overlaps
      const overlappingPeriod = periods.find((period) => {
        const start = new Date(period.startDate)
        start.setHours(0, 0, 0, 0)
        const end = period.endDate ? new Date(period.endDate) : start
        end.setHours(0, 0, 0, 0)
        return date >= start && date <= end
      })

      if (overlappingPeriod) {
        // Already logged for this day
        Alert.alert('Already Logged', 'This day is already part of a logged period.')
        setShowDayDetail(false)
        return
      }

      // Create new period starting on this date
      // Default period length from settings
      const periodLength = settings?.averagePeriodLength || 5
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + periodLength - 1)

      await createPeriod({
        startDate: date.toISOString(),
        endDate: endDate.toISOString(),
        flowLevel: 'medium',
      })

      // Reload data to refresh calendar and predictions
      await loadData()
      setShowDayDetail(false)
      Alert.alert('Success', 'Period logged successfully! Your calendar has been updated.')
    } catch (error: any) {
      console.error('Error logging period:', error)
      Alert.alert('Error', error.message || 'Failed to log period. Please try again.')
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Track your cycle with confidence</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            markingType="multi-dot"
            onDayPress={handleDayPress}
            theme={{
              todayTextColor: Colors.primary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.white,
              arrowColor: Colors.primary,
              monthTextColor: Colors.text,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>🩷 Period Days</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
            <Text style={styles.legendText}>💙 Fertile Window</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD93D' }]} />
            <Text style={styles.legendText}>💛 PMS Days</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#CCCCCC' }]} />
            <Text style={styles.legendText}>⚪ Low Confidence Predictions</Text>
          </View>

          {predictions.nextPeriodDate && (
            <View style={styles.predictionBox}>
              <Text style={styles.predictionTitle}>Next Period Prediction</Text>
              <Text style={styles.predictionDate}>
                {new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.predictionConfidence}>
                Confidence: {predictions.confidence === 'high' ? 'High' : predictions.confidence === 'medium' ? 'Medium' : 'Low'}
              </Text>
              {predictions.confidence === 'low' && (
                <Text style={styles.predictionHint}>
                  Track more cycles to improve accuracy ✨
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Day Detail Sheet */}
      <Modal
        visible={showDayDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayDetail(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDayDetail(false)}
        >
          <Pressable style={styles.dayDetailSheet} onPress={(e) => e.stopPropagation()}>
            {selectedDayInfo && (
              <>
                <View style={styles.dayDetailHeader}>
                  <Text style={styles.dayDetailTitle}>
                    {selectedDate &&
                      new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDayDetail(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dayDetailContent}>
                  <View style={styles.phaseIndicator}>
                    <View
                      style={[
                        styles.phaseDot,
                        {
                          backgroundColor:
                            selectedDayInfo.phase === 'period'
                              ? Colors.primary
                              : selectedDayInfo.phase === 'fertile'
                              ? '#4A90E2'
                              : selectedDayInfo.phase === 'pms'
                              ? '#FFD93D'
                              : selectedDayInfo.phase === 'predicted_period'
                              ? selectedDayInfo.confidence === 'low'
                                ? '#CCCCCC'
                                : Colors.primary
                              : Colors.border,
                        },
                      ]}
                    />
                    <Text style={styles.phaseText}>
                      {selectedDayInfo.phase === 'period'
                        ? 'Period Day'
                        : selectedDayInfo.phase === 'fertile'
                        ? 'Fertile Window'
                        : selectedDayInfo.phase === 'pms'
                        ? 'PMS Phase'
                        : selectedDayInfo.phase === 'predicted_period'
                        ? 'Predicted Period'
                        : 'Normal Day'}
                    </Text>
                  </View>

                  {editingPeriod && selectedDate && (() => {
                    const dayInfo = getPeriodDayInfo(new Date(selectedDate), editingPeriod)
                    return dayInfo ? (
                      <View style={styles.periodDayInfo}>
                        <View style={styles.periodDayBadge}>
                          <Text style={styles.periodDayText}>{dayInfo.dayLabel}</Text>
                        </View>
                        <Text style={styles.periodDaySubtext}>
                          Day {dayInfo.dayNumber} of {dayInfo.periodLength} day period
                        </Text>
                      </View>
                    ) : null
                  })()}

                  <Text style={styles.phaseNote}>
                    {getPhaseNote(selectedDayInfo.phase)}
                  </Text>

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

                  {editingPeriod && (
                    <View style={styles.editButtonsContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEditPeriod}
                      >
                        <Ionicons name="create-outline" size={18} color={Colors.primary} />
                        <Text style={styles.editButtonText}>Edit Period Date</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeletePeriod}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        <Text style={[styles.editButtonText, { color: Colors.error }]}>
                          Delete Period
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!editingPeriod ? (
                    <TouchableOpacity
                      style={styles.logButton}
                      onPress={handleLogPeriod}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
                      <Text style={styles.logButtonText}>
                        {selectedDayInfo.phase === 'period' || selectedDayInfo.phase === 'predicted_period'
                          ? 'Log Period Start'
                          : 'Log Period or Symptom'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker Modal for Editing Period */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable style={styles.datePickerContainer} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select New Period Date</Text>
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.datePickerButton}
                  >
                    <Text style={styles.datePickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updatePeriodDate(newPeriodDate)}
                    style={[styles.datePickerButton, styles.datePickerButtonPrimary]}
                  >
                    <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextPrimary]}>
                      Save
                    </Text>
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

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={newPeriodDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendar: {
    borderRadius: 8,
  },
  legendContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 15,
    color: Colors.text,
  },
  predictionBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  predictionDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  predictionConfidence: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  predictionHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    gap: 20,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phaseDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  phaseNote: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
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
    marginTop: 8,
    marginBottom: 8,
  },
  periodDayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  periodDayText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  periodDaySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  logButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '50%',
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
